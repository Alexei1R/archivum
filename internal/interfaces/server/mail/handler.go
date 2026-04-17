package mail

import (
	"encoding/json"
	"fuse/internal/interfaces/server/middleware"
	"fuse/internal/services/mail"
	"fuse/pkg/config"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	cfg     *config.Config
	mailSvc *mail.Service
}

func NewHandler(cfg *config.Config, mailSvc *mail.Service) *Handler {
	return &Handler{
		cfg:     cfg,
		mailSvc: mailSvc,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router, authMiddleware *middleware.AuthMiddleware) {
	r.Route("/mail", func(r chi.Router) {
		r.Post("/", h.SendIssueMail)
	})
}

type SendIssueRequest struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

// POST /mail
func (h *Handler) SendIssueMail(w http.ResponseWriter, r *http.Request) {
	var req SendIssueRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	err := h.mailSvc.SendIssueMail(
		[]string{req.To},
		req.Subject,
		req.Body,
	)
	if err != nil {
		http.Error(w, "failed to send email: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"sent"}`))
}
