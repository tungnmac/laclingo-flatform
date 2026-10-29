# Backend Go Fiber — build tĩnh (CGO tắt), chạy trên Alpine nhỏ gọn bằng user không phải root.
# Build từ GỐC repo (cần packages/database/migrations): docker build -f apps/laclingo/backend/Dockerfile -t laclingo-backend .
FROM golang:1.25-alpine AS build
WORKDIR /src
COPY apps/laclingo/backend/go.mod apps/laclingo/backend/go.sum ./
RUN go mod download
COPY apps/laclingo/backend/ .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

FROM alpine:3.20
# ca-certificates: gọi HTTPS (Stripe, VNPay, Google, Apple, R2...); tzdata: time.LoadLocation("Asia/Ho_Chi_Minh")
RUN apk add --no-cache ca-certificates tzdata && adduser -D -H -u 10001 app
USER app
COPY --from=build /out/server /usr/local/bin/server
# Backend tự áp migration chưa chạy lúc khởi động (MIGRATIONS_DIR) — xem internal/repository/migrate.go
COPY packages/database/migrations /migrations
ENV PORT=8080 APP_ENV=production TZ=Asia/Ho_Chi_Minh MIGRATIONS_DIR=/migrations
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1
ENTRYPOINT ["/usr/local/bin/server"]
