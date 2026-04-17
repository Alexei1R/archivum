package shutdown

import (
	"context"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"fuse/pkg/log"
)

type Shutdowner interface {
	Shutdown(ctx context.Context) error
}

func GracefulShutdown(shutdowners ...Shutdowner) {
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	<-stop
	log.Info("Shutdown signal received, initiating graceful shutdown...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var wg sync.WaitGroup
	for i, shutdowner := range shutdowners {
		wg.Add(1)
		go func(index int, s Shutdowner) {
			defer wg.Done()
			if err := s.Shutdown(ctx); err != nil {
				log.Error("Error during shutdown of component %d: %v", index, err)
			}
		}(i, shutdowner)
	}

	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		log.Info("Graceful shutdown completed")
	case <-ctx.Done():
		log.Warn("Shutdown timeout reached, forcing exit")
	}
}
