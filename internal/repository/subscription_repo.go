package repository

import (
	"uptime_w33d/internal/models"

	"gorm.io/gorm"
)

type SubscriptionRepository interface {
	Subscribe(monitorID, channelID uint) error
	Unsubscribe(monitorID, channelID uint) error
	GetChannelsByMonitorID(monitorID uint) ([]models.NotificationChannel, error)
}

type subscriptionRepository struct {
	db *gorm.DB
}

func NewSubscriptionRepository(db *gorm.DB) SubscriptionRepository {
	return &subscriptionRepository{db: db}
}

func (r *subscriptionRepository) Subscribe(monitorID, channelID uint) error {
	sub := models.Subscription{
		MonitorID: monitorID,
		ChannelID: channelID,
	}
	return r.db.Create(&sub).Error
}

func (r *subscriptionRepository) Unsubscribe(monitorID, channelID uint) error {
	return r.db.Where("monitor_id = ? AND channel_id = ?", monitorID, channelID).Delete(&models.Subscription{}).Error
}

func (r *subscriptionRepository) GetChannelsByMonitorID(monitorID uint) ([]models.NotificationChannel, error) {
	var channels []models.NotificationChannel
	// Join subscription table
	err := r.db.Table("notification_channels").
		Joins("JOIN subscriptions ON subscriptions.channel_id = notification_channels.id").
		Where("subscriptions.monitor_id = ?", monitorID).
		Find(&channels).Error
	return channels, err
}
