package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"uptime_w33d/internal/repository"
)

type SubscriptionHandler struct {
	repo repository.SubscriptionRepository
}

func NewSubscriptionHandler(repo repository.SubscriptionRepository) *SubscriptionHandler {
	return &SubscriptionHandler{repo: repo}
}

func (h *SubscriptionHandler) Subscribe(c *gin.Context) {
	var req struct {
		MonitorID uint `json:"monitor_id"`
		ChannelID uint `json:"channel_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.Subscribe(req.MonitorID, req.ChannelID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Subscribed"})
}

func (h *SubscriptionHandler) Unsubscribe(c *gin.Context) {
	monitorID, _ := strconv.Atoi(c.Query("monitor_id"))
	channelID, _ := strconv.Atoi(c.Query("channel_id"))

	if err := h.repo.Unsubscribe(uint(monitorID), uint(channelID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Unsubscribed"})
}

func (h *SubscriptionHandler) ListByMonitor(c *gin.Context) {
	monitorID, err := strconv.Atoi(c.Param("monitorID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Monitor ID"})
		return
	}

	channels, err := h.repo.GetChannelsByMonitorID(uint(monitorID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, channels)
}
