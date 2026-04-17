package events

import (
	"context"
	"sync"
	"time"

	"fuse/internal/domain/events"
	"fuse/pkg/log"
)

type EventHandler func(ctx context.Context, event events.Event) error

type DispatchStrategy int

const (
	SequentialDispatch DispatchStrategy = iota
	ConcurrentDispatch
)

type Middleware func(EventHandler) EventHandler

type DispatcherConfig struct {
	Strategy          DispatchStrategy
	MaxConcurrentJobs int
	HandlerTimeout    time.Duration
	RetryAttempts     int
	RetryDelay        time.Duration
	EnableMetrics     bool
	ContinueOnError   bool
}

type Dispatcher interface {
	Register(eventName string, handler EventHandler) error
	RegisterWithMiddleware(eventName string, handler EventHandler, middleware ...Middleware) error
	Unregister(eventName string) error
	Dispatch(ctx context.Context, event events.Event) error
	DispatchAsync(ctx context.Context, event events.Event) <-chan error
	Close() error
	GetHandlerCount(eventName string) int
}

type EventDispatcher struct {
	mu         sync.RWMutex
	handlers   map[string][]EventHandler
	config     DispatcherConfig
	workerPool chan struct{}
	closed     bool
	metrics    *DispatcherMetrics
}

type DispatcherMetrics struct {
	mu                 sync.RWMutex
	eventsDispatched   map[string]int64
	eventsSucceeded    map[string]int64
	eventsFailed       map[string]int64
	avgProcessingTime  map[string]time.Duration
	lastProcessingTime map[string]time.Time
}

func NewEventDispatcher(config DispatcherConfig) *EventDispatcher {
	if config.MaxConcurrentJobs <= 0 {
		config.MaxConcurrentJobs = 10
	}
	if config.HandlerTimeout <= 0 {
		config.HandlerTimeout = 30 * time.Second
	}
	if config.RetryDelay <= 0 {
		config.RetryDelay = time.Second
	}

	return &EventDispatcher{
		handlers:   make(map[string][]EventHandler),
		config:     config,
		workerPool: make(chan struct{}, config.MaxConcurrentJobs),
		metrics:    newDispatcherMetrics(),
	}
}

func DefaultEventDispatcher() *EventDispatcher {
	return NewEventDispatcher(DispatcherConfig{
		Strategy:          SequentialDispatch,
		MaxConcurrentJobs: 10,
		HandlerTimeout:    30 * time.Second,
		RetryAttempts:     3,
		RetryDelay:        time.Second,
		EnableMetrics:     true,
		ContinueOnError:   true,
	})
}

func (d *EventDispatcher) Register(eventName string, handler EventHandler) error {
	return d.RegisterWithMiddleware(eventName, handler)
}

func (d *EventDispatcher) RegisterWithMiddleware(eventName string, handler EventHandler, middleware ...Middleware) error {
	if eventName == "" {
		return events.ErrEventNameEmpty
	}
	if handler == nil {
		return events.ErrHandlerNil
	}

	d.mu.Lock()
	defer d.mu.Unlock()

	if d.closed {
		return events.ErrDispatcherClosed
	}

	wrappedHandler := handler
	for _, mw := range middleware {
		wrappedHandler = mw(wrappedHandler)
	}

	d.handlers[eventName] = append(d.handlers[eventName], wrappedHandler)
	return nil
}

func (d *EventDispatcher) Unregister(eventName string) error {
	d.mu.Lock()
	defer d.mu.Unlock()
	delete(d.handlers, eventName)
	return nil
}

func (d *EventDispatcher) Dispatch(ctx context.Context, event events.Event) error {
	if event == nil {
		return events.ErrInvalidEvent
	}

	d.mu.RLock()
	if d.closed {
		d.mu.RUnlock()
		return events.ErrDispatcherClosed
	}

	handlers, exists := d.handlers[event.Name()]
	if !exists {
		d.mu.RUnlock()
		return nil
	}

	handlersCopy := make([]EventHandler, len(handlers))
	copy(handlersCopy, handlers)
	d.mu.RUnlock()

	startTime := time.Now()
	var dispatchErr error

	switch d.config.Strategy {
	case ConcurrentDispatch:
		dispatchErr = d.dispatchConcurrent(ctx, event, handlersCopy)
	default:
		dispatchErr = d.dispatchSequential(ctx, event, handlersCopy)
	}

	if d.config.EnableMetrics {
		d.updateMetrics(event.Name(), time.Since(startTime), dispatchErr == nil)
	}

	return dispatchErr
}

