package provider

import (
	"fmt"
	"fuse/pkg/config"
	"fuse/pkg/log"

	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
)

type AuthProvider struct {
	cfg *config.Config
}

func NewAuthProvider(cfg *config.Config) *AuthProvider {
	return &AuthProvider{cfg: cfg}
}

func (a *AuthProvider) Setup() error {
	if err := a.setupSessionStore(); err != nil {
		return ErrSecretMissing.WithErr(err).WithDetail("Failed to set up session store")
	}

	cbURL := a.getCallbackURL("google")
	log.Info(" >> Google OAuth callback URL: %s", cbURL)

	goth.UseProviders(
		google.New(
			a.cfg.Auth.Google.ClientID,
			a.cfg.Auth.Google.ClientSecret,
			cbURL,
			"email", "profile", "openid",
		),
	)

	log.Info("Google OAuth provider configured successfully")
	return nil
}

func (a *AuthProvider) setupSessionStore() error {
	secret := a.cfg.Auth.SessionSecret
	if secret == "" {
		return ErrSecretMissing.WithDetail("Session secret is required for authentication")
	}

	store := sessions.NewCookieStore([]byte(secret))
	store.Options = &sessions.Options{
		Path:     a.cfg.Session.Cookie.Path,
		Domain:   a.cfg.Session.Cookie.Domain,
		MaxAge:   a.cfg.Session.Duration,
		Secure:   a.cfg.Session.Cookie.Secure,
		HttpOnly: a.cfg.Session.Cookie.HTTPOnly,
	}

	gothic.Store = store
	return nil
}

func (a *AuthProvider) getCallbackURL(provider string) string {
	scheme := "http"
	if a.cfg.Server.TLS.Enabled {
		scheme = "https"
	}

	//NOTE: Google only allows localhost (not 0.0.0.0) for loopback during dev
	host := a.cfg.Server.Host
	if host == "0.0.0.0" || host == "127.0.0.1" {
		host = "localhost"
	}

	return fmt.Sprintf("%s://%s:%d/auth/%s/callback",
		scheme,
		host,
		a.cfg.Server.Port,
		provider,
	)
}
