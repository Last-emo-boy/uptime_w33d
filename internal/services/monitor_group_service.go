package services

import (
	"uptime_w33d/internal/models"
	"uptime_w33d/internal/repository"
)

type MonitorGroupService interface {
	CreateGroup(group *models.MonitorGroup) error
	GetGroup(id uint) (*models.MonitorGroup, error)
	ListGroups() ([]models.MonitorGroup, error)
	UpdateGroup(id uint, group *models.MonitorGroup) error
	DeleteGroup(id uint) error
}

type monitorGroupService struct {
	repo repository.MonitorGroupRepository
}

func NewMonitorGroupService(repo repository.MonitorGroupRepository) MonitorGroupService {
	return &monitorGroupService{repo: repo}
}

func (s *monitorGroupService) CreateGroup(group *models.MonitorGroup) error {
	return s.repo.Create(group)
}

func (s *monitorGroupService) GetGroup(id uint) (*models.MonitorGroup, error) {
	return s.repo.GetByID(id)
}

func (s *monitorGroupService) ListGroups() ([]models.MonitorGroup, error) {
	return s.repo.GetAll()
}

func (s *monitorGroupService) UpdateGroup(id uint, group *models.MonitorGroup) error {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	existing.Name = group.Name
	existing.Order = group.Order
	return s.repo.Update(existing)
}

func (s *monitorGroupService) DeleteGroup(id uint) error {
	return s.repo.Delete(id)
}
