package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"uptime_w33d/internal/services"
)

type PushHandler struct {
	pushService services.PushService
}

func NewPushHandler(pushService services.PushService) *PushHandler {
	return &PushHandler{pushService: pushService}
}

func (h *PushHandler) HandleHeartbeat(c *gin.Context) {
	token := c.Param("token")
	status := c.Query("status")
	msg := c.Query("msg")
	pingStr := c.Query("ping")
	
	var ping int64
	if pingStr != "" {
		p, err := strconv.ParseInt(pingStr, 10, 64)
		if err == nil {
			ping = p
		}
	}

	if err := h.pushService.ProcessHeartbeat(token, status, msg, ping); err != nil {
		if err.Error() == "invalid push token" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Monitor not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
