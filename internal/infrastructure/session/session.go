package session

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strconv"
	"time"

	redispkg "fuse/internal/infrastructure/redis"
	"fuse/pkg/config"
	"fuse/pkg/log"
)

type Manager struct {
	cfg *config.Config
	rc  *redispkg.RedisClient
}

func NewManager(cfg *config.Config, rc *redispkg.RedisClient) (*Manager, error) {
	if rc == nil {
		return nil, ErrRedisClientNull.WithDetail("Redis client is not initialized for session store")
	}
	return &Manager{cfg: cfg, rc: rc}, nil
}

func (m *Manager) Create(ctx context.Context, userID string, data map[string]interface{}) (string, error) {
	if userID == "" {
		return "", ErrUserIDEmpty.WithDetail("User ID cannot be empty when creating a session")
	}

	sid, err := generateSecureSessionID()
	if err != nil {
		return "", ErrGenerateSessionID.WithErr(err).WithDetail("Failed to generate secure session ID")
	}

	dur := time.Duration(m.cfg.Session.Duration) * time.Second
	log.Debug("Setting session duration to %s", dur)

	key := fmt.Sprintf("session:%s", sid)

	// NOTE: Store all data as strings for Redis compatibility
	fields := map[string]string{
		"user_id":    userID,
		"created_at": strconv.FormatInt(time.Now().Unix(), 10),
	}
	for k, v := range data {
		fields[k] = fmt.Sprintf("%v", v)
	}

	if err := m.rc.HashSetAll(ctx, key, fields); err != nil {
		return "", ErrCreateSession.WithErr(err).WithDetail("Failed to create session in Redis")
	}
	if err := m.rc.Expire(ctx, key, dur); err != nil {
		return "", ErrCreateSession.WithErr(err).WithDetail("Failed to set session expiration in Redis")
	}

	return sid, nil
}

func (m *Manager) Get(ctx context.Context, sessionID string) (map[string]string, error) {
	if sessionID == "" {
		return nil, ErrUserIDEmpty.WithDetail("Session ID cannot be empty")
	}
	key := fmt.Sprintf("session:%s", sessionID)

	data, err := m.rc.HashGetAll(ctx, key)
	if err != nil {
		if err == redispkg.ErrNotFound {
			return nil, ErrNotFound.WithErr(err).WithDetail("Session not found or expired")
		}
		return nil, ErrOperation.WithErr(err).WithDetail("Failed to retrieve session data from Redis")
	}
	return data, nil
}

func (m *Manager) Delete(ctx context.Context, sessionID string) error {
	if sessionID == "" {
		return ErrUserIDEmpty.WithDetail("Session ID cannot be empty")
	}
	key := fmt.Sprintf("session:%s", sessionID)
	if err := m.rc.Delete(ctx, key); err != nil {
		return ErrOperation.WithErr(fmt.Errorf("failed to delete session: %w", err)).WithDetail("Failed to remove session from Redis")
	}
	return nil
}

func (m *Manager) Refresh(ctx context.Context, sessionID string) error {
	if sessionID == "" {
		return ErrUserIDEmpty.WithDetail("Session ID cannot be empty")
	}
	dur := time.Duration(m.cfg.Session.Duration) * time.Second
	key := fmt.Sprintf("session:%s", sessionID)
	if err := m.rc.Expire(ctx, key, dur); err != nil {
		return ErrOperation.WithErr(fmt.Errorf("failed to refresh session: %w", err)).WithDetail("Failed to update session expiration in Redis")
	}
	return nil
}

func generateSecureSessionID() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
