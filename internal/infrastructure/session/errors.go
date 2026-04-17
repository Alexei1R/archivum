package session

import "fuse/pkg/errors"

var (
	ErrRedisClientNull   = errors.New("SESSION_REDIS_CLIENT_NULL", "Redis client is not initialized for session store")
	ErrUserIDEmpty       = errors.New("SESSION_USER_ID_EMPTY", "User ID cannot be empty when creating a session")
	ErrGenerateSessionID = errors.New("SESSION_GENERATE_ID_ERROR", "Failed to generate secure session ID")
	ErrCreateSession     = errors.New("SESSION_CREATE_ERROR", "Failed to create session in Redis")
	ErrOperation         = errors.New("SESSION_OPERATION_ERROR", "Session operation failed")
	ErrNotFound          = errors.New("SESSION_NOT_FOUND", "Session not found in Redis")
)
