package middleware

import (
	"net/http"
	"strconv"
	"strings"

	"fuse/pkg/config"
	"fuse/pkg/log"
)

type CORSMiddleware struct {
	enabled           bool
	allowedMethodsStr string
	allowedHeadersStr string
	exposedHeadersStr string
	maxAgeStr         string
	allowCredentials  bool
	allowedOriginsMap map[string]bool
	hasWildcard       bool
}

func NewCORSMiddleware(cfg *config.Config) *CORSMiddleware {
	cors := &CORSMiddleware{enabled: cfg.Cors.Enabled}
	if !cfg.Cors.Enabled {
		log.Info("🛑 CORS is disabled")
		return cors
	}

	cors.allowedMethodsStr = strings.Join(cfg.Cors.AllowedMethods, ", ")
	cors.allowedHeadersStr = strings.Join(cfg.Cors.AllowedHeaders, ", ")
	cors.exposedHeadersStr = strings.Join(cfg.Cors.ExposedHeaders, ", ")
	cors.maxAgeStr = strconv.Itoa(cfg.Cors.MaxAge)
	cors.allowCredentials = cfg.Cors.AllowCredentials

	cors.allowedOriginsMap = make(map[string]bool, len(cfg.Cors.AllowedOrigins))
	for _, origin := range cfg.Cors.AllowedOrigins {
		if origin == "*" {
			cors.hasWildcard = true
		}
		cors.allowedOriginsMap[origin] = true
	}

	log.Info("🤓 CORS enabled with settings:")
	log.Info("  🔸 Allowed origins: %v", cfg.Cors.AllowedOrigins)
	log.Info("  🔸 Allowed methods: %s", cors.allowedMethodsStr)
	log.Info("  🔸 Allowed headers: %s", cors.allowedHeadersStr)
	log.Info("  🔸 Exposed headers: %s", cors.exposedHeadersStr)
	log.Info("  🔸 Max age: %s", cors.maxAgeStr)
	log.Info("  🔸 Allow credentials: %v", cors.allowCredentials)

	return cors
}

func (m *CORSMiddleware) Handler() func(http.Handler) http.Handler {
	if !m.enabled {
		return func(next http.Handler) http.Handler {
			return next
		}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			m.setCORSHeaders(w, r)
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func (m *CORSMiddleware) setCORSHeaders(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")

	// Set basic CORS headers
	w.Header().Set("Access-Control-Allow-Methods", m.allowedMethodsStr)
	w.Header().Set("Access-Control-Allow-Headers", m.allowedHeadersStr)

	// Set Vary header
	if m.allowCredentials {
		w.Header().Set("Vary", "Origin, Access-Control-Request-Method, Access-Control-Request-Headers")
	} else {
		w.Header().Set("Vary", "Origin")
	}

	// Handle origin
	if m.hasWildcard && !m.allowCredentials {
		// NOTE: Wildcard with credentials is not allowed by CORS spec
		w.Header().Set("Access-Control-Allow-Origin", "*")
	} else if origin != "" && m.isOriginAllowed(origin) {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		if m.allowCredentials {
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}
	} else if origin != "" {
		log.Warn("⛔ CORS request from disallowed origin: %s", origin)
		return // Don't set CORS headers for disallowed origins
	}

	if m.exposedHeadersStr != "" {
		w.Header().Set("Access-Control-Expose-Headers", m.exposedHeadersStr)
	}

	if m.maxAgeStr != "0" {
		w.Header().Set("Access-Control-Max-Age", m.maxAgeStr)
	}
}

func (m *CORSMiddleware) isOriginAllowed(origin string) bool {
	return m.hasWildcard || m.allowedOriginsMap[origin]
}
