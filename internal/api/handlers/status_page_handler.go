package handlers

import (
	"strconv"
	"net/http"
	"time"
	"encoding/json"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"uptime_w33d/internal/repository"
	"uptime_w33d/pkg/cache"
	"uptime_w33d/pkg/logger"
)

type StatusPageHandler struct {
	monitorRepo repository.MonitorRepository
	resultRepo  repository.CheckResultRepository
}

func NewStatusPageHandler(monitorRepo repository.MonitorRepository, resultRepo repository.CheckResultRepository) *StatusPageHandler {
	return &StatusPageHandler{
		monitorRepo: monitorRepo,
		resultRepo:  resultRepo,
	}
}

type PublicMonitorStatus struct {
	ID            uint      `json:"id"`
	Name          string    `json:"name"`
	Type          string    `json:"type"`
	LastStatus    string    `json:"last_status"`
	LastCheckedAt *time.Time `json:"last_checked_at"`
	Uptime24h     float64   `json:"uptime_24h"` // Placeholder for uptime calculation
}

func (h *StatusPageHandler) GetStatus(c *gin.Context) {
	// Try Cache
	cacheKey := "public_status_page"
	if cached, err := cache.Get(cacheKey); err == nil {
		var response gin.H
		if err := json.Unmarshal([]byte(cached), &response); err == nil {
			c.JSON(http.StatusOK, response)
			return
		}
	}

	// 1. Get all PUBLIC monitors
	// We need to filter by IsPublic=true. 
	// Currently GetAll(0) returns all. We might need a new repo method or filter in memory.
	// For efficiency, let's assume we filter in memory or add repo method later.
	
	monitors, err := h.monitorRepo.GetAll(0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch monitors"})
		return
	}

	var publicStatus []PublicMonitorStatus
	for _, m := range monitors {
		// if !m.IsPublic { continue } // Uncomment when IsPublic is added to model

		// Calculate Uptime (Simplification: just return 100% or based on last status)
		// In a real app, we would query CheckResult history for the last 24h.
		uptime := 100.0
		if m.LastStatus == "down" {
			uptime = 0.0
		}

		publicStatus = append(publicStatus, PublicMonitorStatus{
			ID:            m.ID,
			Name:          m.Name,
			Type:          string(m.Type),
			LastStatus:    m.LastStatus,
			LastCheckedAt: m.LastCheckedAt,
			Uptime24h:     uptime,
		})
	}

	response := gin.H{
		"system_status": "All Systems Operational", // You can calculate this based on all monitors
		"monitors":      publicStatus,
		"cached_at":     time.Now(),
	}

	// Set Cache (30 seconds)
	if jsonBytes, err := json.Marshal(response); err == nil {
		if err := cache.Set(cacheKey, string(jsonBytes), 30*time.Second); err != nil {
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