func (d *EventDispatcher) DispatchAsync(ctx context.Context, event events.Event) <-chan error {
	errChan := make(chan error, 1)
	go func() {
		defer close(errChan)
		errChan <- d.Dispatch(ctx, event)
	}()
	return errChan
}

func (d *EventDispatcher) dispatchSequential(ctx context.Context, event events.Event, handlers []EventHandler) error {
	for _, handler := range handlers {
		if err := d.executeHandler(ctx, handler, event); err != nil {
			if !d.config.ContinueOnError {
				return events.ErrEventProcessing.WithErr(err)
			}
			log.Error("Handler failed for event %s: %v", event.Name(), err)
		}
	}
	return nil
}

func (d *EventDispatcher) dispatchConcurrent(ctx context.Context, event events.Event, handlers []EventHandler) error {
	var wg sync.WaitGroup
	errChan := make(chan error, len(handlers))

	for _, handler := range handlers {
		wg.Add(1)
		go func(h EventHandler) {
			defer wg.Done()
			select {
			case d.workerPool <- struct{}{}:
				defer func() { <-d.workerPool }()
				if err := d.executeHandler(ctx, h, event); err != nil {
					errChan <- err
				}
			case <-ctx.Done():
				errChan <- ctx.Err()
			}
		}(handler)
	}

	wg.Wait()
	close(errChan)

	var lastErr error
	for err := range errChan {
		if !d.config.ContinueOnError {
			return events.ErrEventProcessing.WithErr(err)
		}
		log.Error("Handler failed for event %s: %v", event.Name(), err)
		lastErr = err
	}
	return lastErr
}

func (d *EventDispatcher) executeHandler(ctx context.Context, handler EventHandler, event events.Event) error {
	handlerCtx, cancel := context.WithTimeout(ctx, d.config.HandlerTimeout)
	defer cancel()

	var lastErr error
	for attempt := 0; attempt <= d.config.RetryAttempts; attempt++ {
		if attempt > 0 {
			time.Sleep(d.config.RetryDelay * time.Duration(attempt))
		}
		if err := handler(handlerCtx, event); err != nil {
			lastErr = err
			log.Warn("Handler attempt %d failed for event %s: %v", attempt+1, event.Name(), err)
			continue
		}
		return nil
	}
	return lastErr
}

func (d *EventDispatcher) Close() error {
	d.mu.Lock()
	defer d.mu.Unlock()

	if d.closed {
		return nil
	}

	d.closed = true

	//NOTE: Drain worker pool before closing
	for i := 0; i < d.config.MaxConcurrentJobs; i++ {
		select {
		case d.workerPool <- struct{}{}:
		default:
		}
	}
	close(d.workerPool)

	d.handlers = make(map[string][]EventHandler)
	return nil
}

func (d *EventDispatcher) GetHandlerCount(eventName string) int {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return len(d.handlers[eventName])
}

func (d *EventDispatcher) updateMetrics(eventName string, processingTime time.Duration, success bool) {
	if !d.config.EnableMetrics {
		return
	}

	d.metrics.mu.Lock()
	defer d.metrics.mu.Unlock()

	d.metrics.eventsDispatched[eventName]++
	d.metrics.lastProcessingTime[eventName] = time.Now()

	if success {
		d.metrics.eventsSucceeded[eventName]++
		if processingTime > 0 {
			current := d.metrics.avgProcessingTime[eventName]
			count := d.metrics.eventsSucceeded[eventName]
			d.metrics.avgProcessingTime[eventName] = (current*time.Duration(count-1) + processingTime) / time.Duration(count)
		}
	} else {
		d.metrics.eventsFailed[eventName]++
	}
}

func newDispatcherMetrics() *DispatcherMetrics {
	return &DispatcherMetrics{
		eventsDispatched:   make(map[string]int64),
		eventsSucceeded:    make(map[string]int64),
		eventsFailed:       make(map[string]int64),
		avgProcessingTime:  make(map[string]time.Duration),
		lastProcessingTime: make(map[string]time.Time),
	}
}
