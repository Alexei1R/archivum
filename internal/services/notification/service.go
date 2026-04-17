package notification

import (
	"context"
	"fuse/internal/domain/events"
	"fuse/pkg/config"
)

type Service struct {
	cfg *config.Config
}

func NewService(cfg *config.Config) *Service {
	return &Service{
		cfg: cfg,
	}
}

func (s *Service) SubscribeEventTest(ctx context.Context, events events.Event) error {
	return nil
}
