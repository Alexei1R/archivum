package server

import "fuse/pkg/errors"

var (
	ErrServerStart    = errors.New("SERVER_START_FAILED", "failed to start HTTP server")
	ErrServerShutdown = errors.New("SERVER_SHUTDOWN_FAILED", "failed to shutdown HTTP server gracefully")
	ErrInvalidRoute   = errors.New("INVALID_ROUTE", "route configuration is invalid")
	ErrMiddleware     = errors.New("MIDDLEWARE_ERROR", "middleware configuration failed")
)
