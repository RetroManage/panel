package http

import (
	"context"
	"net/http"

	"retropanel/backend/internal/domain"
)

type contextKey string

const adminContextKey contextKey = "admin"

func withAdmin(r *http.Request, admin domain.Admin) *http.Request {
	ctx := context.WithValue(r.Context(), adminContextKey, admin)
	return r.WithContext(ctx)
}

func adminFromRequest(r *http.Request) (domain.Admin, bool) {
	admin, ok := r.Context().Value(adminContextKey).(domain.Admin)
	return admin, ok
}
