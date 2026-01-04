package probe

import (
	"fmt"
	"time"

	"github.com/rumblefrog/go-a2s"
	"uptime_w33d/internal/models"
)

type SteamProbe struct {
	BaseProbe
}

func NewSteamProbe() *SteamProbe {
	return &SteamProbe{}
}

func (p *SteamProbe) Type() models.MonitorType {
	return models.TypeSteam
}

func (p *SteamProbe) Check(monitor models.Monitor) Result {
	start := time.Now()
	timeout := time.Duration(monitor.Timeout) * time.Second

	client, err := a2s.NewClient(monitor.Target, a2s.TimeoutOption(timeout))
	if err != nil {
		return p.RecordResult(false, fmt.Sprintf("invalid address: %v", err), 0)
	}
	defer client.Close()

	info, err := client.QueryInfo()
	duration := time.Since(start)

	if err != nil {
		return p.RecordResult(false, fmt.Sprintf("query failed: %v", err), duration)
	}

	msg := fmt.Sprintf("%s (%d/%d players)", info.Name, info.Players, info.MaxPlayers)
	
	res := p.RecordResult(true, msg, duration)
	res.Data["server_name"] = info.Name
	res.Data["map"] = info.Map
	res.Data["players"] = info.Players
	res.Data["max_players"] = info.MaxPlayers
	res.Data["game"] = info.Game

	return res
}
