package events

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"fuse/internal/domain/eventcatalog"
	eventSvc "fuse/internal/services/eventcatalog"
	"fuse/pkg/errors"
	"fuse/pkg/log"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	events *eventSvc.Service
}

func NewHandler(events *eventSvc.Service) *Handler {
	return &Handler{events: events}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/api/events", func(r chi.Router) {
		r.Get("/", h.List)
		r.Get("/sync", h.SyncStatus)
		r.Post("/refresh", h.Refresh)
	})
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	query, err := parseQuery(r)
	if err != nil {
		errors.WriteError(w, errors.ErrBadRequest.WithDetail(err.Error()))
		return
	}

	page, err := h.events.List(r.Context(), query)
	if err != nil {
		log.Warn("events list error: %v", err)
		errors.WriteError(w, errors.ErrInternalServer.WithDetail("failed to list events"))
		return
	}

	writeJSON(w, http.StatusOK, page)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	stats, err := h.events.Refresh(r.Context())
	if err != nil {
		log.Warn("events refresh error: %v", err)
		errors.WriteError(w, errors.ErrInternalServer.WithDetail("failed to refresh events"))
		return
	}

	writeJSON(w, http.StatusAccepted, stats)
}

func (h *Handler) SyncStatus(w http.ResponseWriter, r *http.Request) {
	stats, err := h.events.LatestSync(r.Context())
	if err != nil {
		log.Warn("event sync status error: %v", err)
		errors.WriteError(w, errors.ErrInternalServer.WithDetail("failed to read event sync status"))
		return
	}

	if stats == nil {
		writeJSON(w, http.StatusOK, map[string]any{"status": "never_run"})
		return
	}

	writeJSON(w, http.StatusOK, stats)
}

func parseQuery(r *http.Request) (eventcatalog.Query, error) {
	values := r.URL.Query()
	limit := parseInt(values.Get("limit"), 30)
	page := parseInt(values.Get("page"), 0)
	if page < 0 {
		page = 0
	}
	if limit <= 0 || limit > 100 {
		limit = 30
	}

	query := eventcatalog.Query{
		Category: values.Get("category"),
		Country:  values.Get("country"),
		Limit:    limit,
		Offset:   page * limit,
		Search:   values.Get("q"),
	}

	if from := values.Get("from"); from != "" {
		parsed, err := parseTime(from)
		if err != nil {
			return query, err
		}
		query.From = &parsed
	}
	if to := values.Get("to"); to != "" {
		parsed, err := parseTime(to)
		if err != nil {
			return query, err
		}
		query.To = &parsed
	}

	return query, nil
}

func parseInt(value string, fallback int) int {
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func parseTime(value string) (time.Time, error) {
	if parsed, err := time.Parse(time.RFC3339, value); err == nil {
		return parsed, nil
	}

	return time.Parse("2006-01-02", value)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Error("failed to encode events response: %v", err)
	}
}
