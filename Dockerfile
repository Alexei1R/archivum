# syntax=docker/dockerfile:1

FROM golang:1.24-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY cmd ./cmd
COPY internal ./internal
COPY pkg ./pkg

RUN CGO_ENABLED=0 GOOS=linux go build -buildvcs=false -o /out/fuse ./cmd/api

FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=build /out/fuse /app/fuse
COPY configs ./configs

ENV CONFIG_FILE=/app/configs/docker.toml

EXPOSE 3000

CMD ["/app/fuse"]
