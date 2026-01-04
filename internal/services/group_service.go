package services

import (
	"errors"

	"uptime_w33d/internal/models"
	"uptime_w33d/internal/repository"
)

type GroupService interface {
	CreateGroup(group *models.MonitorGroup) error
	GetGroup(id uint) (*models.MonitorGroup, error)
	ListGroups() ([]models.MonitorGroup, error)
	UpdateGroup(id uint, group *models.MonitorGroup) error
	DeleteGroup(id uint) error
}

type groupService struct {
	groupRepo repository.GroupRepository
}

func NewGroupService(groupRepo repository.GroupRepository) GroupService {
	return &groupService{groupRepo: groupRepo}
}

func (s *groupService) CreateGroup(group *models.MonitorGroup) error {
	if group.Name == "" {
		return errors.New("group name is required")
	}
	return s.groupRepo.Create(group)
}

func (s *groupService) GetGroup(id uint) (*models.MonitorGroup, error) {
	return s.groupRepo.GetByID(id)
}

func (s *groupService) ListGroups() ([]models.MonitorGroup, error) {
	return s.groupRepo.GetAll()
}

func (s *groupService) UpdateGroup(id uint, updates *models.MonitorGroup) error {
	existing, err := s.groupRepo.GetByID(id)
	if err != nil {
		return err
	}
	if existing == nil {
		return errors.New("group not found")
	}

	existing.Name = updates.Name
	existing.Order = updates.Order

	return s.groupRepo.Update(existing)
}

func (s *groupService) DeleteGroup(id uint) error {
	return s.groupRepo.Delete(id)
}
