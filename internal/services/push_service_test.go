package services_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"uptime_w33d/internal/models"
	"uptime_w33d/internal/notification"
	"uptime_w33d/internal/services"
	"uptime_w33d/pkg/logger"
)

// --- Mocks ---

type MockMonitorRepo struct {
	mock.Mock
}

func (m *MockMonitorRepo) GetByPushToken(token string) (*models.Monitor, error) {
	args := m.Called(token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Monitor), args.Error(1)
}

func (m *MockMonitorRepo) Update(monitor *models.Monitor) error {
	args := m.Called(monitor)
	return args.Error(0)
}

// Implement other methods to satisfy interface
func (m *MockMonitorRepo) Create(monitor *models.Monitor) error { return nil }
func (m *MockMonitorRepo) GetByID(id uint) (*models.Monitor, error) { return nil, nil }
func (m *MockMonitorRepo) GetAll(userID uint) ([]models.Monitor, error) { return nil, nil }
func (m *MockMonitorRepo) Delete(id uint) error { return nil }


type MockResultRepo struct {
	mock.Mock
}

func (m *MockResultRepo) Create(result *models.CheckResult) error {
	args := m.Called(result)
	return args.Error(0)
}
// Implement other methods
func (m *MockResultRepo) GetLatestByMonitorID(monitorID uint) (*models.CheckResult, error) { return nil, nil }
func (m *MockResultRepo) GetHistory(monitorID uint, limit int) ([]models.CheckResult, error) { return nil, nil }
func (m *MockResultRepo) DeleteOlderThan(date string) error { return nil }


type MockNotifySvc struct {
	mock.Mock
}

func (m *MockNotifySvc) Notify(monitor models.Monitor, newStatus string, message string) {
	m.Called(monitor, newStatus, message)
}
func (m *MockNotifySvc) RegisterNotifier(n notification.Notifier) {}


// --- Tests ---

func TestPushService_ProcessHeartbeat_Success(t *testing.T) {
	logger.InitLogger("info", "console")
	// Setup
	mockMonitorRepo := new(MockMonitorRepo)
	mockResultRepo := new(MockResultRepo)
	mockNotifySvc := new(MockNotifySvc)

	service := services.NewPushService(mockMonitorRepo, mockResultRepo, mockNotifySvc)

	monitor := &models.Monitor{
		ID:         1,
		Name:       "Backup Job",
		Type:       models.TypePush,
		PushToken:  "valid-token",
		LastStatus: "up",
	}

	// Expectations
	mockMonitorRepo.On("GetByPushToken", "valid-token").Return(monitor, nil)
	mockResultRepo.On("Create", mock.AnythingOfType("*models.CheckResult")).Return(nil)
	mockMonitorRepo.On("Update", mock.AnythingOfType("*models.Monitor")).Return(nil)

	// Execute
	err := service.ProcessHeartbeat("valid-token", "up", "OK", 100)

	// Assert
	assert.NoError(t, err)
	mockMonitorRepo.AssertExpectations(t)
	mockResultRepo.AssertExpectations(t)
	mockNotifySvc.AssertNotCalled(t, "Notify")
}

func TestPushService_ProcessHeartbeat_StatusChange(t *testing.T) {
	logger.InitLogger("info", "console")
	// Setup
	mockMonitorRepo := new(MockMonitorRepo)
	mockResultRepo := new(MockResultRepo)
	mockNotifySvc := new(MockNotifySvc)

	service := services.NewPushService(mockMonitorRepo, mockResultRepo, mockNotifySvc)

	monitor := &models.Monitor{
		ID:         1,
		Name:       "Backup Job",
		Type:       models.TypePush,
		PushToken:  "valid-token",
		LastStatus: "up",
	}

	// Expectations
	mockMonitorRepo.On("GetByPushToken", "valid-token").Return(monitor, nil)
	mockResultRepo.On("Create", mock.AnythingOfType("*models.CheckResult")).Return(nil)
	mockMonitorRepo.On("Update", mock.AnythingOfType("*models.Monitor")).Return(nil)
	mockNotifySvc.On("Notify", *monitor, "down", "Failed").Return()

	// Execute
	err := service.ProcessHeartbeat("valid-token", "down", "Failed", 0)

	// Assert
	assert.NoError(t, err)
	mockNotifySvc.AssertExpectations(t)
}

func TestPushService_ProcessHeartbeat_InvalidToken(t *testing.T) {
	mockMonitorRepo := new(MockMonitorRepo)
	mockResultRepo := new(MockResultRepo)
	mockNotifySvc := new(MockNotifySvc)

	service := services.NewPushService(mockMonitorRepo, mockResultRepo, mockNotifySvc)

	mockMonitorRepo.On("GetByPushToken", "invalid").Return(nil, nil) // Return nil monitor, nil error (not found)

	err := service.ProcessHeartbeat("invalid", "up", "", 0)

	assert.Error(t, err)
	assert.Equal(t, "invalid push token", err.Error())
}
