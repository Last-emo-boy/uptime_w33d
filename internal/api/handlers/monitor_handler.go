package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	
	"uptime_w33d/internal/models"
	"uptime_w33d/internal/services"
	"uptime_w33d/pkg/cache"
)

type MonitorHandler struct {
	monitorService services.MonitorService
}

func NewMonitorHandler(monitorService services.MonitorService) *MonitorHandler {
	return &MonitorHandler{monitorService: monitorService}
}

func (h *MonitorHandler) Create(c *gin.Context) {
	var monitor models.Monitor
	if err := c.ShouldBindJSON(&monitor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.monitorService.CreateMonitor(&monitor); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	// Invalidate Cache
	_ = cache.Delete("public_status_page_default")

	c.JSON(http.StatusCreated, monitor)
}

func (h *MonitorHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	monitor, err := h.monitorService.GetMonitor(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if monitor == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Monitor not found"})
		return
	}

	c.JSON(http.StatusOK, monitor)
}

func (h *MonitorHandler) List(c *gin.Context) {
	userID, _ := c.Get("userID") // In future, use this to filter
	
	monitors, err := h.monitorService.ListMonitors(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, monitors)
}

func (h *MonitorHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var monitor models.Monitor
	if err := c.ShouldBindJSON(&monitor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.monitorService.UpdateMonitor(uint(id), &monitor); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Invalidate Cache
	_ = cache.Delete("public_status_page_default")

	c.JSON(http.StatusOK, gin.H{"message": "Monitor updated successfully"})
}

func (h *MonitorHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.monitorService.DeleteMonitor(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Invalidate Cache
	_ = cache.Delete("public_status_page_default")

	c.JSON(http.StatusOK, gin.H{"message": "Monitor deleted successfully"})
}
