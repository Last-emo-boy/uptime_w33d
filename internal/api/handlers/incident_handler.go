package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"uptime_w33d/internal/services"
)

type IncidentHandler struct {
	incidentService services.IncidentService
}

func NewIncidentHandler(incidentService services.IncidentService) *IncidentHandler {
	return &IncidentHandler{incidentService: incidentService}
}

type CreateIncidentRequest struct {
	Title     string `json:"title" binding:"required"`
	MonitorID *uint  `json:"monitor_id"`
	Impact    string `json:"impact" binding:"required"` // critical, major, minor, maintenance
}

func (h *IncidentHandler) Create(c *gin.Context) {
	var req CreateIncidentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	incident, err := h.incidentService.CreateIncident(req.Title, req.MonitorID, req.Impact)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, incident)
}

func (h *IncidentHandler) Resolve(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.incidentService.ResolveIncident(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Incident resolved"})
}

func (h *IncidentHandler) ListActive(c *gin.Context) {
	incidents, err := h.incidentService.GetActiveIncidents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, incidents)
}
