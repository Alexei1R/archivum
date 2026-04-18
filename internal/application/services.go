package application

import (
	"context"
	"time"

	"fuse/internal/services/auth"
	"fuse/internal/services/eventcatalog"
	"fuse/internal/services/mail"
	"fuse/internal/services/notification"
)

func (a *Application) setupServices() error {
	a.authSvc = auth.NewService(a.userRepo, a.sessMgr, a.eventManager.Bus())
	a.eventCatalogSvc = eventcatalog.NewService(a.eventRepo)
	a.eventScheduler = eventcatalog.NewScheduler(
		a.eventCatalogSvc,
		time.Duration(a.cfg.Events.RefreshIntervalSeconds)*time.Second,
	)
	a.eventScheduler.Start(context.Background())
	a.mailSvc = mail.NewService(a.cfg, a.eventManager)
	a.mailSvc.Setup()
	a.notificationSvc = notification.NewService(a.cfg)
	return nil
}
