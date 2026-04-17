package postgres

import (
	"context"
	"fmt"
	"time"

	"fuse/pkg/config"
	"fuse/pkg/log"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type PostgresDB struct {
	DB *gorm.DB
}

func NewPostgresDB(cfg *config.Config) (*PostgresDB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s TimeZone=UTC",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Name,
		cfg.Database.SSLMode,
	)

	gormConfig := &gorm.Config{
		Logger: getGormLogger(cfg.Environment),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	}

	log.Info("Connecting to PostgreSQL database at %s:%d", cfg.Database.Host, cfg.Database.Port)

	db, err := gorm.Open(postgres.Open(dsn), gormConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := configureConnectionPool(db, cfg); err != nil {
		return nil, fmt.Errorf("failed to configure connection pool: %w", err)
	}

	if err := testConnection(db); err != nil {
		return nil, fmt.Errorf("database connection test failed: %w", err)
	}

	log.Info("Successfully connected to PostgreSQL database")
	return &PostgresDB{DB: db}, nil
}

func (db *PostgresDB) Migrate(models ...interface{}) error {
	if len(models) == 0 {
		return fmt.Errorf("no models provided for migration")
	}

	log.Info("Running database migrations...")
	if err := db.DB.AutoMigrate(models...); err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}

	log.Info("Database migrations completed successfully")
	return nil
}

func (db *PostgresDB) Close() error {
	sqlDB, err := db.DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get SQL DB instance: %w", err)
	}

	log.Info("Closing database connection")
	return sqlDB.Close()
}

func (db *PostgresDB) Shutdown(ctx context.Context) error {
	return db.Close()
}

func configureConnectionPool(db *gorm.DB, cfg *config.Config) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}

	maxIdleConns := 10
	maxOpenConns := 100
	connMaxLifetime := time.Hour

	if cfg.Environment == "production" {
		maxIdleConns = 25
		maxOpenConns = 200
	}

	sqlDB.SetMaxIdleConns(maxIdleConns)
	sqlDB.SetMaxOpenConns(maxOpenConns)
	sqlDB.SetConnMaxLifetime(connMaxLifetime)

	return nil
}

func testConnection(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return sqlDB.PingContext(ctx)
}

func getGormLogger(environment string) logger.Interface {
	//NOTE: Silent mode for production, error-only for development
	logLevel := logger.Silent

	if environment == "development" {
		logLevel = logger.Error
	}

	return logger.Default.LogMode(logLevel)
}
