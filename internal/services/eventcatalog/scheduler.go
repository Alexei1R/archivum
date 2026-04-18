package eventcatalog

import (
	"context"
	"sync"
	"time"

	"fuse/pkg/log"
)

type Scheduler struct {
	cancel   context.CancelFunc
	interval time.Duration
	service  *Service
	wg       sync.WaitGroup
}

func NewScheduler(service *Service, interval time.Duration) *Scheduler {
	if interval <= 0 {
		interval = 30 * time.Minute
	}

	return &Scheduler{
		interval: interval,
		service:  service,
	}
}

func (s *Scheduler) Start(ctx context.Context) {
	if s.cancel != nil {
		return
	}

	runCtx, cancel := context.WithCancel(ctx)
	s.cancel = cancel
	s.wg.Add(1)

	go func() {
		defer s.wg.Done()
		s.runRefresh(runCtx)

		ticker := time.NewTicker(s.interval)
		defer ticker.Stop()

		for {
			select {
			case <-runCtx.Done():
				return
			case <-ticker.C:
				s.runRefresh(runCtx)
			}
		}
	}()
}

func (s *Scheduler) Stop() {
	if s.cancel == nil {
		return
	}
	s.cancel()
	s.wg.Wait()
	s.cancel = nil
}

func (s *Scheduler) runRefresh(ctx context.Context) {
	refreshCtx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()

	stats, err := s.service.Refresh(refreshCtx)
	if err != nil {
		log.Warn("event refresh failed: %v", err)
		return
	}

	log.Info("event refresh completed: found=%d saved=%d errors=%d", stats.Found, stats.Saved, len(stats.Errors))
}
