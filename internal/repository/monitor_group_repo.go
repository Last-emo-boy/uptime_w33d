package repository

import (
	"uptime_w33d/internal/models"

	"gorm.io/gorm"
)

type MonitorGroupRepository interface {
	Create(group *models.MonitorGroup) error
	GetByID(id uint) (*models.MonitorGroup, error)
	GetAll() ([]models.MonitorGroup, error)
	Update(group *models.MonitorGroup) error
	Delete(id uint) error
}

type monitorGroupRepository struct {
	db *gorm.DB
}

func NewMonitorGroupRepository(db *gorm.DB) MonitorGroupRepository {
	return &monitorGroupRepository{db: db}
}

func (r *monitorGroupRepository) Create(group *models.MonitorGroup) error {
	return r.db.Create(group).Error
}

func (r *monitorGroupRepository) GetByID(id uint) (*models.MonitorGroup, error) {
	var group models.MonitorGroup
	err := r.db.First(&group, id).Error
	if err != nil {
		return nil, err
	}
	return &group, nil
}

func (r *monitorGroupRepository) GetAll() ([]models.MonitorGroup, error) {
	var groups []models.MonitorGroup
	err := r.db.Order("\"order\" asc").Find(&groups).Error
	return groups, err
}

func (r *monitorGroupRepository) Update(group *models.MonitorGroup) error {
	return r.db.Save(group).Error
}

func (r *monitorGroupRepository) Delete(id uint) error {
	// Optional: Reset monitors in this group to null group
	r.db.Model(&models.Monitor{}).Where("group_id = ?", id).Update("group_id", nil)
	return r.db.Delete(&models.MonitorGroup{}, id).Error
}
