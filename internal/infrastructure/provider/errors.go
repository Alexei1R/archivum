package provider

import "fuse/pkg/errors"

var (
	ErrSecretMissing = errors.New("AUTH_SESSION_SECRET_MISSING", "Session secret is required for authentication")
)
