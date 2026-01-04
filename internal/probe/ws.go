package probe

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"uptime_w33d/internal/models"
)

type WSProbe struct {
	BaseProbe
}

func NewWSProbe() *WSProbe {
	return &WSProbe{}
}

func (p *WSProbe) Type() models.MonitorType {
	return models.TypeWS
}

func (p *WSProbe) Check(monitor models.Monitor) Result {
	start := time.Now()
	timeout := time.Duration(monitor.Timeout) * time.Second

	dialer := websocket.Dialer{
		HandshakeTimeout: timeout,
		TLSClientConfig:  &tls.Config{InsecureSkipVerify: true},
	}

	// Connect
	conn, resp, err := dialer.Dial(monitor.Target, http.Header{"User-Agent": []string{"UptimeW33d/1.0"}})
	duration := time.Since(start)

	if err != nil {
		msg := fmt.Sprintf("connection failed: %v", err)
		if resp != nil {
			msg += fmt.Sprintf(" (HTTP %d)", resp.StatusCode)
		}
		return p.RecordResult(false, msg, duration)
	}
	defer conn.Close()

	// Optional: Send a ping or verify handshake?
	// For now, successful connection is enough.
	
	msg := "Connected"
	if resp != nil {
		msg = fmt.Sprintf("Connected (HTTP %d)", resp.StatusCode)
	}

	res := p.RecordResult(true, msg, duration)
	if resp != nil {
		res.Data["status_code"] = resp.StatusCode
	}
	return res
}
