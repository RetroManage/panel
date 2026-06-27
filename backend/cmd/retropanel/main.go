package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"retropanel/backend/internal/config"
	panelhttp "retropanel/backend/internal/http"
	"retropanel/backend/internal/store"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	cfg := config.Load()
	db, err := store.Open(cfg.DatabasePath)
	if err != nil {
		logger.Error("open store", "error", err)
		os.Exit(1)
	}

	if err := db.EnsureOwner(cfg.AdminUser, cfg.AdminPassword); err != nil {
		logger.Error("seed owner", "error", err)
		os.Exit(1)
	}

	handler := panelhttp.NewServer(cfg, db, logger)
	srv := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		logger.Info("retropanel listening", "addr", cfg.HTTPAddr, "database", cfg.DatabasePath)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("http server", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("shutdown", "error", err)
	}
}
