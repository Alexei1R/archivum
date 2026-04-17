package server

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"

	"fuse/internal/interfaces/server/middleware"
	"fuse/pkg/config"
	"fuse/pkg/log"
)

type Server struct {
	cfg         *config.Config
	router      *chi.Mux
	server      *http.Server
	cors        *middleware.CORSMiddleware
	routeSetups []func(chi.Router)
}

type ServerOption func(*Server)

func WithRoutes(registerFn func(r chi.Router)) ServerOption {
	return func(s *Server) {
		s.routeSetups = append(s.routeSetups, registerFn)
	}
}

func NewServer(cfg *config.Config, opts ...ServerOption) *Server {
	server := &Server{
		cfg:         cfg,
		router:      chi.NewRouter(),
		cors:        middleware.NewCORSMiddleware(cfg),
		routeSetups: make([]func(chi.Router), 0),
	}

	for _, opt := range opts {
		opt(server)
	}

	server.setupMiddleware()
	server.registerRoutes()
	return server
}

func (s *Server) Start() error {
	addr := fmt.Sprintf("%s:%d", s.cfg.Server.Host, s.cfg.Server.Port)

	s.server = &http.Server{
		Addr:    addr,
		Handler: s.router,
	}

	s.logStartup(addr)

	if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return ErrServerStart.WithErr(err)
	}
	return nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	if s.server == nil {
		return nil
	}

	log.Info("Shutting down HTTP server...")
	if err := s.server.Shutdown(ctx); err != nil {
		return ErrServerShutdown.WithErr(err)
	}
	return nil
}

func (s *Server) setupMiddleware() {
	s.router.Use(
		s.cors.Handler(), //NOTE: CORS must be first
		chimiddleware.RequestID,
		chimiddleware.RealIP,
		s.loggingMiddleware(),
		chimiddleware.Recoverer,
		chimiddleware.Timeout(600*time.Second),
	)
}

func (s *Server) registerRoutes() {
	for _, setupFn := range s.routeSetups {
		setupFn(s.router)
	}
}

func (s *Server) loggingMiddleware() func(http.Handler) http.Handler {
	if s.cfg.Environment == "production" {
		return chimiddleware.Logger
	}
	return chimiddleware.DefaultLogger
}

func (s *Server) getTimeoutOrDefault(configured, defaultTimeout time.Duration) time.Duration {
	if configured > 0 {
		return configured
	}
	return defaultTimeout
}

func (s *Server) logStartup(addr string) {
	log.Info("🚀 Server starting on %s", addr)
}
