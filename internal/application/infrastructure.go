package application

import (
	"fmt"

	"fuse/internal/infrastructure/db/postgres"
	"fuse/internal/infrastructure/provider"
	"fuse/internal/infrastructure/redis"
	"fuse/internal/infrastructure/session"
	"fuse/pkg/log"

	userM "fuse/internal/domain/user/models"
	workspaceM "fuse/internal/domain/workspace/models"

	eventsSvc "fuse/internal/services/events"
)

func (a *Application) setupDatabase() error {
	db, err := postgres.NewPostgresDB(a.cfg)
	if err != nil {
		return err
	}

	if a.cfg.Database.Migrate {
		if err := db.Migrate(
			&userM.DBUser{},
			&workspaceM.DBWorkspace{},
			&workspaceM.DBMember{},
		); err != nil {
			return fmt.Errorf("migration failed: %w", err)
		}
	} else {
		log.Warn("Database migration is disabled")
	}

	a.db = db
	return nil
}

func (a *Application) setupInfrastructure() error {
	steps := []struct {
		name string
		fn   func() error
	}{
		{"redis", a.setupRedis},
		{"session manager", a.setupSession},
		{"auth provider", a.setupAuthProvider},
		{"event manager", a.setupEventManager},
	}

	for _, s := range steps {
		if err := s.fn(); err != nil {
			return fmt.Errorf("%s setup failed: %w", s.name, err)
		}
	}
	return nil
}

func (a *Application) setupRedis() error {
	client, err := redis.NewClient(a.cfg)
	if err != nil {
		return err
	}
	a.redis = client
	return nil
}

func (a *Application) setupSession() error {
	mgr, err := session.NewManager(a.cfg, a.redis)
	if err != nil {
		return err
	}
	a.sessMgr = mgr
	return nil
}

func (a *Application) setupAuthProvider() error {
	provider := provider.NewAuthProvider(a.cfg)
	if provider == nil {
		return fmt.Errorf("failed to create auth provider")
	}
	if err := provider.Setup(); err != nil {
		return err
	}
	a.authProv = provider
	return nil
}

func (a *Application) setupEventManager() error {
	a.eventManager = eventsSvc.NewService(a.cfg)
	if a.eventManager == nil {
		return ErrEventManagerInit.WithDetail("failed to create event manager")
	}
	return nil
}
