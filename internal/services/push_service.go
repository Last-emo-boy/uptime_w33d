package services

import (
	"errors"
	"time"

	"go.uber.org/zap"

	"uptime_w33d/internal/models"
	"uptime_w33d/internal/repository"
	"uptime_w33d/pkg/logger"
)

type PushService interface {
	ProcessHeartbeat(token string, status string, msg string, ping int64) error
}

type pushService struct {
	monitorRepo repository.MonitorRepository
	resultRepo  repository.CheckResultRepository
	notifySvc   NotificationService
}

func NewPushService(
	monitorRepo repository.MonitorRepository,
	resultRepo repository.CheckResultRepository,
	notifySvc NotificationService,
) PushService {
	return &pushService{
		monitorRepo: monitorRepo,
		resultRepo:  resultRepo,
		notifySvc:   notifySvc,
	}
}

func (s *pushService) ProcessHeartbeat(token string, status string, msg string, ping int64) error {
	monitor, err := s.monitorRepo.GetByPushToken(token)
	if err != nil {
		return err
	}
	if monitor == nil {
		return errors.New("invalid push token")
	}

	if status == "" {
		status = "up"
	}

	// 1. Save Result
	checkResult := &models.CheckResult{
		MonitorID:    monitor.ID,
		Status:       status,
		ResponseTime: ping,
		Message:      msg,
		CreatedAt:    time.Now(),
	}

	if err := s.resultRepo.Create(checkResult); err != nil {
		logger.Log.Error("Failed to save push result", zap.Error(err))
	}

	// 2. Check Status Change
	if monitor.LastStatus != status {
		logger.Log.Info("Push Monitor status changed",
			zap.String("monitor", monitor.Name),
			zap.String("old_status", monitor.LastStatus),
			zap.String("new_status", status),
		)
		s.notifySvc.Notify(*monitor, status, msg)
	}

	// 3. Update Monitor
	monitor.LastStatus = status
	now := time.Now()
	monitor.LastCheckedAt = &now

	return s.monitorRepo.Update(monitor)
}
