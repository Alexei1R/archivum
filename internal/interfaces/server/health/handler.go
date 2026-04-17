package health

import (
	"encoding/json"
	"net/http"
	"time"

	"fuse/pkg/config"
	"fuse/pkg/log"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	cfg       *config.Config
	startTime time.Time
}

type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Version   string            `json:"version"`
	Uptime    string            `json:"uptime"`
	Services  map[string]string `json:"services,omitempty"`
}

func NewHandler(cfg *config.Config) *Handler {
	return &Handler{
		cfg:       cfg,
		startTime: time.Now(),
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/health", h.Health)
	r.Get("/uptime", h.Uptime)
}

// @Summary		Health Check
// @Description	Get application health status
// @Tags			health
// @Accept			json
// @Produce		json
// @Success		200	{object}	HealthResponse
// @Router			/health [get]
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Version:   h.cfg.Version,
		Uptime:    time.Since(h.startTime).String(),
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Error("Failed to encode health response: %v", err)
	}
}

// @Summary		Uptime Check
// @Description	Get application uptime
// @Tags			health
// @Accept			json
// @Produce		json
// @Success		200	{object}	map[string]string
// @Router			/uptime [get]
func (h *Handler) Uptime(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{
		"uptime": time.Since(h.startTime).String(),
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Error("Failed to encode uptime response: %v", err)
	}
}
