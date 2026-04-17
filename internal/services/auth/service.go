package auth

import (
	"context"
	"errors"

	"fuse/internal/domain/user"
	"fuse/internal/infrastructure/events"
	sessions "fuse/internal/infrastructure/session"
	"fuse/pkg/log"

	"github.com/google/uuid"
	"github.com/markbates/goth"
)

type Service struct {
	userRepo       user.Repository
	sessionManager *sessions.Manager
	eventBus       events.EventBus
}

func NewService(userRepo user.Repository, sessionManager *sessions.Manager, eventBus events.EventBus) *Service {
	return &Service{
		userRepo:       userRepo,
		sessionManager: sessionManager,
		eventBus:       eventBus,
	}
}

func (s *Service) HandleOAuthCallback(ctx context.Context, gothUser goth.User) (*user.User, string, error) {
	existingUser, err := s.userRepo.FindByEmail(ctx, gothUser.Email)
	if err != nil && !errors.Is(err, user.ErrUserNotFound) {
		return nil, "", user.ErrDatabaseOperation.WithErr(err)
	}

	var usr *user.User
	var isNewUser bool

	if existingUser == nil {
		log.Info("Creating new user for email: %s", gothUser.Email)
		usr, err = user.NewUser(&gothUser)
		if err != nil {
			log.Error("failed to create user from goth user: %v", err)
			return nil, "", err
		}
		if err := s.userRepo.Create(ctx, usr); err != nil {
			return nil, "", err
		}
		isNewUser = true
	} else {
		usr = existingUser
	}

	sessionData := map[string]any{
		"user_id":    usr.ID.String(),
		"user_email": usr.Email,
		"user_name":  usr.Name,
		"provider":   string(usr.Provider),
	}

	sessionID, err := s.sessionManager.Create(ctx, usr.ID.String(), sessionData)
	if err != nil {
		return nil, "", ErrAuthFailed.WithErr(err)
	}

	if isNewUser {
		if err := s.eventBus.Publish(ctx, user.NewAccountCreated(usr.Name, usr.Email)); err != nil {
			return nil, "", ErrAuthFailed.WithErr(err)
		}
	}

	return usr, sessionID, nil
}

func (s *Service) ValidateSession(ctx context.Context, sessionID string) (*user.User, error) {
	if sessionID == "" {
		return nil, ErrSessionExpired.WithDetail("empty session ID")
	}

	sessionData, err := s.sessionManager.Get(ctx, sessionID)
	if err != nil {
		return nil, ErrSessionExpired.WithErr(err)
	}

	userIDStr, ok := sessionData["user_id"]
	if !ok || userIDStr == "" {
		return nil, ErrSessionExpired.WithDetail("user ID not found in session")
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, ErrSessionExpired.WithDetail("invalid user ID format")
	}

	usr, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			return nil, ErrSessionExpired.WithDetail("user no longer exists")
		}
		return nil, err
	}

	//NOTE: Refresh session on successful validation
	if err := s.sessionManager.Refresh(ctx, sessionID); err != nil {
		return nil, ErrSessionExpired.WithErr(err)
	}

	return usr, nil
}

func (s *Service) Logout(ctx context.Context, sessionID string) error {
	if sessionID == "" {
		return ErrSessionExpired.WithDetail("empty session ID")
	}
	log.Info("Logging out session: %s", sessionID)
	return s.sessionManager.Delete(ctx, sessionID)
}

func (s *Service) GetCurrentUser(ctx context.Context, sessionID string) (*user.User, error) {
	return s.ValidateSession(ctx, sessionID)
}
