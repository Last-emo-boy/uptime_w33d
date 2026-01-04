package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"uptime_w33d/internal/models"
	"uptime_w33d/internal/services"
)

type MonitorGroupHandler struct {
	groupSvc services.MonitorGroupService
}

func NewMonitorGroupHandler(groupSvc services.MonitorGroupService) *MonitorGroupHandler {
	return &MonitorGroupHandler{groupSvc: groupSvc}
}

func (h *MonitorGroupHandler) List(c *gin.Context) {
	groups, err := h.groupSvc.ListGroups()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, groups)
}

func (h *MonitorGroupHandler) Create(c *gin.Context) {
	var group models.MonitorGroup
	if err := c.ShouldBindJSON(&group); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.groupSvc.CreateGroup(&group); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, group)
}

func (h *MonitorGroupHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var group models.MonitorGroup
	if err := c.ShouldBindJSON(&group); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.groupSvc.UpdateGroup(uint(id), &group); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Group updated"})
}

func (h *MonitorGroupHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.groupSvc.DeleteGroup(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Group deleted"})
}
