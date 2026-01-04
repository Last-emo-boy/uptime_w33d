package repository

import (
	"uptime_w33d/internal/models"
)

func Migrate() error {
	return DB.AutoMigrate(
		&models.User{},
		&models.Monitor{},
		&models.MonitorGroup{},
		&models.CheckResult{},
		&models.Incident{},
		&models.NotificationChannel{},
		&models.Subscription{},
	)
}
