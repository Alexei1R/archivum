package events

import (
	"time"

	"github.com/google/uuid"
)

type Event interface {
	ID() string
	Name() string
	OccurredAt() time.Time
	Payload() any
	Metadata() map[string]any
	SetMetadata(key string, value any)
}

type BaseEvent struct {
	id         string
	name       string
	occurredAt time.Time
	payload    any
	metadata   map[string]any
}

func NewBaseEvent(name string, payload any) *BaseEvent {
	return &BaseEvent{
		id:         uuid.New().String(),
		name:       name,
		occurredAt: time.Now().UTC(),
		payload:    payload,
		metadata:   make(map[string]any),
	}
}

func (e *BaseEvent) ID() string                        { return e.id }
func (e *BaseEvent) Name() string                      { return e.name }
func (e *BaseEvent) OccurredAt() time.Time             { return e.occurredAt }
func (e *BaseEvent) Payload() any                      { return e.payload }
func (e *BaseEvent) Metadata() map[string]any          { return e.metadata }
func (e *BaseEvent) SetMetadata(key string, value any) { e.metadata[key] = value }
