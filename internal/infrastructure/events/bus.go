package events

import (
	"context"
	"sync"
	"time"

	"fuse/internal/domain/events"
)

type EventBus interface {
	Subscribe(eventName string, handler EventHandler) error
	Unsubscribe(eventName string) error
	Publish(ctx context.Context, event events.Event) error
	PublishAsync(ctx context.Context, event events.Event) <-chan error
	Close() error
}

type InMemoryEventBus struct {
	dispatcher        Dispatcher
	mu                sync.RWMutex
	closed            bool
	defaultMiddleware []Middleware
}

func NewInMemoryEventBus(config DispatcherConfig) *InMemoryEventBus {
	return &InMemoryEventBus{
		dispatcher: NewEventDispatcher(config),
		defaultMiddleware: []Middleware{
			RecoveryMiddleware(),
			LoggingMiddleware(),
			MetricsMiddleware(),
		},
	}
}

func DefaultEventBus() *InMemoryEventBus {
	return NewInMemoryEventBus(DispatcherConfig{
		Strategy:          SequentialDispatch,
		MaxConcurrentJobs: 10,
		HandlerTimeout:    30 * time.Second,
		RetryAttempts:     3,
		RetryDelay:        time.Second,
		EnableMetrics:     true,
		ContinueOnError:   true,
	})
}

func (b *InMemoryEventBus) Subscribe(eventName string, handler EventHandler) error {
	b.mu.RLock()
	defer b.mu.RUnlock()

	if b.closed {
		return events.ErrDispatcherClosed
	}

	return b.dispatcher.RegisterWithMiddleware(eventName, handler, b.defaultMiddleware...)
}

func (b *InMemoryEventBus) Unsubscribe(eventName string) error {
	b.mu.RLock()
	defer b.mu.RUnlock()

	if b.closed {
		return events.ErrDispatcherClosed
	}

	return b.dispatcher.Unregister(eventName)
}

func (b *InMemoryEventBus) Publish(ctx context.Context, event events.Event) error {
	b.mu.RLock()
	defer b.mu.RUnlock()

	if b.closed {
		return events.ErrDispatcherClosed
	}

	return b.dispatcher.Dispatch(ctx, event)
}

func (b *InMemoryEventBus) PublishAsync(ctx context.Context, event events.Event) <-chan error {
	b.mu.RLock()
	defer b.mu.RUnlock()

	if b.closed {
		errChan := make(chan error, 1)
		errChan <- events.ErrDispatcherClosed
		close(errChan)
		return errChan
	}

	return b.dispatcher.DispatchAsync(ctx, event)
}

func (b *InMemoryEventBus) Close() error {
	b.mu.Lock()
	defer b.mu.Unlock()

	if b.closed {
		return nil
	}

	b.closed = true
	return b.dispatcher.Close()
}
