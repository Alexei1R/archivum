package application

import (
	"fuse/internal/services/auth"
	"fuse/internal/services/mail"
	"fuse/internal/services/notification"
)

func (a *Application) setupServices() error {
	a.authSvc = auth.NewService(a.userRepo, a.sessMgr, a.eventManager.Bus())
	a.mailSvc = mail.NewService(a.cfg, a.eventManager)
	a.mailSvc.Setup()
	a.notificationSvc = notification.NewService(a.cfg)
	return nil
}
