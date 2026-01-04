package probe

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"time"

	"uptime_w33d/internal/models"
)

type HTTPProbe struct {
	BaseProbe
}

func NewHTTPProbe() *HTTPProbe {
	return &HTTPProbe{}
}

func (p *HTTPProbe) Type() models.MonitorType {
	return models.TypeHTTP
}

func (p *HTTPProbe) Check(monitor models.Monitor) Result {
	start := time.Now()
	timeout := time.Duration(monitor.Timeout) * time.Second
	
	// Prepare Client with Timeout and SSL config
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, // Option to verify SSL?
		DisableKeepAlives: true,
	}
	client := &http.Client{
		Timeout:   timeout,
		Transport: tr,
	}

	req, err := http.NewRequest("GET", monitor.Target, nil)
	if err != nil {
		return p.RecordResult(false, fmt.Sprintf("invalid URL: %v", err), 0)
	}
	
	// Add User-Agent
	req.Header.Set("User-Agent", "UptimeW33d/1.0")

	resp, err := client.Do(req)
	duration := time.Since(start)

	if err != nil {
		return p.RecordResult(false, fmt.Sprintf("request failed: %v", err), duration)
	}
	defer resp.Body.Close()

	// Check Status Code
	success := false
	expected := monitor.ExpectedStatus
	if expected == "" {
		expected = "200" // Default
	}

	// Simple status check logic
	if expected == "2xx" {
		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			success = true
		}
	} else {
		// Exact match
		if fmt.Sprintf("%d", resp.StatusCode) == expected {
			success = true
		}
	}

	msg := fmt.Sprintf("HTTP %d %s", resp.StatusCode, resp.Status)
	if !success {
		msg = fmt.Sprintf("Unexpected status: %d (expected %s)", resp.StatusCode, expected)
	}

	res := p.RecordResult(success, msg, duration)
	res.Data["status_code"] = resp.StatusCode

	// SSL Check
	if resp.TLS != nil && len(resp.TLS.PeerCertificates) > 0 {
		cert := resp.TLS.PeerCertificates[0]
		res.Data["cert_expiry"] = cert.NotAfter
	}

	return res
}
