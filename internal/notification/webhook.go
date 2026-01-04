package notification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type WebhookNotifier struct{}

func NewWebhookNotifier() *WebhookNotifier {
	return &WebhookNotifier{}
}

func (n *WebhookNotifier) Type() string {
	return "webhook"
}

type WebhookConfig struct {
	URL string `json:"url"`
}

func (n *WebhookNotifier) Send(configJSON string, msg NotificationMessage) error {
	var config WebhookConfig
	if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
		return fmt.Errorf("invalid webhook config: %w", err)
	}

	payload, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(config.URL, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("webhook failed with status: %d", resp.StatusCode)
	}

	return nil
}
