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
	//Subscribe to events
	// payload, ok := events.Payload().(workspace.TestWorkspaceNotification)
	// if ok {
	// 	msg := payload.Message
	// 	log.Info("Received notification event with message: %s", msg)
	// }
	return nil
}
