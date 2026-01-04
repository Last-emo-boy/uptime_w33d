package repository

import (
	"uptime_w33d/internal/models"

	"gorm.io/gorm"
)

type StatusPageRepository interface {
	Create(page *models.StatusPage) error
	GetByID(id uint) (*models.StatusPage, error)
	GetBySlug(slug string) (*models.StatusPage, error)
	GetByDomain(domain string) (*models.StatusPage, error)
	GetAll() ([]models.StatusPage, error)
	Update(page *models.StatusPage) error
	Delete(id uint) error
}

type statusPageRepository struct {
	db *gorm.DB
}

func NewStatusPageRepository(db *gorm.DB) StatusPageRepository {
	return &statusPageRepository{db: db}
}

func (r *statusPageRepository) Create(page *models.StatusPage) error {
	return r.db.Create(page).Error
}

func (r *statusPageRepository) GetByID(id uint) (*models.StatusPage, error) {
	var page models.StatusPage
	err := r.db.Preload("Monitors").First(&page, id).Error
	if err != nil {
		return nil, err
	}
	return &page, nil
}

func (r *statusPageRepository) GetBySlug(slug string) (*models.StatusPage, error) {
	var page models.StatusPage
	err := r.db.Preload("Monitors").Where("slug = ?", slug).First(&page).Error
	if err != nil {
		return nil, err
	}
	return &page, nil
}

func (r *statusPageRepository) GetByDomain(domain string) (*models.StatusPage, error) {
	var page models.StatusPage
	err := r.db.Preload("Monitors").Where("domain = ?", domain).First(&page).Error
	if err != nil {
		return nil, err
	}
	return &page, nil
}

func (r *statusPageRepository) GetAll() ([]models.StatusPage, error) {
	var pages []models.StatusPage
	err := r.db.Find(&pages).Error
	return pages, err
}

func (r *statusPageRepository) Update(page *models.StatusPage) error {
	// Need to handle Many2Many update manually or use Replace
	if err := r.db.Model(page).Association("Monitors").Replace(page.Monitors); err != nil {
		return err
	}
	return r.db.Save(page).Error
}

func (r *statusPageRepository) Delete(id uint) error {
	return r.db.Delete(&models.StatusPage{}, id).Error
}
