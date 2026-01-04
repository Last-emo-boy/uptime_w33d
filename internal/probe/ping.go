package probe

import (
	"fmt"
	"time"

	probing "github.com/prometheus-community/pro-bing"
	"uptime_w33d/internal/models"
)

type PingProbe struct {
	BaseProbe
}

func NewPingProbe() *PingProbe {
	return &PingProbe{}
}

func (p *PingProbe) Type() models.MonitorType {
	return models.TypePing
}

func (p *PingProbe) Check(monitor models.Monitor) Result {
	pinger, err := probing.NewPinger(monitor.Target)
	if err != nil {
		return p.RecordResult(false, fmt.Sprintf("failed to init pinger: %v", err), 0)
	}

	pinger.Count = 3
	pinger.Timeout = time.Duration(monitor.Timeout) * time.Second
	
	// On Windows, privileged ping is usually required or specific OS settings.
	// Try unprivileged first (UDP), if fails, might need SetPrivileged(true) and run as Admin.
	// For better compatibility in this demo, we assume standard usage.
	pinger.SetPrivileged(true) 

	err = pinger.Run() // Blocks until finished
	if err != nil {
		return p.RecordResult(false, fmt.Sprintf("ping failed: %v", err), 0)
	}

	stats := pinger.Statistics()
	duration := stats.AvgRtt
	
	if stats.PacketLoss > 0 {
		// Consider it a failure if packet loss is 100%, or degraded?
		// Simple logic: if 100% loss -> fail.
		if stats.PacketLoss == 100 {
			return p.RecordResult(false, "100% packet loss", 0)
		}
	}

	msg := fmt.Sprintf("Avg RTT: %v, Loss: %.2f%%", stats.AvgRtt, stats.PacketLoss)
	return p.RecordResult(true, msg, duration)
}
