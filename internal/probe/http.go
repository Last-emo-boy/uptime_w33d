package probe

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/tidwall/gjson"
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

	method := monitor.Method
	if method == "" {
		method = "GET"
	}

	var bodyReader *strings.Reader
	if monitor.Body != "" {
		bodyReader = strings.NewReader(monitor.Body)
	} else {
		bodyReader = strings.NewReader("")
	}

	req, err := http.NewRequest(method, monitor.Target, bodyReader)
	if err != nil {
		return p.RecordResult(false, fmt.Sprintf("invalid URL: %v", err), 0)
	}
	
	// Add User-Agent
	req.Header.Set("User-Agent", "UptimeW33d/1.0")

	// Add Custom Headers
	if monitor.Headers != "" {
		var headers map[string]string
		if err := json.Unmarshal([]byte(monitor.Headers), &headers); err == nil {
			for k, v := range headers {
				req.Header.Set(k, v)
			}
		}
	}

	resp, err := client.Do(req)
	duration := time.Since(start)

	if err != nil {
		return p.RecordResult(false, fmt.Sprintf("request failed: %v", err), duration)
	}
	defer resp.Body.Close()
	
	// Read Body for Advanced Checks (Keyword/JSON)
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return p.RecordResult(false, fmt.Sprintf("failed to read body: %v", err), duration)
	}
	bodyStr := string(bodyBytes)

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

	// --- Advanced Checks ---
	if success {
		// Keyword Check
		if monitor.Type == models.TypeHTTPKeyword && monitor.Keyword != "" {
			if !strings.Contains(bodyStr, monitor.Keyword) {
				success = false
				msg = fmt.Sprintf("Keyword '%s' not found", monitor.Keyword)
			}
		}

		// JSON Query Check
		if monitor.Type == models.TypeHTTPJson && monitor.JSONPath != "" {
			// Using GJSON for fast path retrieval
			res := gjson.Get(bodyStr, monitor.JSONPath)
			if !res.Exists() {
				success = false
				msg = fmt.Sprintf("JSON Path '%s' not found", monitor.JSONPath)
			} else {
				// Compare Value (String comparison for now)
				if monitor.JSONValue != "" && res.String() != monitor.JSONValue {
					success = false
					msg = fmt.Sprintf("JSON Value mismatch: expected '%s', got '%s'", monitor.JSONValue, res.String())
				}
			}
		}
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
