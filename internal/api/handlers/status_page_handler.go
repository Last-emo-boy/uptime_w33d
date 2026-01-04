package handlers

import (
	"strconv"
	"net/http"
	"time"
	"encoding/json"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"uptime_w33d/internal/models"
	"uptime_w33d/internal/repository"
	"uptime_w33d/internal/services"
	"uptime_w33d/pkg/cache"
	"uptime_w33d/pkg/logger"
)

type StatusPageHandler struct {
	statusSvc   services.StatusPageService
	monitorRepo repository.MonitorRepository
	resultRepo  repository.CheckResultRepository
}

func NewStatusPageHandler(statusSvc services.StatusPageService, monitorRepo repository.MonitorRepository, resultRepo repository.CheckResultRepository) *StatusPageHandler {
	return &StatusPageHandler{
		statusSvc:   statusSvc,
		monitorRepo: monitorRepo,
		resultRepo:  resultRepo,
	}
}

type PublicMonitorStatus struct {
	ID                uint       `json:"id"`
	Name              string     `json:"name"`
	Type              string     `json:"type"`
	LastStatus        string     `json:"last_status"`
	LastCheckedAt     *time.Time `json:"last_checked_at"`
	CertificateExpiry *time.Time `json:"certificate_expiry,omitempty"`
	Uptime24h         float64    `json:"uptime_24h"` 
	GroupName         string     `json:"group_name,omitempty"`
}

// Admin Handlers for Status Pages

func (h *StatusPageHandler) List(c *gin.Context) {
	pages, err := h.statusSvc.ListStatusPages()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pages)
}

func (h *StatusPageHandler) Create(c *gin.Context) {
	var req struct {
		models.StatusPage
		MonitorIDs []uint `json:"monitor_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	if err := h.statusSvc.CreateStatusPage(&req.StatusPage); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	// Update monitors association
	if len(req.MonitorIDs) > 0 {
		h.statusSvc.UpdateStatusPage(req.StatusPage.ID, &req.StatusPage, req.MonitorIDs)
	}

	c.JSON(http.StatusCreated, req.StatusPage)
}

func (h *StatusPageHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		models.StatusPage
		MonitorIDs []uint `json:"monitor_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	if err := h.statusSvc.UpdateStatusPage(uint(id), &req.StatusPage, req.MonitorIDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *StatusPageHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.statusSvc.DeleteStatusPage(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// Public Handler

func (h *StatusPageHandler) GetStatus(c *gin.Context) {
	// Identify Status Page by Slug or Domain
	slug := c.Param("slug")
	if slug == "" {
		slug = "default" // Default slug
	}

	// Try Cache (Keyed by slug)
	cacheKey := "public_status_page_" + slug
	if cached, err := cache.Get(cacheKey); err == nil {
		var response gin.H
		if err := json.Unmarshal([]byte(cached), &response); err == nil {
			c.JSON(http.StatusOK, response)
			return
		}
	}

	// Fetch Status Page Config
	page, err := h.statusSvc.GetStatusPageBySlug(slug)
	
	// Fallback: If slug is "default" and not found, create a temporary default view with all monitors
	if err != nil && slug == "default" {
		allMonitors, _ := h.monitorRepo.GetAll(0)
		// Filter enabled? 
		// Create a dummy page config
		page = &models.StatusPage{
			Title:       "Uptime W33d Status",
			Description: "System Status",
			Slug:        "default",
			Theme:       "light",
			Monitors:    allMonitors,
		}
	} else if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Status page not found"})
		return
	}

	// If monitors are not preloaded correctly, we might need to fetch them.
	// The repo GetBySlug uses Preload, so page.Monitors should be populated.
	
	publicStatus := make([]PublicMonitorStatus, 0)
	if page.Monitors != nil {
		for _, m := range page.Monitors {
			if !m.Enabled { continue }
	
			uptime := 100.0
			if m.LastStatus == "down" {
				uptime = 0.0
			}
	
			publicStatus = append(publicStatus, PublicMonitorStatus{
				ID:                m.ID,
				Name:              m.Name,
				Type:              string(m.Type),
				LastStatus:        m.LastStatus,
				LastCheckedAt:     m.LastCheckedAt,
				CertificateExpiry: m.CertificateExpiry,
			Uptime24h:         uptime,
			GroupName:         func() string { if m.Group != nil { return m.Group.Name }; return "" }(),
		})
	}
}

	response := gin.H{
		"config":        page,
		"system_status": "All Systems Operational", // Should calculate real status
		"monitors":      publicStatus,
		"cached_at":     time.Now(),
	}

	// Set Cache (5 minutes as requested)
	if jsonBytes, err := json.Marshal(response); err == nil {
		if err := cache.Set(cacheKey, string(jsonBytes), 5*time.Minute); err != nil {
			logger.Log.Warn("Failed to set status cache", zap.Error(err))
		}
	}

	c.JSON(http.StatusOK, response)
}

func (h *StatusPageHandler) GetMonitorHistory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// Check if monitor exists and is public (Optional but recommended)
	// monitor, err := h.monitorRepo.GetByID(uint(id))
	// if err != nil || !monitor.IsPublic { ... }

	history, err := h.resultRepo.GetHistory(uint(id), 50) // Limit 50
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch history"})
		return
	}

	c.JSON(http.StatusOK, history)
}
