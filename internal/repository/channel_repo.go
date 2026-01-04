package repository

import (
	"uptime_w33d/internal/models"

	"gorm.io/gorm"
)

type ChannelRepository interface {
	Create(channel *models.NotificationChannel) error
	GetByID(id uint) (*models.NotificationChannel, error)
	GetAll() ([]models.NotificationChannel, error)
	Update(channel *models.NotificationChannel) error
	Delete(id uint) error
}

type channelRepository struct {
	db *gorm.DB
}

func NewChannelRepository(db *gorm.DB) ChannelRepository {
	return &channelRepository{db: db}
}

func (r *channelRepository) Create(channel *models.NotificationChannel) error {
	return r.db.Create(channel).Error
}

func (r *channelRepository) GetByID(id uint) (*models.NotificationChannel, error) {
	var channel models.NotificationChannel
	if err := r.db.First(&channel, id).Error; err != nil {
		return nil, err
	}
	return &channel, nil
}

func (r *channelRepository) GetAll() ([]models.NotificationChannel, error) {
	var channels []models.NotificationChannel
	if err := r.db.Find(&channels).Error; err != nil {
		return nil, err
	}
	return channels, nil
}

func (r *channelRepository) Update(channel *models.NotificationChannel) error {
	return r.db.Save(channel).Error
}

func (r *channelRepository) Delete(id uint) error {
	return r.db.Delete(&models.NotificationChannel{}, id).Error
}
