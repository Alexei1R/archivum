package main

import (
	"fuse/internal/application"
	"fuse/pkg/log"
	"os"
)

func main() {
	app, err := application.NewApplication()
	if err != nil {
		log.Error("Failed to create application: %v", err)
		os.Exit(1)
	}

	if err := app.Run(); err != nil {
		log.Error("Application failed: %v", err)
		os.Exit(1)
	}
}
