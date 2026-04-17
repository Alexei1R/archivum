package user

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	// Basic CRUD
	Create(ctx context.Context, user *User) error
	FindByID(ctx context.Context, id uuid.UUID) (*User, error)
	FindByEmail(ctx context.Context, email string) (*User, error)
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id uuid.UUID) error

	// Basic search
	Search(ctx context.Context, query string, limit int) ([]*User, error)

	// Existence checks
	ExistsByEmail(ctx context.Context, email string) (bool, error)
}
