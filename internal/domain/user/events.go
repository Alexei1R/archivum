package user

import "fuse/internal/domain/events"

const (
	AccountCreatedEvent = "account.created"
)

type AccountCreated struct {
	UserName  string
	UserEmail string
}

func NewAccountCreated(userName, userEmail string) *events.BaseEvent {
	return events.NewBaseEvent(AccountCreatedEvent, AccountCreated{
		UserName:  userName,
		UserEmail: userEmail,
	})
}
