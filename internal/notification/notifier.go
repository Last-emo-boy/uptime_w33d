package notification

type NotificationMessage struct {
	MonitorName string
	Target      string
	Status      string // "up" or "down"
	Message     string
	Time        string
}

type Notifier interface {
	Send(config string, msg NotificationMessage) error
	Type() string
}
