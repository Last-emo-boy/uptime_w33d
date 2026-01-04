package notification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type DiscordNotifier struct{}

func NewDiscordNotifier() *DiscordNotifier {
	return &DiscordNotifier{}
}

func (n *DiscordNotifier) Type() string {
	return "discord"
}

type DiscordConfig struct {
	WebhookURL string `json:"webhook_url"`
}

type DiscordEmbedField struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Inline bool   `json:"inline"`
}

type DiscordEmbed struct {
	Title       string              `json:"title"`
	Description string              `json:"description"`
	Color       int                 `json:"color"`
	Fields      []DiscordEmbedField `json:"fields"`
	Timestamp   string              `json:"timestamp"`
}

type DiscordPayload struct {
	Content string         `json:"content,omitempty"`
	Embeds  []DiscordEmbed `json:"embeds,omitempty"`
}

func (n *DiscordNotifier) Send(configJSON string, msg NotificationMessage) error {
	var config DiscordConfig
	if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
		return fmt.Errorf("invalid discord config: %w", err)
	}

	color := 5763719 // Gray for unknown
	if msg.Status == "up" {
		color = 5763719 // Green: 0x57F287 (Decimal 5763719) -> Wait, this is gray. Green is 5763719? No.
		color = 3066993 // Green 0x2ECC71
	} else if msg.Status == "down" {
		color = 15158332 // Red 0xE74C3C
	}

	embed := DiscordEmbed{
		Title:       fmt.Sprintf("Monitor Status: %s", msg.Status),
		Description: fmt.Sprintf("**%s** is %s", msg.MonitorName, msg.Status),
		Color:       color,
		Fields: []DiscordEmbedField{
			{Name: "Target", Value: msg.Target, Inline: true},
			{Name: "Message", Value: msg.Message, Inline: true},
			{Name: "Time", Value: msg.Time, Inline: false},
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	payload := DiscordPayload{
		Embeds: []DiscordEmbed{embed},
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(config.WebhookURL, "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("discord webhook failed with status: %d", resp.StatusCode)
	}

	return nil
}
