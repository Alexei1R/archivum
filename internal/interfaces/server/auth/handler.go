package user

import (
	"context"
	"encoding/json"
	"fuse/pkg/config"
	"fuse/pkg/errors"
	"fuse/pkg/log"
	"net/http"

	"fuse/internal/services/auth"

	"github.com/go-chi/chi/v5"
	"github.com/markbates/goth/gothic"
)

type Handler struct {
	authSvc *auth.Service
	cfg     *config.Config
}

func NewHandler(authService *auth.Service, cfg *config.Config) *Handler {
	return &Handler{
		authSvc: authService,
		cfg:     cfg,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/auth", func(r chi.Router) {
		r.Get("/{provider}", h.BeginAuth)
		r.Get("/{provider}/callback", h.AuthCallback)
		r.Post("/logout", h.Logout)
		r.Get("/status", h.GetAuthStatus)
	})
}

func (h *Handler) BeginAuth(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	if provider == "" {
		errors.WriteError(w, errors.ErrBadRequest.WithDetail("provider is required"))
		return
	}
	r = r.WithContext(context.WithValue(r.Context(), gothic.ProviderParamKey, provider))

	gothic.BeginAuthHandler(w, r)
}

func (h *Handler) AuthCallback(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")

	if provider == "" {
		errors.WriteError(w, errors.ErrBadRequest.WithDetail("provider is required"))
		return
	}
	r = r.WithContext(context.WithValue(r.Context(), gothic.ProviderParamKey, provider))
	gu, err := gothic.CompleteUserAuth(w, r)
	if err != nil {
		log.Warn("oauth callback error: %v", err)
		errors.WriteError(w, errors.ErrUnauthorized.WithDetail("authentication failed"))
		return
	}

	_, sid, err := h.authSvc.HandleOAuthCallback(r.Context(), gu)
	if err != nil {
		log.Warn("auth service error: %v", err)
		errors.WriteError(w, errors.ErrUnauthorized.WithDetail("authentication failed in service"))
		return
	}

	h.setSessionCookie(w, sid)

	//redirect to frontend
	http.Redirect(w, r, h.cfg.Frontend.URL, http.StatusFound)

}

// GetAuthStatus
func (h *Handler) GetAuthStatus(w http.ResponseWriter, r *http.Request) {
	sessionID := h.getSessionFromCookie(r)
	if sessionID == "" {
		errors.WriteError(w, errors.ErrUnauthorized.WithDetail("missing session cookie"))
		return
	}

	u, err := h.authSvc.ValidateSession(r.Context(), sessionID)
	if err != nil {
		log.Warn("session validation error: %v", err)
		errors.WriteError(w, errors.ToHTTP(err).WithDetail("invalid session"))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(u); err != nil {
		log.Error("failed to encode user response: %v", err)
	}
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	sessionID := h.getSessionFromCookie(r)
	if sessionID == "" {
		errors.WriteError(w, errors.ErrUnauthorized.WithDetail("missing session cookie"))
		return
	}

	if err := h.authSvc.Logout(r.Context(), sessionID); err != nil {
		log.Warn("logout error: %v", err)
		errors.WriteError(w, errors.ErrInternalServer.WithDetail("failed to logout"))
		return
	}

	h.clearSessionCookie(w)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"logged out successfully"}`))
}

// NOTE: Utils
func (h *Handler) setSessionCookie(w http.ResponseWriter, sessionID string) {
	sameSite := http.SameSiteLaxMode
	if h.cfg.Environment == "production" {
		sameSite = http.SameSiteStrictMode
	}

	cookie := &http.Cookie{
		Name:     h.cfg.Session.Name,
		Value:    sessionID,
		Path:     h.cfg.Session.Cookie.Path,
		Domain:   h.cfg.Session.Cookie.Domain,
		Secure:   h.cfg.Session.Cookie.Secure,
		HttpOnly: h.cfg.Session.Cookie.HTTPOnly,
		SameSite: sameSite,
		MaxAge:   86400,
	}
	http.SetCookie(w, cookie)
}

func (h *Handler) clearSessionCookie(w http.ResponseWriter) {
	cookie := &http.Cookie{
		Name:   h.cfg.Session.Name,
		Value:  "",
		Path:   h.cfg.Session.Cookie.Path,
		MaxAge: -1,
	}
	http.SetCookie(w, cookie)
}

func (h *Handler) getSessionFromCookie(r *http.Request) string {
	cookie, err := r.Cookie(h.cfg.Session.Name)
	if err != nil {
		return ""
	}
	return cookie.Value
}
