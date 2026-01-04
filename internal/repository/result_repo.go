package repository

import (
	"uptime_w33d/internal/models"

	"gorm.io/gorm"
)

type CheckResultRepository interface {
	Create(result *models.CheckResult) error
	GetLatestByMonitorID(monitorID uint) (*models.CheckResult, error)
	GetHistory(monitorID uint, limit int) ([]models.CheckResult, error)
	DeleteOlderThan(date string) error // For cleanup
}

type checkResultRepository struct {
	db *gorm.DB
}

func NewCheckResultRepository(db *gorm.DB) CheckResultRepository {
	return &checkResultRepository{db: db}
}

func (r *checkResultRepository) Create(result *models.CheckResult) error {
	return r.db.Create(result).Error
}

func (r *checkResultRepository) GetLatestByMonitorID(monitorID uint) (*models.CheckResult, error) {
	var result models.CheckResult
	err := r.db.Where("monitor_id = ?", monitorID).Order("created_at desc").First(&result).Error
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (r *checkResultRepository) GetHistory(monitorID uint, limit int) ([]models.CheckResult, error) {
	var results []models.CheckResult
	err := r.db.Where("monitor_id = ?", monitorID).Order("created_at desc").Limit(limit).Find(&results).Error
	return results, err
}

func (r *checkResultRepository) DeleteOlderThan(date string) error {
	// Implement cleanup logic
	return nil
}
