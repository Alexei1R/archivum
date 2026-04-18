package application

import (
	"fmt"

	"fuse/pkg/config"
	"fuse/pkg/log"
	"fuse/pkg/shutdown"

	"fuse/internal/infrastructure/db/postgres"
	"fuse/internal/infrastructure/provider"
	"fuse/internal/infrastructure/redis"
	"fuse/internal/infrastructure/session"

	"fuse/internal/services/auth"
	eventCatalogSvc "fuse/internal/services/eventcatalog"
	eventsSvc "fuse/internal/services/events"
	"fuse/internal/services/mail"
	svcNotification "fuse/internal/services/notification"

	"fuse/internal/interfaces/server"
	authH "fuse/internal/interfaces/server/auth"
	eventCatalogH "fuse/internal/interfaces/server/events"
	healthH "fuse/internal/interfaces/server/health"
	mailH "fuse/internal/interfaces/server/mail"
	authMW "fuse/internal/interfaces/server/middleware"

	"fuse/internal/domain/eventcatalog"
	"fuse/internal/domain/user"
)

type Application struct {
	// Core
	cfg          *config.Config
	srv          *server.Server
	eventManager *eventsSvc.Service

	// Infrastructure
	db       *postgres.PostgresDB
	redis    *redis.RedisClient
	authProv *provider.AuthProvider
	sessMgr  *session.Manager

	// Repositories
	userRepo  user.Repository
	eventRepo eventcatalog.Repository

	// Services
	authSvc         *auth.Service
	eventCatalogSvc *eventCatalogSvc.Service
	eventScheduler  *eventCatalogSvc.Scheduler
	mailSvc         *mail.Service
	notificationSvc *svcNotification.Service

	// Middleware
	authMW *authMW.AuthMiddleware

	// Handlers
	healthHandler *healthH.Handler
	authHandler   *authH.Handler
	eventHandler  *eventCatalogH.Handler
	mailHandler   *mailH.Handler
}

func NewApplication() (*Application, error) {
	cfg, err := config.LoadConfig()
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrConfigLoad, err)
	}
	return &Application{cfg: cfg}, nil
}

func (a *Application) Run() error {
	if err := a.initialize(); err != nil {
		return fmt.Errorf("application initialization failed: %w", err)
	}

	if err := a.srv.Start(); err != nil {
		return fmt.Errorf("HTTP server failed to start: %w", err)
	}

	shutdown.GracefulShutdown(a.srv, a.db)
	return nil
}

func (a *Application) initialize() error {
	steps := []struct {
		name string
		fn   func() error
	}{
		{"logger", a.setupLogger},
		{"database", a.setupDatabase},
		{"infrastructure", a.setupInfrastructure},
		{"repositories", a.setupRepositories},
		{"services", a.setupServices},
		{"handlers", a.setupHandlers},
		{"server", a.setupServer},
		{"dispatchEvents", a.dispatchEvents},
	}

	if a.cfg.Environment != "production" {
		log.Warn("Running in non-production mode: %s", a.cfg.Environment)
	}

	for _, s := range steps {
		if err := s.fn(); err != nil {
			return fmt.Errorf("%s initialization failed: %w", s.name, err)
		}
	}
	return nil
}

func (a *Application) setupLogger() error {
	if err := log.Setup(log.Console, ""); err != nil {
		return fmt.Errorf("%w: %v", ErrLoggerSetup, err)
	}
	return nil
}
