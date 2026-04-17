package settings

import (
	"fuse/internal/interfaces/server/middleware"
	"fuse/pkg/config"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	cfg *config.Config
}

func NewHandler(cfg *config.Config) *Handler {
	return &Handler{
		cfg: cfg,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router, authMiddleware *middleware.AuthMiddleware) {
	r.Route("/settings", func(r chi.Router) {
		r.Use(authMiddleware.RequireAuth)
		r.Get("/", h.GetSettings)

	})
}

func (h *Handler) GetSettings(w http.ResponseWriter, r *http.Request) {
	// userID := middleware.GetUserIDFromContext(r.Context())
	// if userID == uuid.Nil {
	// 	log.Warn("user ID not found in context")
	// 	errors.WriteError(w, errors.ErrUnauthorized.WithDetail("user not authenticated"))
	// 	return
	// }
	//
	// settings := map[string]interface{}{
	// 	"frontend_url": h.cfg.Frontend.URL,
	// 	"environment":  h.cfg.Environment,
	// 	"version":      h.cfg.Version,
	// }
	//
	// w.Header().Set("Content-Type", "application/json")
	// if err := json.NewEncoder(w).Encode(settings); err != nil {
	// 	log.Error("failed to encode settings response: %v", err)
	// 	errors.WriteError(w, errors.ErrInternalServerError.WithDetail("failed to encode response"))
	// 	return
	// }
}
