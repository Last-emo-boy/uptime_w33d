package probe

import (
	"fmt"
	"net"
	"time"

	"uptime_w33d/internal/models"
)

type DNSProbe struct {
	BaseProbe
}

func NewDNSProbe() *DNSProbe {
	return &DNSProbe{}
}

func (p *DNSProbe) Type() models.MonitorType {
	return models.TypeDNS
}

func (p *DNSProbe) Check(monitor models.Monitor) Result {
	start := time.Now()
	// monitor.Target should be a hostname, e.g., "google.com"
	
	// Use custom resolver if needed, for now use default system resolver
	// If we want to check a specific DNS server, we'd need a custom Resolver with Dial.
	
	ips, err := net.LookupIP(monitor.Target)
	duration := time.Since(start)

	if err != nil {
		return p.RecordResult(false, fmt.Sprintf("lookup failed: %v", err), duration)
	}

	if len(ips) == 0 {
		return p.RecordResult(false, "no IP addresses found", duration)
	}

	msg := fmt.Sprintf("Resolved %d IPs: %v", len(ips), ips)
	return p.RecordResult(true, msg, duration)
}
