package redis

import "fuse/pkg/errors"

var (
	ErrConnection = errors.New("REDIS_CONNECTION_ERROR", "Redis connection failed")
	ErrNotFound   = errors.New("REDIS_KEY_NOT_FOUND", "Redis key not found")
	ErrOperation  = errors.New("REDIS_OPERATION_FAILED", "Redis operation failed")
)
