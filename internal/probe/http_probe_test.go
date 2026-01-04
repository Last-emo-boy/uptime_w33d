package probe_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"uptime_w33d/internal/models"
	"uptime_w33d/internal/probe"
)

func TestHTTPProbe_Check_Success(t *testing.T) {
	// Mock Server
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer ts.Close()

	p := probe.NewHTTPProbe()
	m := models.Monitor{
		Type:           models.TypeHTTP,
		Target:         ts.URL,
		Timeout:        1,
		ExpectedStatus: "200",
	}

	result := p.Check(m)

	if !result.Success {
		t.Errorf("Expected success, got failure: %s", result.Message)
	}
	if result.ResponseTime <= 0 {
		t.Errorf("Expected positive response time, got %v", result.ResponseTime)
	}
}

func TestHTTPProbe_Check_Failure_StatusCode(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer ts.Close()

	p := probe.NewHTTPProbe()
	m := models.Monitor{
		Type:           models.TypeHTTP,
		Target:         ts.URL,
		Timeout:        1,
		ExpectedStatus: "200",
	}

	result := p.Check(m)

	if result.Success {
		t.Errorf("Expected failure due to status code 500, got success")
	}
}

func TestHTTPProbe_Check_Timeout(t *testing.T) {
	// Server that sleeps longer than timeout
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(200 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
	}))
	defer ts.Close()

	p := probe.NewHTTPProbe()
	
	m2 := models.Monitor{
		Type:    models.TypeHTTP,
		Target:  "http://localhost:12345", // Unused port
		Timeout: 1,
	}
	
	result := p.Check(m2)
	if result.Success {
		t.Errorf("Expected failure due to connection refused, got success")
	}
}
