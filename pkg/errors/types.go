package errors

import (
	"fmt"
	"time"
)

type Error struct {
	Code      string    `json:"code"`
	Message   string    `json:"message"`
	Details   string    `json:"details,omitempty"`
	Err       error     `json:"-"`
	Timestamp time.Time `json:"timestamp"`
}

func (e *Error) Error() string {
	if e.Details != "" {
		return fmt.Sprintf("%s: %s", e.Message, e.Details)
	}
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

func (e *Error) Unwrap() error {
	return e.Err
}

func (e *Error) Is(target error) bool {
	t, ok := target.(*Error)
	if !ok {
		return false
	}
	return e.Code == t.Code
}

func (e *Error) WithDetail(detail string) *Error {
	return &Error{
		Code:      e.Code,
		Message:   e.Message,
		Details:   detail,
		Err:       e.Err,
		Timestamp: time.Now(),
	}
}

func (e *Error) WithErr(err error) *Error {
	return &Error{
		Code:      e.Code,
		Message:   e.Message,
		Details:   e.Details,
		Err:       err,
		Timestamp: time.Now(),
	}
}

type DomainError = Error

type HTTPError struct {
	Status  int    `json:"-"`
	Code    string `json:"code"`
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
}

func (e *HTTPError) Error() string {
	if e.Detail != "" {
		return fmt.Sprintf("%s: %s", e.Message, e.Detail)
	}
	return e.Message
}

func (e *HTTPError) WithMessage(message string) *HTTPError {
	return &HTTPError{
		Status:  e.Status,
		Code:    e.Code,
		Message: message,
		Detail:  e.Detail,
	}
}

func (e *HTTPError) WithDetail(detail string) *HTTPError {
	return &HTTPError{
		Status:  e.Status,
		Code:    e.Code,
		Message: e.Message,
		Detail:  detail,
	}
}
