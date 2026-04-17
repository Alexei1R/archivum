package application

import "fuse/pkg/errors"

var (
	ErrInvalidConfig    = errors.New("INVALID_CONFIG", "invalid user configuration")
	ErrServiceInit      = errors.New("SERVICE_INIT_FAILED", "service initialization failed")
	ErrServerInit       = errors.New("SERVER_INIT_FAILED", "server initialization failed")
	ErrConfigLoad       = errors.New("CONFIG_LOAD_FAILED", "failed to load configuration")
	ErrLoggerSetup      = errors.New("LOGGER_SETUP_FAILED", "failed to setup logger")
	ErrServerStart      = errors.New("SERVER_START_FAILED", "server failed to start")
	ErrDBConnection     = errors.New("DB_CONNECTION_FAILED", "failed to connect to database")
	ErrEventManagerInit = errors.New("EVENT_MANAGER_INIT_FAILED", "event manager initialization failed")
)
