package services

import (
	"errors"
	"time"

	"uptime_w33d/internal/models"
	"uptime_w33d/internal/repository"
)

type IncidentService interface {
	CreateIncident(title string, monitorID *uint, impact string) (*models.Incident, error)
	ResolveIncident(id uint) error
	GetActiveIncidents() ([]models.Incident, error)
	GetIncident(id uint) (*models.Incident, error)
}

type incidentService struct {
	incidentRepo repository.IncidentRepository
}

func NewIncidentService(incidentRepo repository.IncidentRepository) IncidentService {
	return &incidentService{incidentRepo: incidentRepo}
}

func (s *incidentService) CreateIncident(title string, monitorID *uint, impact string) (*models.Incident, error) {
	incident := &models.Incident{
		Title:     title,
		MonitorID: monitorID,
		Status:    models.IncidentOngoing,
		StartTime: time.Now(),
		Impact:    impact,
	}
	if err := s.incidentRepo.Create(incident); err != nil {
		return nil, err
	}
	return incident, nil
}

func (s *incidentService) ResolveIncident(id uint) error {
	incident, err := s.incidentRepo.GetByID(id)
	if err != nil {
		return err
	}
	if incident == nil {
		return errors.New("incident not found")
	}

	incident.Status = models.IncidentResolved
	now := time.Now()
	incident.EndTime = &now
	
	return s.incidentRepo.Update(incident)
}

func (s *incidentService) GetActiveIncidents() ([]models.Incident, error) {
	return s.incidentRepo.ListActive()
}

func (s *incidentService) GetIncident(id uint) (*models.Incident, error) {
	return s.incidentRepo.GetByID(id)
}
