.PHONY: help dev build run test lint clean

help:
	@echo "LacLingo Backend Commands"
	@echo "========================"
	@echo "make dev      - Run with hot reload (Air)"
	@echo "make run      - Run normally"
	@echo "make build    - Build binary"
	@echo "make test     - Run tests"
	@echo "make lint     - Run linter"
	@echo "make clean    - Clean build artifacts"

dev:
	air

run:
	go run ./cmd/server

build:
	go build -o bin/server ./cmd/server

test:
	go test ./...

lint:
	golangci-lint run

clean:
	rm -rf bin/ tmp/ build-errors.log
