package services

import (
	"errors"

	"uptime_w33d/internal/models"
	"uptime_w33d/internal/repository"
)

type MonitorService interface {
	CreateMonitor(monitor *models.Monitor) error
	GetMonitor(id uint) (*models.Monitor, error)
	ListMonitors(userID uint) ([]models.Monitor, error)
	UpdateMonitor(id uint, monitor *models.Monitor) error
	DeleteMonitor(id uint) error
}

type monitorService struct {
	monitorRepo repository.MonitorRepository
}

func NewMonitorService(monitorRepo repository.MonitorRepository) MonitorService {
	return &monitorService{monitorRepo: monitorRepo}
}

func (s *monitorService) CreateMonitor(monitor *models.Monitor) error {
	// Add validation logic here
	if monitor.Name == "" {
		return errors.New("monitor name is required")
	}
	if monitor.Target == "" {
		return errors.New("monitor target is required")
	}
	return s.monitorRepo.Create(monitor)
}

func (s *monitorService) GetMonitor(id uint) (*models.Monitor, error) {
	return s.monitorRepo.GetByID(id)
}

func (s *monitorService) ListMonitors(userID uint) ([]models.Monitor, error) {
	return s.monitorRepo.GetAll(userID)
}

func (s *monitorService) UpdateMonitor(id uint, updates *models.Monitor) error {
	existing, err := s.monitorRepo.GetByID(id)
	if err != nil {
		return err
	}
	if existing == nil {
		return errors.New("monitor not found")
	}

	// Update fields
	existing.Name = updates.Name
	existing.Type = updates.Type
	existing.Target = updates.Target
	existing.Interval = updates.Interval
	existing.Timeout = updates.Timeout
	existing.ExpectedStatus = updates.ExpectedStatus
	existing.IsPublic = updates.IsPublic
	existing.Enabled = updates.Enabled
	existing.GroupID = updates.GroupID

	return s.monitorRepo.Update(existing)
}

func (s *monitorService) DeleteMonitor(id uint) error {
	return s.monitorRepo.Delete(id)
}
