package services

import (
	"time"

	"go.uber.org/zap"

	"uptime_w33d/internal/models"
	"uptime_w33d/internal/notification"
	"uptime_w33d/internal/repository"
	"uptime_w33d/pkg/logger"
)

type NotificationService interface {
	Notify(monitor models.Monitor, newStatus string, message string)
	RegisterNotifier(n notification.Notifier)
}

type notificationService struct {
	subRepo   repository.SubscriptionRepository
	notifiers map[string]notification.Notifier
}

func NewNotificationService(subRepo repository.SubscriptionRepository) NotificationService {
	s := &notificationService{
		subRepo:   subRepo,
		notifiers: make(map[string]notification.Notifier),
	}
	
	// Register built-in notifiers
	s.RegisterNotifier(notification.NewWebhookNotifier())
	s.RegisterNotifier(notification.NewEmailNotifier())
	s.RegisterNotifier(notification.NewDiscordNotifier())
	s.RegisterNotifier(notification.NewTelegramNotifier())
	
	return s
}

func (s *notificationService) RegisterNotifier(n notification.Notifier) {
	s.notifiers[n.Type()] = n
}

func (s *notificationService) Notify(monitor models.Monitor, newStatus string, message string) {
	// 1. Get Subscribed Channels
	channels, err := s.subRepo.GetChannelsByMonitorID(monitor.ID)
	if err != nil {
		logger.Log.Error("Failed to fetch subscriptions for notification", zap.Error(err))
		return
	}

	if len(channels) == 0 {
		return
	}

	msg := notification.NotificationMessage{
		MonitorName: monitor.Name,
		Target:      monitor.Target,
		Status:      newStatus,
		Message:     message,
		Time:        time.Now().Format(time.RFC3339),
	}

	// 2. Send to each channel
	for _, ch := range channels {
		if !ch.Enabled {
			continue
		}

		notifier, exists := s.notifiers[ch.Type]
		if !exists {
			logger.Log.Warn("Unknown notifier type", zap.String("type", ch.Type))
			continue
		}

		// Run in goroutine to not block
		go func(n notification.Notifier, config string, chName string) {
			if err := n.Send(config, msg); err != nil {
				logger.Log.Error("Failed to send notification", 
					zap.String("channel", chName), 
					zap.Error(err))
			} else {
				logger.Log.Info("Notification sent", zap.String("channel", chName))
			}
		}(notifier, ch.Config, ch.Name)
	}
}
