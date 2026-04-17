package mail

import (
	"context"
	"fmt"
	"fuse/pkg/config"
	"fuse/pkg/log"

	"github.com/matcornic/hermes/v2"
	"gopkg.in/gomail.v2"

	"fuse/internal/domain/events"
	"fuse/internal/domain/user"
	eventSvc "fuse/internal/services/events"
)

type Service struct {
	cfg      *config.Config
	eventSvc *eventSvc.Service
	from     string
	password string
	name     string
}

func NewService(cfg *config.Config, eventSvc *eventSvc.Service) *Service {
	return &Service{
		cfg:      cfg,
		eventSvc: eventSvc,
		from:     cfg.Mail.From,
		password: cfg.Mail.Password,
		name:     cfg.Mail.Name,
	}
}

func (s *Service) Setup() error {
	log.Info("Setting up mail service and subscribing to events...")
	s.eventSvc.Bus().Subscribe(
		user.AccountCreatedEvent,
		func(ctx context.Context, event events.Event) error {
			payload, ok := event.Payload().(user.AccountCreated)
			if !ok {
				return fmt.Errorf("invalid payload for account created event")
			}

			log.Info("Received account created event, sending email...")
			log.Info("Payload: %+v", payload)

			return s.SendAccountCreatedMail(
				[]string{payload.UserEmail},
				payload.UserName,
			)
		},
	)
	return nil
}

func (s *Service) SendAccountCreatedMail(to []string, username string) error {
	h := hermes.Hermes{
		Product: hermes.Product{
			Name:      "Fuse",
			Link:      "https://www.fuse.com/",
			Copyright: "© 2025 Fuse. Toate drepturile rezervate.",
		},
		Theme: new(hermes.Default),
	}

	email := hermes.Email{
		Body: hermes.Body{
			Name: username,
			Intros: []string{
				"Bun venit pe platforma Fuse! Contul tău a fost creat cu succes.",
			},
			Actions: []hermes.Action{
				{
					Instructions: "Pentru a începe să folosești platforma, apasă butonul de mai jos:",
					Button: hermes.Button{
						Color: "#4F46E5",
						Text:  "Accesează Contul",
						Link:  "https://www.fuse.com/",
					},
				},
			},
			Outros: []string{
				"Dacă ai întrebări, echipa noastră de suport este aici pentru tine: support@fuse.app",
				"Îți dorim o experiență plăcută!",
			},
			Signature: "Echipa Fuse",
		},
	}

	htmlContent, err := h.GenerateHTML(email)
	if err != nil {
		return fmt.Errorf("failed to generate account creation email: %w", err)
	}

	return sendEmail(s.from, s.password, to, "Cont creat cu succes!", htmlContent)
}

func (s *Service) SendIssueMail(to []string, subject, message string) error {
	h := hermes.Hermes{
		Product: hermes.Product{
			Name:      "Fuse",
			Link:      "https://www.fuse.com/",
			Copyright: "© 2025 Fuse. Toate drepturile rezervate.",
		},
		Theme: new(hermes.Default),
	}

	email := hermes.Email{
		Body: hermes.Body{
			Name: "Admin",
			Intros: []string{
				"A fost raportată o nouă problemă:",
			},
			Dictionary: []hermes.Entry{
				{Key: "Mesaj", Value: message},
			},
			Outros: []string{
				"Echipa va analiza problema și va reveni cu detalii.",
			},
		},
	}

	htmlContent, err := h.GenerateHTML(email)
	if err != nil {
		return fmt.Errorf("failed to generate issue email template: %w", err)
	}

	return sendEmail(s.from, s.password, to, fmt.Sprintf("[ISSUE] %s", subject), htmlContent)
}

func sendEmail(from, password string, to []string, subject, htmlContent string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", to...)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", htmlContent)

	d := gomail.NewDialer("smtp.gmail.com", 587, from, password)
	return d.DialAndSend(m)
}
