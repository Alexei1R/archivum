package workspace

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	// Workspace CRUD
	Create(ctx context.Context, workspace *Workspace) error
	FindByName(ctx context.Context, name string) (*Workspace, error)
	GetUserWorkspaces(ctx context.Context, ownerID uuid.UUID) ([]*Workspace, error)
	Update(ctx context.Context, workspace *Workspace) error
	Delete(ctx context.Context, id uuid.UUID) error

	// Membership operations
	FindByMemberID(ctx context.Context, memberID uuid.UUID) ([]*Workspace, error)
	AddMember(ctx context.Context, member *Member) error
	RemoveMember(ctx context.Context, workspaceID, userID uuid.UUID) error
	UpdateMemberRole(ctx context.Context, workspaceID, userID uuid.UUID, role Role) error
	ListMembers(ctx context.Context, workspaceID uuid.UUID) ([]*Member, error)

	CreateWorkspaceWithOwner(ctx context.Context, workspace *Workspace, owner *Member) error
}
