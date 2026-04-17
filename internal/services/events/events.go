package events

import (
	"context"

	eventInfra "fuse/internal/infrastructure/events"
	"fuse/pkg/config"
	"fuse/pkg/log"
)

type Service struct {
	bus eventInfra.EventBus
}

func NewService(cfg *config.Config) *Service {
	busConfig := eventInfra.DispatcherConfig{
		Strategy:          eventInfra.SequentialDispatch,
		MaxConcurrentJobs: 10,
		EnableMetrics:     cfg.Environment != "production",
		ContinueOnError:   true,
	}

	if cfg.Environment == "production" {
		busConfig.Strategy = eventInfra.ConcurrentDispatch
		busConfig.MaxConcurrentJobs = 50
	}

	bus := eventInfra.NewInMemoryEventBus(busConfig)

	return &Service{
		bus: bus,
	}
}

func (em *Service) Bus() eventInfra.EventBus {
	return em.bus
}

func (em *Service) Shutdown(ctx context.Context) error {
	log.Info("Shutting down event manager...")
	return em.bus.Close()
}
