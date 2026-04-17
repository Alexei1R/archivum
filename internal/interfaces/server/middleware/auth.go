package middleware

import (
	"context"
	"fuse/pkg/config"
	"fuse/pkg/errors"
	"net/http"

	"fuse/internal/services/auth"

	"github.com/google/uuid"
)

type AuthMiddleware struct {
	cfg         *config.Config
	authService *auth.Service
}

const (
	UserIDKey = "user_id"
)

func NewAuthMiddleware(authService *auth.Service, cfg *config.Config) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
		cfg:         cfg,
	}
}

func (m *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessionID := m.getSessionFromCookie(r)
		if sessionID == "" {
			errors.WriteError(w, errors.ErrUnauthorized.WithDetail("authentication required"))
			return
		}

		usr, err := m.authService.ValidateSession(r.Context(), sessionID)
		if err != nil {
			errors.WriteError(w, errors.ToHTTP(err))
			return
		}
		ctx := context.WithValue(r.Context(), UserIDKey, usr.ID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (m *AuthMiddleware) getSessionFromCookie(r *http.Request) string {
	cookie, err := r.Cookie(m.cfg.Session.Name)
	if err != nil {
		return ""
	}
	return cookie.Value
}

func GetUserIDFromContext(ctx context.Context) uuid.UUID {
	if userID, ok := ctx.Value(UserIDKey).(uuid.UUID); ok {
		return userID
	}
	return uuid.Nil
}
