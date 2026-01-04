package probe

import (
	"fmt"
	"net"
	"time"

	"uptime_w33d/internal/models"
)

type TCPProbe struct {
	BaseProbe
}

func NewTCPProbe() *TCPProbe {
	return &TCPProbe{}
}

func (p *TCPProbe) Type() models.MonitorType {
	return models.TypeTCP
}

func (p *TCPProbe) Check(monitor models.Monitor) Result {
	start := time.Now()
	timeout := time.Duration(monitor.Timeout) * time.Second

	conn, err := net.DialTimeout("tcp", monitor.Target, timeout)
	duration := time.Since(start)

	if err != nil {
		return p.RecordResult(false, fmt.Sprintf("connection failed: %v", err), duration)
	}
	defer conn.Close()

	return p.RecordResult(true, "Connection established", duration)
}
