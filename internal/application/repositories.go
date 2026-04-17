package application

import "fuse/internal/infrastructure/db/postgres"

func (a *Application) setupRepositories() error {
	a.userRepo = postgres.NewUserRepository(a.db.DB)
	return nil
}
