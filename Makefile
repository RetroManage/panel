APP_NAME := retropanel

.PHONY: backend frontend build clean

backend:
	cd backend && go run ./cmd/retropanel

frontend:
	cd web && npm run dev

build:
	cd web && npm run build
	cd backend && go build -o ../$(APP_NAME) ./cmd/retropanel

clean:
	rm -rf web/dist $(APP_NAME) $(APP_NAME).exe
