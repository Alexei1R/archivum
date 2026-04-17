package redis

import (
	"context"
	"fmt"
	"time"

	"fuse/pkg/config"
	"fuse/pkg/log"

	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	client *redis.Client
	cfg    *config.Config
}

func NewClient(cfg *config.Config) (*RedisClient, error) {
	log.Info("Initializing Redis client at %s:%d", cfg.Redis.Host, cfg.Redis.Port)

	opts := &redis.Options{
		Addr:     fmt.Sprintf("%s:%d", cfg.Redis.Host, cfg.Redis.Port),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	}
	if cfg.Redis.Username != "" {
		opts.Username = cfg.Redis.Username
	}

	c := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := c.Ping(ctx).Err(); err != nil {
		return nil, ErrConnection.WithErr(fmt.Errorf("failed to connect to Redis: %w", err))
	}

	log.Info("Redis client connected successfully")
	return &RedisClient{client: c, cfg: cfg}, nil
}

func (c *RedisClient) Close() error {
	if err := c.client.Close(); err != nil {
		return ErrConnection.WithErr(fmt.Errorf("failed to close Redis connection: %w", err))
	}
	log.Info("Redis connection closed")
	return nil
}

func (c *RedisClient) Shutdown(ctx context.Context) error {
	return c.Close()
}

func (c *RedisClient) Get(ctx context.Context, key string) (string, error) {
	val, err := c.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", ErrNotFound.WithDetail(fmt.Sprintf("key %s not found", key))
	}
	if err != nil {
		return "", ErrOperation.WithErr(fmt.Errorf("get failed: %w", err))
	}
	return val, nil
}

func (c *RedisClient) Set(ctx context.Context, key string, value any, expiration time.Duration) error {
	if err := c.client.Set(ctx, key, value, expiration).Err(); err != nil {
		return ErrOperation.WithErr(fmt.Errorf("set failed for key %s: %w", key, err))
	}
	return nil
}

func (c *RedisClient) Delete(ctx context.Context, keys ...string) error {
	if err := c.client.Del(ctx, keys...).Err(); err != nil {
		return ErrOperation.WithErr(fmt.Errorf("delete failed: %w", err))
	}
	return nil
}

func (c *RedisClient) Exists(ctx context.Context, key string) (bool, error) {
	res, err := c.client.Exists(ctx, key).Result()
	if err != nil {
		return false, ErrOperation.WithErr(fmt.Errorf("exists check failed for key %s: %w", key, err))
	}
	return res > 0, nil
}

func (c *RedisClient) HashSet(ctx context.Context, key string, field string, value any) error {
	if err := c.client.HSet(ctx, key, field, value).Err(); err != nil {
		return ErrOperation.WithErr(fmt.Errorf("hash set failed for key %s field %s: %w", key, field, err))
	}
	return nil
}

// NOTE: Bulk set for efficiency
func (c *RedisClient) HashSetAll(ctx context.Context, key string, fields map[string]string) error {
	if len(fields) == 0 {
		return nil
	}
	args := make([]any, 0, len(fields)*2)
	for k, v := range fields {
		args = append(args, k, v)
	}
	if err := c.client.HSet(ctx, key, args...).Err(); err != nil {
		return ErrOperation.WithErr(fmt.Errorf("hash setall failed for key %s: %w", key, err))
	}
	return nil
}

func (c *RedisClient) HashGet(ctx context.Context, key string, field string) (string, error) {
	val, err := c.client.HGet(ctx, key, field).Result()
	if err == redis.Nil {
		return "", ErrNotFound.WithDetail(fmt.Sprintf("hash field %s in key %s not found", field, key))
	}
	if err != nil {
		return "", ErrOperation.WithErr(fmt.Errorf("hash get failed: %w", err))
	}
	return val, nil
}

func (c *RedisClient) HashGetAll(ctx context.Context, key string) (map[string]string, error) {
	vals, err := c.client.HGetAll(ctx, key).Result()
	if err != nil {
		return nil, ErrOperation.WithErr(fmt.Errorf("hash getall failed for key %s: %w", key, err))
	}
	if len(vals) == 0 {
		return nil, ErrNotFound.WithDetail(fmt.Sprintf("hash key %s not found or empty", key))
	}
	return vals, nil
}

func (c *RedisClient) Expire(ctx context.Context, key string, expiration time.Duration) error {
	if err := c.client.Expire(ctx, key, expiration).Err(); err != nil {
		return ErrOperation.WithErr(fmt.Errorf("expire failed for key %s: %w", key, err))
	}
	return nil
}

func (c *RedisClient) GetClient() *redis.Client {
	return c.client
}
