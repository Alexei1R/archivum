BINARY_NAME=fuse
BUILD_DIR=bin
DOCKER_IMAGE=fuse-api:local
DOCKER_NETWORK=fuse-dev
POSTGRES_CONTAINER=fuse-postgres
REDIS_CONTAINER=fuse-redis
API_CONTAINER=fuse-api
MAKEFLAGS += --silent

.DEFAULT_GOAL := run

.PHONY: run build tidy clean swagger swagger-fmt air docker-up docker-down docker-logs docker-build docker-local-up docker-local-down docker-local-reset docker-local-logs docker-network docker-postgres docker-redis docker-wait

run:
	@go run -buildvcs=false cmd/api/main.go


build: 
	@echo "🔨 Building..."
	@mkdir -p $(BUILD_DIR)
	@go build -buildvcs=false -o $(BUILD_DIR)/$(BINARY_NAME) ./cmd/api/main.go
	@echo "✓ Build completed!"

tidy:
	@echo "📦 Tidying up dependencies..."
	@go mod tidy
	@echo "✓ Dependencies tidied!"

clean:
	@echo "🧹 Cleaning..."
	@go clean
	@rm -rf $(BUILD_DIR) tmp/ docs/api/
	@echo "✓ Cleanup complete!"

swagger:
	@echo "🔄 Generating swagger documentation..."
	@mkdir -p docs/api
	@swag init -g cmd/api/main.go -o docs/api --parseDependency --parseInternal
	@echo "✓ Swagger docs generated!"

swagger-fmt:
	@echo "🔧 Formatting swagger comments..."
	@swag fmt -g cmd/api/main.go
	@echo "✓ Swagger comments formatted!"

air:
	@echo "🚀 Starting live reload with Air..."
	@air

docker-build:
	@docker build -t $(DOCKER_IMAGE) .

docker-up:
	@docker compose up --build

docker-down:
	@docker compose down

docker-logs:
	@docker compose logs -f api

docker-network:
	@docker network inspect $(DOCKER_NETWORK) >/dev/null 2>&1 || docker network create $(DOCKER_NETWORK)

docker-postgres: docker-network
	@docker volume create fuse_postgres_data >/dev/null
	@if docker ps -a --format '{{.Names}}' | grep -q '^$(POSTGRES_CONTAINER)$$'; then \
		docker start $(POSTGRES_CONTAINER) >/dev/null; \
	else \
		docker run -d --name $(POSTGRES_CONTAINER) --network $(DOCKER_NETWORK) \
			-p 5432:5432 \
			-e POSTGRES_DB=fuse \
			-e POSTGRES_USER=fuse \
			-e POSTGRES_PASSWORD=fuse_dev_password \
			-v fuse_postgres_data:/var/lib/postgresql/data \
			postgres:16-alpine >/dev/null; \
	fi
	@docker network connect $(DOCKER_NETWORK) $(POSTGRES_CONTAINER) >/dev/null 2>&1 || true

docker-redis: docker-network
	@docker volume create fuse_redis_data >/dev/null
	@if docker ps -a --format '{{.Names}}' | grep -q '^$(REDIS_CONTAINER)$$'; then \
		docker start $(REDIS_CONTAINER) >/dev/null; \
	else \
		docker run -d --name $(REDIS_CONTAINER) --network $(DOCKER_NETWORK) \
			-p 6379:6379 \
			-v fuse_redis_data:/data \
			redis:7-alpine >/dev/null; \
	fi
	@docker network connect $(DOCKER_NETWORK) $(REDIS_CONTAINER) >/dev/null 2>&1 || true

docker-wait:
	@echo "Waiting for PostgreSQL..."
	@for i in $$(seq 1 30); do \
		if docker exec $(POSTGRES_CONTAINER) pg_isready -h 127.0.0.1 -U fuse -d fuse >/dev/null 2>&1; then \
			break; \
		fi; \
		if [ "$$i" = "30" ]; then \
			echo "PostgreSQL did not become ready in time"; \
			exit 1; \
		fi; \
		sleep 1; \
	done
	@echo "Waiting for Redis..."
	@for i in $$(seq 1 30); do \
		if docker exec $(REDIS_CONTAINER) redis-cli ping >/dev/null 2>&1; then \
			break; \
		fi; \
		if [ "$$i" = "30" ]; then \
			echo "Redis did not become ready in time"; \
			exit 1; \
		fi; \
		sleep 1; \
	done

docker-local-up: docker-build docker-postgres docker-redis docker-wait
	@docker rm -f $(API_CONTAINER) >/dev/null 2>&1 || true
	@docker run --name $(API_CONTAINER) --network $(DOCKER_NETWORK) \
		-p 3000:3000 \
		-e DATABASE_HOST=$(POSTGRES_CONTAINER) \
		-e REDIS_HOST=$(REDIS_CONTAINER) \
		$(DOCKER_IMAGE)

docker-local-down:
	@docker rm -f $(API_CONTAINER) >/dev/null 2>&1 || true
	@docker stop $(POSTGRES_CONTAINER) >/dev/null 2>&1 || true
	@docker stop $(REDIS_CONTAINER) >/dev/null 2>&1 || true

docker-local-reset:
	@docker rm -f $(API_CONTAINER) $(POSTGRES_CONTAINER) $(REDIS_CONTAINER) >/dev/null 2>&1 || true
	@docker volume rm fuse_postgres_data fuse_redis_data >/dev/null 2>&1 || true

docker-local-logs:
	@docker logs -f $(API_CONTAINER)
