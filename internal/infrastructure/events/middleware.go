package events

import (
	"context"
	"time"

	"fuse/internal/domain/events"
	"fuse/pkg/log"
)

func LoggingMiddleware() Middleware {
	return func(next EventHandler) EventHandler {
		return func(ctx context.Context, event events.Event) error {
			start := time.Now()
			log.Debug("Processing event: %s [ID: %s]", event.Name(), event.ID())

			err := next(ctx, event)

			duration := time.Since(start)
			if err != nil {
				log.Error("Event processing failed: %s [ID: %s] in %v: %v",
					event.Name(), event.ID(), duration, err)
			} else {
				log.Debug("Event processed successfully: %s [ID: %s] in %v",
					event.Name(), event.ID(), duration)
			}

			return err
		}
	}
}

func RecoveryMiddleware() Middleware {
	return func(next EventHandler) EventHandler {
		return func(ctx context.Context, event events.Event) (err error) {
			defer func() {
				if r := recover(); r != nil {
					log.Error("Panic in event handler for %s [ID: %s]: %v",
						event.Name(), event.ID(), r)
					err = events.ErrEventProcessing.WithDetail("handler panicked")
				}
			}()

			return next(ctx, event)
		}
	}
}

func MetricsMiddleware() Middleware {
	return func(next EventHandler) EventHandler {
		return func(ctx context.Context, event events.Event) error {
			start := time.Now()
			err := next(ctx, event)

			event.SetMetadata("processing_duration", time.Since(start))
			event.SetMetadata("processed_at", time.Now().UTC())

			return err
		}
	}
}

func TimeoutMiddleware(timeout time.Duration) Middleware {
	return func(next EventHandler) EventHandler {
		return func(ctx context.Context, event events.Event) error {
			ctx, cancel := context.WithTimeout(ctx, timeout)
			defer cancel()

			return next(ctx, event)
		}
	}
}
