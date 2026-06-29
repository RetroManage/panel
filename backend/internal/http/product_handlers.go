package http

import (
	"errors"
	"net/http"

	"retropanel/backend/internal/domain"
	"retropanel/backend/internal/store"
)

func (s *Server) listProducts(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"items": s.store.Products()})
}

func (s *Server) createProduct(w http.ResponseWriter, r *http.Request) {
	var input domain.ProductInput
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid product payload")
		return
	}
	product, err := s.store.SaveProduct("", input)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, product)
}

func (s *Server) updateProduct(w http.ResponseWriter, r *http.Request) {
	var input domain.ProductInput
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid product payload")
		return
	}
	product, err := s.store.SaveProduct(r.PathValue("id"), input)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "product not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, product)
}

func (s *Server) deleteProduct(w http.ResponseWriter, r *http.Request) {
	if err := s.store.DeleteProduct(r.PathValue("id")); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "product not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not delete product")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "items": s.store.Products()})
}
