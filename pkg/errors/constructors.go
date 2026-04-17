package errors

import "time"

func New(code, message string) *Error {
	return &Error{
		Code:      code,
		Message:   message,
		Timestamp: time.Now(),
	}
}

func NewWithDetail(code, message, detail string) *Error {
	return &Error{
		Code:      code,
		Message:   message,
		Details:   detail,
		Timestamp: time.Now(),
	}
}

func Wrap(err error, code, message string) *Error {
	return &Error{
		Code:      code,
		Message:   message,
		Err:       err,
		Timestamp: time.Now(),
	}
}

func NewHTTP(status int, code, message string) *HTTPError {
	return &HTTPError{
		Status:  status,
		Code:    code,
		Message: message,
	}
}
