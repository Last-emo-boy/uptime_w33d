package repository

import (
	"uptime_w33d/internal/models"

	"gorm.io/gorm"
)

type IncidentRepository interface {
	Create(incident *models.Incident) error
	Update(incident *models.Incident) error
	GetByID(id uint) (*models.Incident, error)
	ListActive() ([]models.Incident, error)
	ListByMonitor(monitorID uint) ([]models.Incident, error)
}

type incidentRepository struct {
	db *gorm.DB
}

func NewIncidentRepository(db *gorm.DB) IncidentRepository {
	return &incidentRepository{db: db}
}

func (r *incidentRepository) Create(incident *models.Incident) error {
	return r.db.Create(incident).Error
}

func (r *incidentRepository) Update(incident *models.Incident) error {
	return r.db.Save(incident).Error
}

func (r *incidentRepository) GetByID(id uint) (*models.Incident, error) {
	var incident models.Incident
	if err := r.db.First(&incident, id).Error; err != nil {
		return nil, err
	}
	return &incident, nil
}

func (r *incidentRepository) ListActive() ([]models.Incident, error) {
	var incidents []models.Incident
	// Active = Ongoing (Status != Resolved)
	if err := r.db.Where("status = ?", models.IncidentOngoing).Order("start_time desc").Find(&incidents).Error; err != nil {
		return nil, err
	}
	return incidents, nil
}

func (r *incidentRepository) ListByMonitor(monitorID uint) ([]models.Incident, error) {
	var incidents []models.Incident
	if err := r.db.Where("monitor_id = ?", monitorID).Order("start_time desc").Limit(10).Find(&incidents).Error; err != nil {
		return nil, err
	}
	return incidents, nil
}
