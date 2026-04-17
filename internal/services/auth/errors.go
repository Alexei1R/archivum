package auth

import "fuse/pkg/errors"

var (
	ErrAuthFailed     = errors.New("AUTHENTICATION_FAILED", "authentication failed")
	ErrSessionExpired = errors.New("SESSION_EXPIRED", "session has expired")
)
