package workspace

import (
	"time"

	"github.com/google/uuid"
)

type Plan string

const (
	PlanFree       Plan = "free"
	PlanPro        Plan = "pro"
	PlanEnterprise Plan = "enterprise"
)

type Workspace struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	OwnerID   uuid.UUID `json:"owner_id"`
	Plan      Plan      `json:"plan"`
	UpdatedAt time.Time `json:"updated_at"`
	CreatedAt time.Time `json:"created_at"`
}

func NewWorkspace(name string, ownerID uuid.UUID) *Workspace {
	now := time.Now()
	return &Workspace{
		ID:        uuid.New(),
		Name:      name,
		OwnerID:   ownerID,
		Plan:      PlanFree,
		UpdatedAt: now,
		CreatedAt: now,
	}
}

type Role string

const (
	RoleOwner  Role = "owner"
	RoleAdmin  Role = "admin"
	RoleMember Role = "member"
)

type Member struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	WorkspaceID uuid.UUID `json:"workspace_id"`
	Role        Role      `json:"role"`
	UpdatedAt   time.Time `json:"updated_at"`
	CreatedAt   time.Time `json:"created_at"`
}

func NewMember(userID, workspaceID uuid.UUID, role Role) *Member {
	now := time.Now().UTC()
	return &Member{
		ID:          uuid.New(),
		UserID:      userID,
		WorkspaceID: workspaceID,
		Role:        role,
		UpdatedAt:   now,
		CreatedAt:   now,
	}
}
