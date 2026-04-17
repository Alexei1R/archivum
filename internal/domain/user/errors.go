package user

import "fuse/pkg/errors"

var (
	ErrInvalidEmail      = errors.New("INVALID_EMAIL", "email format is invalid")
	ErrInvalidRole       = errors.New("INVALID_ROLE", "invalid role")
	ErrInvalidStatus     = errors.New("INVALID_STATUS", "invalid status")
	ErrInvalidUser       = errors.New("INVALID_USER", "user is nil or invalid")
	ErrEmailExists       = errors.New("EMAIL_ALREADY_EXISTS", "email already exists")
	ErrCreateUserFailed  = errors.New("CREATE_USER_FAILED", "failed to create user")
	ErrUserIDEmpty       = errors.New("USER_ID_EMPTY", "user ID is empty")
	ErrUserNotFound      = errors.New("USER_NOT_FOUND", "user not found")
	ErrDatabaseOperation = errors.New("DATABASE_OPERATION_FAILED", "database operation failed")
	ErrEmailRequired     = errors.New("EMAIL_REQUIRED", "email is required")
	ErrUpdateUserFailed  = errors.New("UPDATE_USER_FAILED", "failed to update user")
	ErrDeleteUserFailed  = errors.New("DELETE_USER_FAILED", "failed to delete user")
)
