package probe

import (
	"time"

	"uptime_w33d/internal/models"
)

type Result struct {
	Success      bool
	ResponseTime time.Duration
	Message      string
	Data         map[string]interface{}
}

type Probe interface {
	Check(monitor models.Monitor) Result
	Type() models.MonitorType
}

type BaseProbe struct{}

func (p *BaseProbe) RecordResult(success bool, msg string, duration time.Duration) Result {
	return Result{
		Success:      success,
		Message:      msg,
		ResponseTime: duration,
		Data:         make(map[string]interface{}),
	}
}
