package scheduler

import (
	"sync"
	"time"

	"go.uber.org/zap"

	"uptime_w33d/internal/models"
	"uptime_w33d/internal/probe"
	"uptime_w33d/internal/repository"
	"uptime_w33d/internal/services"
	"uptime_w33d/pkg/logger"
)

type Scheduler struct {
	monitorRepo repository.MonitorRepository
	resultRepo  repository.CheckResultRepository
	notifySvc   services.NotificationService
	probes      map[models.MonitorType]probe.Probe
	stopChan    chan struct{}
	wg          sync.WaitGroup
}

func NewScheduler(monitorRepo repository.MonitorRepository, resultRepo repository.CheckResultRepository, notifySvc services.NotificationService) *Scheduler {
	s := &Scheduler{
		monitorRepo: monitorRepo,
		resultRepo:  resultRepo,
		notifySvc:   notifySvc,
		probes:      make(map[models.MonitorType]probe.Probe),
		stopChan:    make(chan struct{}),
	}

	// Register Probes
	s.RegisterProbe(probe.NewHTTPProbe())
	s.RegisterProbe(probe.NewTCPProbe())
	s.RegisterProbe(probe.NewPingProbe())
	s.RegisterProbe(probe.NewDNSProbe())

	return s
}

func (s *Scheduler) RegisterProbe(p probe.Probe) {
	s.probes[p.Type()] = p
}

func (s *Scheduler) Start() {
	logger.Log.Info("Starting Scheduler...")
	go s.runLoop()
}

func (s *Scheduler) Stop() {
	logger.Log.Info("Stopping Scheduler...")
	close(s.stopChan)
	s.wg.Wait()
	logger.Log.Info("Scheduler Stopped")
}

func (s *Scheduler) runLoop() {
	ticker := time.NewTicker(10 * time.Second) // Check DB for jobs every 10s
	defer ticker.Stop()

	for {
		select {
		case <-s.stopChan:
			return
		case <-ticker.C:
			s.scheduleJobs()
		}
	}
}

func (s *Scheduler) scheduleJobs() {
	// 1. Get all enabled monitors
	monitors, err := s.monitorRepo.GetAll(0) // 0 = all
	if err != nil {
		logger.Log.Error("Failed to fetch monitors", zap.Error(err))
		return
	}

	for _, m := range monitors {
		if !m.Enabled {
			continue
		}
		
		if m.Type == models.TypePush {
			s.checkPushMonitor(m)
			continue
		}
		
		// TODO: Check last run time and interval logic
		s.wg.Add(1)
		go func(monitor models.Monitor) {
			defer s.wg.Done()
			s.executeCheck(monitor)
		}(m)
	}
}

func (s *Scheduler) checkPushMonitor(m models.Monitor) {
	// Check if heartbeat is overdue
	if m.LastCheckedAt == nil {
		// New monitor, never checked, maybe give it some grace or ignore until first ping?
		// For now, ignore.
		return
	}

	// Grace Period = Interval + Tolerance (e.g. 30s)
	gracePeriod := time.Duration(m.Interval+30) * time.Second
	if time.Since(*m.LastCheckedAt) > gracePeriod {
		if m.LastStatus != "down" {
			logger.Log.Warn("Push monitor overdue", zap.String("monitor", m.Name))
			
			// Mark as Down
			m.LastStatus = "down"
			// Don't update LastCheckedAt so we know when it actually last checked in
			
			if err := s.monitorRepo.Update(&m); err != nil {
				logger.Log.Error("Failed to update push monitor status", zap.Error(err))
			}
			
			// Record "Down" Result
			s.resultRepo.Create(&models.CheckResult{
				MonitorID: m.ID,
				Status:    "down",
				Message:   "Heartbeat overdue",
				CreatedAt: time.Now(),
			})
			
			// Notify
			s.notifySvc.Notify(m, "down", "Heartbeat overdue")
		}
	}
}

func (s *Scheduler) executeCheck(m models.Monitor) {
	p, exists := s.probes[m.Type]
	if !exists {
		logger.Log.Warn("No probe found for type", zap.String("type", string(m.Type)))
		return
	}

	logger.Log.Debug("Executing check", zap.String("monitor", m.Name), zap.String("target", m.Target))
	
	// Execute Probe
	result := p.Check(m)

	// Determine Status
	status := "up"
	if !result.Success {
		status = "down"
	}

	// 1. Save Result
	checkResult := &models.CheckResult{
		MonitorID:    m.ID,
		Status:       status,
		ResponseTime: result.ResponseTime.Milliseconds(),
		Message:      result.Message,
		CreatedAt:    time.Now(),
	}
	
	if err := s.resultRepo.Create(checkResult); err != nil {
		logger.Log.Error("Failed to save check result", zap.Error(err))
	}

	// 2. Check for State Change
	// We compare with m.LastStatus (which we should fetch fresh or trust the passed object if refreshed)
	// Ideally, fetch latest status again or update Monitor model to include LastStatus.
	// We added LastStatus to Monitor model.
	
	if m.LastStatus != status {
		logger.Log.Info("Monitor status changed", 
			zap.String("monitor", m.Name),
			zap.String("old_status", m.LastStatus),
			zap.String("new_status", status),
		)
		
		s.notifySvc.Notify(m, status, result.Message)
	}

	// 3. Update Monitor Last Status
	m.LastStatus = status
	now := time.Now()
	m.LastCheckedAt = &now
	
	// Update Certificate Expiry if available
	if val, ok := result.Data["cert_expiry"]; ok {
		if t, ok := val.(time.Time); ok {
			m.CertificateExpiry = &t
		}
	}
	
	if err := s.monitorRepo.Update(&m); err != nil {
		logger.Log.Error("Failed to update monitor status", zap.Error(err))
	}
	
	logLevel := zap.InfoLevel
	if !result.Success {
		logLevel = zap.ErrorLevel
	}
	
	logger.Log.Check(logLevel, "Probe finished").Write(
		zap.String("monitor", m.Name),
		zap.Bool("success", result.Success),
		zap.Duration("duration", result.ResponseTime),
		zap.String("msg", result.Message),
	)
}
