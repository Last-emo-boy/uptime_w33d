package main

import (
	"flag"
	"fmt"
	"os"

	"go.uber.org/zap"

	"uptime_w33d/internal/api"
	"uptime_w33d/internal/config"
	"uptime_w33d/internal/repository"
	"uptime_w33d/internal/scheduler"
	"uptime_w33d/internal/services"
	"uptime_w33d/pkg/cache"
	"uptime_w33d/pkg/logger"
)

func main() {
	configPath := flag.String("config", "configs/config.yaml", "Path to configuration file")
	migrate := flag.Bool("migrate", false, "Run database migrations")
	flag.Parse()

	// 1. Load Config
	cfg, err := config.LoadConfig(*configPath)
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	// 2. Init Logger
	if err := logger.InitLogger(cfg.Log.Level, cfg.Log.Encoding); err != nil {
		fmt.Printf("Failed to init logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	logger.Log.Info("Starting Uptime W33d Server...",
		zap.String("version", "0.1.0"),
		zap.String("env", cfg.Server.Mode),
	)

	// Initialize Redis
	redisCfg := cache.RedisConfig{
		Host:     cfg.Redis.Host,
		Port:     cfg.Redis.Port,
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	}
	if err := cache.InitRedis(redisCfg); err != nil {
		logger.Log.Warn("Failed to connect to Redis, caching will be disabled", zap.Error(err))
	} else {
		logger.Log.Info("Connected to Redis")
	}

	// 3. Init Database
	if err := repository.InitDB(cfg.Database); err != nil {
		logger.Log.Error("Failed to connect to database", zap.Error(err))
		// Continue only if not migrating, but usually we need DB
		// For development, if DB fails, we can't do much.
		// However, if the user doesn't have Postgres running, we exit.
		// os.Exit(1) 
	} else {
		logger.Log.Info("Database connected successfully")
		
		// 4. Run Migrations
		// Always auto-migrate on startup to ensure schema consistency
		logger.Log.Info("Running database migrations...")
		if err := repository.Migrate(); err != nil {
			logger.Log.Error("Failed to run migrations", zap.Error(err))
			// Exit on migration failure in prod might be safer, but for now we log error
			// os.Exit(1)
		} else {
			logger.Log.Info("Migrations completed successfully")
		}
	}

	// 5. Start Scheduler
	monitorRepo := repository.NewMonitorRepository(repository.DB)
	resultRepo := repository.NewCheckResultRepository(repository.DB)
	subRepo := repository.NewSubscriptionRepository(repository.DB)
	notifySvc := services.NewNotificationService(subRepo)

	sched := scheduler.NewScheduler(monitorRepo, resultRepo, notifySvc)
	sched.Start()
	defer sched.Stop()

	// 6. Setup Router & Start Server
	r := api.SetupRouter(cfg, repository.DB)
	
	addr := ":" + cfg.Server.Port
	logger.Log.Info("Server listening", zap.String("addr", addr))
	
	if err := r.Run(addr); err != nil {
		logger.Log.Fatal("Server failed to start", zap.Error(err))
	}
}
