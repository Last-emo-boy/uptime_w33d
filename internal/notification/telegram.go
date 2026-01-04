package notification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type TelegramNotifier struct{}

func NewTelegramNotifier() *TelegramNotifier {
	return &TelegramNotifier{}
}

func (n *TelegramNotifier) Type() string {
	return "telegram"
}

type TelegramConfig struct {
	BotToken string `json:"bot_token"`
	ChatID   string `json:"chat_id"`
}

type TelegramPayload struct {
	ChatID    string `json:"chat_id"`
	Text      string `json:"text"`
	ParseMode string `json:"parse_mode"`
}

func (n *TelegramNotifier) Send(configJSON string, msg NotificationMessage) error {
	var config TelegramConfig
	if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
		return fmt.Errorf("invalid telegram config: %w", err)
	}

	icon := "❓"
	if msg.Status == "up" {
		icon = "✅"
	} else if msg.Status == "down" {
		icon = "🔴"
	}

	text := fmt.Sprintf(
		"%s *Monitor Status Update*\n\n"+
			"*Monitor:* %s\n"+
			"*Status:* %s\n"+
			"*Target:* %s\n"+
			"*Message:* %s\n"+
			"*Time:* %s",
		icon,
		msg.MonitorName,
		msg.Status,
		msg.Target,
		msg.Message,
		msg.Time,
	)

	payload := TelegramPayload{
		ChatID:    config.ChatID,
		Text:      text,
		ParseMode: "Markdown",
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", config.BotToken)
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("telegram api failed with status: %d", resp.StatusCode)
	}

	return nil
}
