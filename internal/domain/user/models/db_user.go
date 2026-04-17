package models

import (
	"fuse/internal/domain/user"
	"fuse/internal/infrastructure/db"
)

type DBUser struct {
	// NOTE: Embedding the base model to include ID, CreatedAt, UpdatedAt, DeletedAt
	db.Model

	// User Fields from  entity
	// ID       uuid.UUID `json:"id"`
	// Email    string    `json:"email"`
	// Name     string    `json:"name"`
	// NickName string    `json:"nickname"`
	// Status   Status    `json:"status"`
	// Provider AuthProvider `json:"provider"`
	// Avatar   string       `json:"avatar,omitempty"`
	// Location  string    `json:"location,omitempty"`
	// UpdatedAt time.Time `json:"updated_at"`
	// CreatedAt time.Time `json:"created_at"`

	Email    string `gorm:"uniqueIndex;not null;size:255" json:"email"`
	Name     string `gorm:"not null;size:255" json:"name"`
	NickName string `gorm:"uniqueIndex;size:100" json:"nickname,omitempty"`
	Status   string `gorm:"not null;default:'active';size:50" json:"status"`
	Provider string `gorm:"not null;size:50" json:"provider"`
	Avatar   string `gorm:"size:500" json:"avatar,omitempty"`
	Location string `gorm:"size:255" json:"location,omitempty"`
}

// NOTE: Specify custom table name
func (DBUser) TableName() string {
	return "users"
}

// NOTE: Convert domain model to DB model
func FromDomain(domainUser *user.User) *DBUser {
	return &DBUser{
		Model:    db.Model{ID: domainUser.ID, CreatedAt: domainUser.CreatedAt, UpdatedAt: domainUser.UpdatedAt},
		Email:    domainUser.Email,
		Name:     domainUser.Name,
		NickName: domainUser.NickName,
		Status:   string(domainUser.Status),
		Provider: string(domainUser.Provider),
		Avatar:   domainUser.Avatar,
		Location: domainUser.Location,
	}
}

// NOTE: Convert DB model to domain model
func (d *DBUser) ToDomain() *user.User {
	return &user.User{
		ID:        d.ID,
		Email:     d.Email,
		Name:      d.Name,
		NickName:  d.NickName,
		Status:    user.Status(d.Status),
		Provider:  user.AuthProvider(d.Provider),
		Avatar:    d.Avatar,
		Location:  d.Location,
		CreatedAt: d.CreatedAt,
		UpdatedAt: d.UpdatedAt,
	}
}
