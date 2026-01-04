package notification

import (
	"encoding/json"
	"fmt"
	"net/smtp"
	"strings"
)

type EmailNotifier struct{}

func NewEmailNotifier() *EmailNotifier {
	return &EmailNotifier{}
}

func (n *EmailNotifier) Type() string {
	return "email"
}

type EmailConfig struct {
	Host     string   `json:"host"`
	Port     string   `json:"port"`
	Username string   `json:"username"`
	Password string   `json:"password"`
	To       []string `json:"to"`
	From     string   `json:"from"`
}

func (n *EmailNotifier) Send(configJSON string, msg NotificationMessage) error {
	var config EmailConfig
	if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
		return fmt.Errorf("invalid email config: %w", err)
	}

	auth := smtp.PlainAuth("", config.Username, config.Password, config.Host)
	
	subject := fmt.Sprintf("Subject: [UptimeW33d] Monitor %s is %s\r\n", msg.MonitorName, strings.ToUpper(msg.Status))
	body := fmt.Sprintf("\r\nMonitor: %s\nTarget: %s\nStatus: %s\nTime: %s\nMessage: %s\n",
		msg.MonitorName, msg.Target, msg.Status, msg.Time, msg.Message)
	
	msgBytes := []byte(subject + body)
	addr := fmt.Sprintf("%s:%s", config.Host, config.Port)

	return smtp.SendMail(addr, auth, config.From, config.To, msgBytes)
}
