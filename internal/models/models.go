package models

import (
	"time"

	"gorm.io/gorm"
)

type UserRole string

const (
	RoleAdmin UserRole = "admin"
	RoleGuest UserRole = "guest"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Username     string         `gorm:"uniqueIndex;not null" json:"username"`
	PasswordHash string         `gorm:"not null" json:"-"`
	Email        string         `gorm:"uniqueIndex" json:"email"`
	Role         UserRole       `gorm:"default:'guest'" json:"role"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type MonitorType string

const (
	TypeHTTP MonitorType = "http"
	TypeTCP  MonitorType = "tcp"
	TypePing MonitorType = "ping"
	TypeDNS  MonitorType = "dns"
	TypePush MonitorType = "push"
)

type Monitor struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	Name           string         `gorm:"not null" json:"name"`
	Type           MonitorType    `gorm:"not null" json:"type"`
	Target         string         `gorm:"not null" json:"target"`          // URL, IP, Hostname
	PushToken      string         `gorm:"index" json:"push_token,omitempty"` // For Push monitors
	Interval       int            `gorm:"default:60" json:"interval"`      // Seconds (Expected heartbeat interval)
	Timeout        int            `gorm:"default:10" json:"timeout"`       // Seconds
	ExpectedStatus string         `json:"expected_status"`                 // e.g. "200", "2xx"
	IsPublic       bool           `gorm:"default:false" json:"is_public"`
	Enabled        bool           `gorm:"default:true" json:"enabled"`
	GroupID        *uint          `json:"group_id"`
	Group          *MonitorGroup  `json:"group,omitempty"`
	LastStatus     string         `json:"last_status"` // "up", "down", "unknown"
	LastCheckedAt  *time.Time     `json:"last_checked_at"`
	CertificateExpiry *time.Time  `json:"certificate_expiry"` // SSL Expiry Date
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

type MonitorGroup struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	Order     int            `gorm:"default:0" json:"order"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type CheckResult struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	MonitorID    uint      `gorm:"index;not null" json:"monitor_id"`
	Status       string    `gorm:"not null" json:"status"` // "up", "down"
	ResponseTime int64     `json:"response_time"`          // ms
	Message      string    `json:"message"`
	CreatedAt    time.Time `gorm:"index" json:"created_at"`
}

type IncidentStatus string

const (
	IncidentOngoing  IncidentStatus = "ongoing"
	IncidentResolved IncidentStatus = "resolved"
)

type Incident struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Title     string         `json:"title"`
	MonitorID *uint          `gorm:"index" json:"monitor_id"` // Optional (system-wide vs monitor-specific)
	Status    IncidentStatus `gorm:"not null" json:"status"`
	StartTime time.Time      `gorm:"not null" json:"start_time"`
	EndTime   *time.Time     `json:"end_time"`
	Impact    string         `json:"impact"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

type NotificationChannel struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Type      string         `gorm:"not null" json:"type"` // email, webhook, etc.
	Name      string         `gorm:"not null" json:"name"`
	Config    string         `gorm:"type:text" json:"config"` // JSON string
	Enabled   bool           `gorm:"default:true" json:"enabled"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Subscription struct {
	MonitorID uint `gorm:"primaryKey" json:"monitor_id"`
	ChannelID uint `gorm:"primaryKey" json:"channel_id"`
}
