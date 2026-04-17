package errors

import (
	"encoding/json"
	"net/http"
	"strings"
)

const (
	CodeBadRequest         = "BAD_REQUEST"
	CodeUnauthorized       = "UNAUTHORIZED"
	CodeForbidden          = "FORBIDDEN"
	CodeNotFound           = "NOT_FOUND"
	CodeConflict           = "CONFLICT"
	CodeValidation         = "VALIDATION_ERROR"
	CodeInternalError      = "INTERNAL_ERROR"
	CodeNotImplemented     = "NOT_IMPLEMENTED"
	CodeServiceUnavailable = "SERVICE_UNAVAILABLE"
)

var (
	ErrBadRequest         = &HTTPError{Status: http.StatusBadRequest, Code: CodeBadRequest, Message: "Invalid request"}
	ErrUnauthorized       = &HTTPError{Status: http.StatusUnauthorized, Code: CodeUnauthorized, Message: "Authentication required"}
	ErrForbidden          = &HTTPError{Status: http.StatusForbidden, Code: CodeForbidden, Message: "Access denied"}
	ErrNotFound           = &HTTPError{Status: http.StatusNotFound, Code: CodeNotFound, Message: "Resource not found"}
	ErrConflict           = &HTTPError{Status: http.StatusConflict, Code: CodeConflict, Message: "Resource conflict"}
	ErrValidation         = &HTTPError{Status: http.StatusBadRequest, Code: CodeValidation, Message: "Validation failed"}
	ErrInternalServer     = &HTTPError{Status: http.StatusInternalServerError, Code: CodeInternalError, Message: "Internal server error"}
	ErrNotImplemented     = &HTTPError{Status: http.StatusNotImplemented, Code: CodeNotImplemented, Message: "Feature not implemented"}
	ErrServiceUnavailable = &HTTPError{Status: http.StatusServiceUnavailable, Code: CodeServiceUnavailable, Message: "Service temporarily unavailable"}
	ErrNameExists         = &HTTPError{Status: http.StatusConflict, Code: "NAME_EXISTS", Message: "Resource with the given name already exists"}
)

func WriteError(w http.ResponseWriter, err *HTTPError) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(err.Status)

	if encodeErr := json.NewEncoder(w).Encode(err); encodeErr != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

func ToHTTP(err error) *HTTPError {
	if httpErr, ok := err.(*HTTPError); ok {
		return httpErr
	}

	domainErr, ok := err.(*Error)
	if !ok {
		return ErrInternalServer.WithDetail(err.Error())
	}

	httpErr := mapDomainToHTTP(domainErr)
	if domainErr.Details != "" {
		httpErr = httpErr.WithDetail(domainErr.Details)
	}

	return httpErr
}

func mapDomainToHTTP(err *Error) *HTTPError {
	errorMappings := map[string]*HTTPError{
		"NOT_FOUND":         ErrNotFound,
		"UNAUTHORIZED":      ErrUnauthorized,
		"PERMISSION_DENIED": ErrForbidden,
		"INVALID":           ErrBadRequest,
		"REQUIRED":          ErrBadRequest,
		"EXISTS":            ErrConflict,
		"CONFLICT":          ErrConflict,
		"FAILED":            ErrInternalServer,
	}

	for pattern, httpErr := range errorMappings {
		if strings.Contains(err.Code, pattern) {
			return httpErr.WithMessage(err.Message)
		}
	}

	return ErrInternalServer.WithMessage(err.Message)
}
