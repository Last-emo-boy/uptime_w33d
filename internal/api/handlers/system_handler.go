package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"uptime_w33d/internal/services"
)

type SystemHandler struct {
	authService services.AuthService
}

func NewSystemHandler(authService services.AuthService) *SystemHandler {
	return &SystemHandler{authService: authService}
}

func (h *SystemHandler) GetStatus(c *gin.Context) {
	required, err := h.authService.IsSetupRequired()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"setup_required": required,
	})
}
