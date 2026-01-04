package repository

import (
	"errors"

	"gorm.io/gorm"

	"uptime_w33d/internal/models"
)

type GroupRepository interface {
	Create(group *models.MonitorGroup) error
	GetByID(id uint) (*models.MonitorGroup, error)
	GetAll() ([]models.MonitorGroup, error)
	Update(group *models.MonitorGroup) error
	Delete(id uint) error
}

type groupRepository struct {
	db *gorm.DB
}

func NewGroupRepository(db *gorm.DB) GroupRepository {
	return &groupRepository{db: db}
}

func (r *groupRepository) Create(group *models.MonitorGroup) error {
	return r.db.Create(group).Error
}

func (r *groupRepository) GetByID(id uint) (*models.MonitorGroup, error) {
	var group models.MonitorGroup
	if err := r.db.First(&group, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &group, nil
}

func (r *groupRepository) GetAll() ([]models.MonitorGroup, error) {
	var groups []models.MonitorGroup
	if err := r.db.Order("\"order\" asc").Find(&groups).Error; err != nil {
		return nil, err
	}
	return groups, nil
}

func (r *groupRepository) Update(group *models.MonitorGroup) error {
	return r.db.Save(group).Error
}

func (r *groupRepository) Delete(id uint) error {
	return r.db.Delete(&models.MonitorGroup{}, id).Error
}
