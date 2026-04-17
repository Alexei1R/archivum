package config

import (
	"fmt"
	"os"
	"strings"
	"sync"

	"github.com/go-playground/validator/v10"
	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

var (
	cfg      *Config
	once     sync.Once
	validate *validator.Validate
)

func init() {
	loadEnvFile()
	validate = validator.New()
	if err := validate.RegisterValidation("environment", validateEnvironment); err != nil {
		panic(fmt.Sprintf("Failed to register custom validator: %v", err))
	}
}

func validateEnvironment(fl validator.FieldLevel) bool {
	env := fl.Field().String()
	validEnvs := []string{"development", "staging", "production"}
	for _, validEnv := range validEnvs {
		if env == validEnv {
			return true
		}
	}
	return false
}

func LoadConfig() (*Config, error) {
	var err error
	once.Do(func() {
		err = loadConfig()
	})
	return cfg, err
}

func Get() *Config {
	if cfg == nil {
		var err error
		cfg, err = LoadConfig()
		if err != nil {
			panic(fmt.Sprintf("Failed to load configuration: %v", err))
		}
	}
	return cfg
}

func loadEnvFile() {
	envFiles := []string{".env.local", ".env"}
	for _, file := range envFiles {
		if _, err := os.Stat(file); err == nil {
			if err := godotenv.Load(file); err != nil {
				fmt.Printf("Warning: Could not load %s: %v\n", file, err)
			}
			return
		}
	}
}

func loadConfig() error {
	if err := setupViper(); err != nil {
		return err
	}

	cfg = &Config{}
	if err := viper.Unmarshal(cfg); err != nil {
		return fmt.Errorf("error unmarshaling config: %w", err)
	}

	if err := validate.Struct(cfg); err != nil {
		return fmt.Errorf("configuration validation failed: %w", err)
	}

	return nil
}

func setupViper() error {
	if configFile := os.Getenv("CONFIG_FILE"); configFile != "" {
		viper.SetConfigFile(configFile)
		if err := viper.ReadInConfig(); err != nil {
			return fmt.Errorf("failed to read config file %q: %w", configFile, err)
		}

		viper.AutomaticEnv()
		viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
		return nil
	}

	configNames := []string{"config", "dev", "development", "prod", "production"}
	configPaths := []string{".", "./configs", "./config", "./configurations"}

	viper.SetConfigType("toml")

	for _, path := range configPaths {
		viper.AddConfigPath(path)
	}

	var configFound bool
	for _, name := range configNames {
		viper.SetConfigName(name)
		if err := viper.ReadInConfig(); err == nil {
			configFound = true
			break
		}
	}

	if !configFound {
		return fmt.Errorf("no config file found. Expected one of: %v in paths: %v", configNames, configPaths)
	}

	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	return nil
}
