package probe

import (
	"context"
	"fmt"
	"time"

	"github.com/docker/docker/client"
	"uptime_w33d/internal/models"
)

type DockerProbe struct {
	BaseProbe
}

func NewDockerProbe() *DockerProbe {
	return &DockerProbe{}
}

func (p *DockerProbe) Type() models.MonitorType {
	return models.TypeDocker
}

func (p *DockerProbe) Check(monitor models.Monitor) Result {
	start := time.Now()
	
	// Use default socket or custom TCP host
	host := client.DefaultDockerHost
	if monitor.Target != "" && monitor.Target != "local" {
		host = monitor.Target // e.g. tcp://192.168.1.100:2375
	}

	cli, err := client.NewClientWithOpts(client.WithHost(host), client.WithAPIVersionNegotiation())
	if err != nil {
		return p.RecordResult(false, fmt.Sprintf("failed to create docker client: %v", err), 0)
	}
	defer cli.Close()

	// Target format: "container_name" or "container_id"
	// But monitor.Target is used for HOST. So where do we put Container ID?
	// We can reuse the "Keyword" field for Container ID/Name, or add a new field.
	// Let's use "Keyword" field for Container Name/ID for now as a quick win, 
	// or parse Target like "tcp://host:port/container_name" which is non-standard.
	
	// Better approach: 
	// If Target is "local" or empty -> use local socket.
	// If Target starts with tcp:// or unix:// -> use that as host.
	// We need a place for Container ID. Let's use the 'Body' field? No, that's weird.
	// Let's use 'Keyword' field as 'Container Name/ID'.
	
	containerID := monitor.Keyword
	if containerID == "" {
		return p.RecordResult(false, "container name/id required (in keyword field)", 0)
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(monitor.Timeout)*time.Second)
	defer cancel()

	json, err := cli.ContainerInspect(ctx, containerID)
	duration := time.Since(start)

	if err != nil {
		return p.RecordResult(false, fmt.Sprintf("failed to inspect container: %v", err), duration)
	}

	success := json.State.Running
	msg := fmt.Sprintf("Container is %s", json.State.Status)
	if !success {
		msg = fmt.Sprintf("Container is not running (status: %s)", json.State.Status)
	}

	res := p.RecordResult(success, msg, duration)
	res.Data["state"] = json.State.Status
	res.Data["image"] = json.Config.Image
	res.Data["created"] = json.Created
	
	return res
}
