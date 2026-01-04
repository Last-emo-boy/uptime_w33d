package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

var Rdb *redis.Client

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

func InitRedis(cfg RedisConfig) error {
	Rdb = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := Rdb.Ping(ctx).Result()
	return err
}

func Set(key string, value interface{}, expiration time.Duration) error {
	if Rdb == nil {
		return nil // Graceful degradation if Redis is not configured or failed
	}
	return Rdb.Set(context.Background(), key, value, expiration).Err()
}

func Get(key string) (string, error) {
	if Rdb == nil {
		return "", fmt.Errorf("redis not initialized")
	}
	return Rdb.Get(context.Background(), key).Result()
}

func Delete(key string) error {
	if Rdb == nil {
		return nil
	}
	return Rdb.Del(context.Background(), key).Err()
}
