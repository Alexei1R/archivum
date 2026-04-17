package events

import "fuse/pkg/errors"

var (
	ErrEventNameEmpty     = errors.New("EVENT_NAME_EMPTY", "event name cannot be empty")
	ErrHandlerNil         = errors.New("HANDLER_NIL", "event handler cannot be nil")
	ErrDispatcherClosed   = errors.New("DISPATCHER_CLOSED", "event dispatcher is closed")
	ErrEventProcessing    = errors.New("EVENT_PROCESSING_ERROR", "error processing event")
	ErrInvalidEvent       = errors.New("INVALID_EVENT", "invalid event provided")
	ErrEventPublishFailed = errors.New("EVENT_PUBLISH_FAILED", "failed to publish event")
)
