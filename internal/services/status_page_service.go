package services

import (
	"errors"

	"uptime_w33d/internal/models"
	"uptime_w33d/internal/repository"
)

type StatusPageService interface {
	CreateStatusPage(page *models.StatusPage) error
	GetStatusPage(id uint) (*models.StatusPage, error)
	GetStatusPageBySlug(slug string) (*models.StatusPage, error)
	GetStatusPageByDomain(domain string) (*models.StatusPage, error)
	ListStatusPages() ([]models.StatusPage, error)
	UpdateStatusPage(id uint, page *models.StatusPage, monitorIDs []uint) error
	DeleteStatusPage(id uint) error
}

type statusPageService struct {
	repo        repository.StatusPageRepository
	monitorRepo repository.MonitorRepository
}

func NewStatusPageService(repo repository.StatusPageRepository, monitorRepo repository.MonitorRepository) StatusPageService {
	return &statusPageService{repo: repo, monitorRepo: monitorRepo}
}

func (s *statusPageService) CreateStatusPage(page *models.StatusPage) error {
	if page.Slug == "" {
		return errors.New("slug is required")
	}
	// Check if slug exists
	if _, err := s.repo.GetBySlug(page.Slug); err == nil {
		return errors.New("slug already exists")
	}
	return s.repo.Create(page)
}

func (s *statusPageService) GetStatusPage(id uint) (*models.StatusPage, error) {
	return s.repo.GetByID(id)
}

func (s *statusPageService) GetStatusPageBySlug(slug string) (*models.StatusPage, error) {
	return s.repo.GetBySlug(slug)
}

func (s *statusPageService) GetStatusPageByDomain(domain string) (*models.StatusPage, error) {
	return s.repo.GetByDomain(domain)
}

func (s *statusPageService) ListStatusPages() ([]models.StatusPage, error) {
	return s.repo.GetAll()
}

func (s *statusPageService) UpdateStatusPage(id uint, updates *models.StatusPage, monitorIDs []uint) error {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	
	existing.Title = updates.Title
	existing.Description = updates.Description
	existing.Theme = updates.Theme
	existing.CustomCSS = updates.CustomCSS
	existing.Domain = updates.Domain
	existing.Public = updates.Public
	existing.Slug = updates.Slug // Should check uniqueness again if changed
	
	if updates.Password != "" {
		existing.Password = updates.Password // Should hash this
	}

	// Update Monitors
	if monitorIDs != nil {
		var monitors []models.Monitor
		for _, mid := range monitorIDs {
			m, err := s.monitorRepo.GetByID(mid)
			if err == nil && m != nil {
				monitors = append(monitors, *m)
			}
		}
		existing.Monitors = monitors
	}

	return s.repo.Update(existing)
}

func (s *statusPageService) DeleteStatusPage(id uint) error {
	return s.repo.Delete(id)
}
