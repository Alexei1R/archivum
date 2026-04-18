package application

import (
	authH "fuse/internal/interfaces/server/auth"
	eventCatalogH "fuse/internal/interfaces/server/events"
	healthH "fuse/internal/interfaces/server/health"
	mailH "fuse/internal/interfaces/server/mail"
	authMW "fuse/internal/interfaces/server/middleware"

	"fuse/internal/interfaces/server"
	"github.com/go-chi/chi/v5"
)

func (a *Application) setupHandlers() error {
	a.healthHandler = healthH.NewHandler(a.cfg)
	a.authMW = authMW.NewAuthMiddleware(a.authSvc, a.cfg)
	a.authHandler = authH.NewHandler(a.authSvc, a.cfg)
	a.eventHandler = eventCatalogH.NewHandler(a.eventCatalogSvc)
	a.mailHandler = mailH.NewHandler(a.cfg, a.mailSvc)
	return nil
}

func (a *Application) setupServer() error {
	opts := []server.ServerOption{
		server.WithRoutes(func(r chi.Router) {
			a.healthHandler.RegisterRoutes(r)
			a.authHandler.RegisterRoutes(r)
			a.eventHandler.RegisterRoutes(r)
			a.mailHandler.RegisterRoutes(r, a.authMW)
		}),
	}
	a.srv = server.NewServer(a.cfg, opts...)
	return nil
}
