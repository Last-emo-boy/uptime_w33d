package handlers

import (
	"strconv"
	"text/template"

	"github.com/gin-gonic/gin"
	"uptime_w33d/internal/services"
)

type BadgeHandler struct {
	monitorService services.MonitorService
}

func NewBadgeHandler(monitorService services.MonitorService) *BadgeHandler {
	return &BadgeHandler{monitorService: monitorService}
}

const badgeTemplate = `<svg xmlns="http://www.w3.org/2000/svg" width="{{.Width}}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="{{.Width}}" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#555" d="M0 0h{{.LabelWidth}}v20H0z"/>
    <path fill="{{.Color}}" d="M{{.LabelWidth}} 0h{{.StatusWidth}}v20H{{.LabelWidth}}z"/>
    <path fill="url(#b)" d="M0 0h{{.Width}}v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="{{.LabelX}}" y="15" fill="#010101" fill-opacity=".3">{{.Label}}</text>
    <text x="{{.LabelX}}" y="14">{{.Label}}</text>
    <text x="{{.StatusX}}" y="15" fill="#010101" fill-opacity=".3">{{.Status}}</text>
    <text x="{{.StatusX}}" y="14">{{.Status}}</text>
  </g>
</svg>`

type BadgeData struct {
	Label       string
	Status      string
	Color       string
	Width       int
	LabelWidth  int
	StatusWidth int
	LabelX      float64
	StatusX     float64
}

func (h *BadgeHandler) GetStatusBadge(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	monitor, err := h.monitorService.GetMonitor(uint(id))
	
	status := "unknown"
	color := "#9f9f9f" // grey
	if err == nil {
		status = monitor.LastStatus
		if status == "" {
			status = "pending"
		}
	}

	if status == "up" {
		status = "up"
		color = "#4c1" // green
	} else if status == "down" {
		status = "down"
		color = "#e05d44" // red
	} else {
		status = "unknown"
		color = "#9f9f9f"
	}

	label := "status" // Or monitor name? Usually badges say "build | passing". Here "Status | Up"
	
	// Approximate width calculation (7px per char roughly)
	labelWidth := len(label) * 7 + 10
	statusWidth := len(status) * 7 + 10
	width := labelWidth + statusWidth

	data := BadgeData{
		Label:       label,
		Status:      status,
		Color:       color,
		Width:       width,
		LabelWidth:  labelWidth,
		StatusWidth: statusWidth,
		LabelX:      float64(labelWidth) / 2,
		StatusX:     float64(labelWidth) + float64(statusWidth)/2,
	}

	c.Header("Content-Type", "image/svg+xml")
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")

	tmpl, _ := template.New("badge").Parse(badgeTemplate)
	tmpl.Execute(c.Writer, data)
}
