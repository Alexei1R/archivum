package user

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/markbates/goth"
)

type Status string

const (
	StatusActive     Status = "active"
	StatusOnboarding Status = "onboarding"
	StatusPending    Status = "pending"
	StatusInactive   Status = "inactive"
)

type AuthProvider string

type User struct {
	ID       uuid.UUID `json:"id"`
	Email    string    `json:"email"`
	Name     string    `json:"name"`
	NickName string    `json:"nickname"`
	Status   Status    `json:"status"`

	Provider AuthProvider `json:"provider"`
	Avatar   string       `json:"avatar,omitempty"`

	Location  string    `json:"location,omitempty"`
	UpdatedAt time.Time `json:"updated_at"`
	CreatedAt time.Time `json:"created_at"`
}

func NewUser(user *goth.User) (*User, error) {

	return &User{
		ID:        uuid.New(),
		UpdatedAt: time.Now(),

		CreatedAt: time.Now(),
		Email:     strings.ToLower(user.Email),
		Name:      user.Name,
		NickName:  user.NickName,

		Status:   StatusOnboarding,
		Provider: AuthProvider(user.Provider),
		Avatar:   user.AvatarURL,
		Location: user.Location,
	}, nil
}

func (u *User) UpdateStatus(status Status) error {
	if !(status == StatusActive || status == StatusOnboarding || status == StatusPending || status == StatusInactive) {
		return ErrInvalidStatus
	}
	u.Status = status
	u.UpdatedAt = time.Now()
	return nil
}
