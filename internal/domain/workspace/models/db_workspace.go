package models

import (
	"fuse/internal/domain/workspace"
	"fuse/internal/infrastructure/db"

	"github.com/google/uuid"
)

type DBWorkspace struct {
	db.Model

	Name    string `gorm:"not null;size:255" json:"name"`
	OwnerID string `gorm:"not null;size:36" json:"owner_id"`
	Plan    string `gorm:"not null;default:'free';size:50" json:"plan"`

	//Relations
	Members []DBMember `gorm:"foreignKey:WorkspaceID" json:"members"`
}

func (DBWorkspace) TableName() string {
	return "workspaces"
}

func FromDomain(domainWorkspace *workspace.Workspace) *DBWorkspace {
	return &DBWorkspace{
		Model:   db.Model{ID: domainWorkspace.ID, CreatedAt: domainWorkspace.CreatedAt, UpdatedAt: domainWorkspace.UpdatedAt},
		Name:    domainWorkspace.Name,
		OwnerID: domainWorkspace.OwnerID.String(),
		Plan:    string(domainWorkspace.Plan),
	}
}

func (d *DBWorkspace) ToDomain() *workspace.Workspace {
	return &workspace.Workspace{
		ID:        d.ID,
		Name:      d.Name,
		OwnerID:   uuid.MustParse(d.OwnerID),
		Plan:      workspace.Plan(d.Plan),
		CreatedAt: d.CreatedAt,
		UpdatedAt: d.UpdatedAt,
	}
}

//NOTE: Member

type DBMember struct {
	db.Model
	UserID      string `gorm:"not null;size:36" json:"user_id"`
	WorkspaceID string `gorm:"not null;size:36" json:"workspace_id"`
	Role        string `gorm:"not null;default:'member';size:50" json:"role"`
}

func (DBMember) TableName() string {
	return "workspace_members"
}

func FromDomainMember(domainMember *workspace.Member) *DBMember {
	return &DBMember{
		Model:       db.Model{ID: domainMember.ID, CreatedAt: domainMember.CreatedAt, UpdatedAt: domainMember.UpdatedAt},
		UserID:      domainMember.UserID.String(),
		WorkspaceID: domainMember.WorkspaceID.String(),
		Role:        string(domainMember.Role),
	}
}

func (d *DBMember) ToDomain() *workspace.Member {
	return &workspace.Member{
		ID:          d.ID,
		UserID:      uuid.MustParse(d.UserID),
		WorkspaceID: uuid.MustParse(d.WorkspaceID),
		Role:        workspace.Role(d.Role),
		CreatedAt:   d.CreatedAt,
		UpdatedAt:   d.UpdatedAt,
	}
}
