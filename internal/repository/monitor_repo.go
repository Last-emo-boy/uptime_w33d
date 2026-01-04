package repository

import (
	"errors"

	"gorm.io/gorm"

	"uptime_w33d/internal/models"
)

type MonitorRepository interface {
	Create(monitor *models.Monitor) error
	GetByID(id uint) (*models.Monitor, error)
	GetByPushToken(token string) (*models.Monitor, error)
	GetAll(userID uint) ([]models.Monitor, error)
	Update(monitor *models.Monitor) error
	Delete(id uint) error
}

type monitorRepository struct {
	db *gorm.DB
}

func NewMonitorRepository(db *gorm.DB) MonitorRepository {
	return &monitorRepository{db: db}
}

func (r *monitorRepository) Create(monitor *models.Monitor) error {
	return r.db.Create(monitor).Error
}

func (r *monitorRepository) GetByID(id uint) (*models.Monitor, error) {
	var monitor models.Monitor
	if err := r.db.Preload("Group").First(&monitor, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &monitor, nil
}

func (r *monitorRepository) GetByPushToken(token string) (*models.Monitor, error) {
	var monitor models.Monitor
	if err := r.db.Where("push_token = ?", token).First(&monitor).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &monitor, nil
}

func (r *monitorRepository) GetAll(userID uint) ([]models.Monitor, error) {
	var monitors []models.Monitor
	if err := r.db.Preload("Group").Find(&monitors).Error; err != nil {
		return nil, err
	}
	return monitors, nil
}

func (r *monitorRepository) Update(monitor *models.Monitor) error {
	return r.db.Save(monitor).Error
}

func (r *monitorRepository) Delete(id uint) error {
	return r.db.Delete(&models.Monitor{}, id).Error
}
