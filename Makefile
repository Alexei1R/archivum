BINARY_NAME=fuse
BUILD_DIR=bin
MAKEFLAGS += --silent

.DEFAULT_GOAL := run

.PHONY: run build tidy clean swagger swagger-fmt  air

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
