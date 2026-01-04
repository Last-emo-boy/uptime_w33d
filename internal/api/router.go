package api

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"uptime_w33d/internal/api/handlers"
	"uptime_w33d/internal/api/middleware"
	"uptime_w33d/internal/config"
	"uptime_w33d/internal/repository"
	"uptime_w33d/internal/services"
)

func SetupRouter(cfg *config.Config, db *gorm.DB) *gin.Engine {
	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()
	r.Use(middleware.CORSMiddleware())

	// Dependencies
	userRepo := repository.NewUserRepository(db)
	authService := services.NewAuthService(userRepo)
	authHandler := handlers.NewAuthHandler(authService)

	systemHandler := handlers.NewSystemHandler(authService)

	monitorRepo := repository.NewMonitorRepository(db)
	monitorService := services.NewMonitorService(monitorRepo)
	monitorHandler := handlers.NewMonitorHandler(monitorService)

	groupRepo := repository.NewGroupRepository(db)
	groupService := services.NewGroupService(groupRepo)
	groupHandler := handlers.NewGroupHandler(groupService)

	// Subscriptions & Notifications
	channelRepo := repository.NewChannelRepository(db)
	channelHandler := handlers.NewChannelHandler(channelRepo)

	subRepo := repository.NewSubscriptionRepository(db)
	subHandler := handlers.NewSubscriptionHandler(subRepo)

	notifySvc := services.NewNotificationService(subRepo)
	resultRepo := repository.NewCheckResultRepository(db)
	
	pushService := services.NewPushService(monitorRepo, resultRepo, notifySvc)
	pushHandler := handlers.NewPushHandler(pushService)

	// Status Page
	statusRepo := repository.NewStatusPageRepository(db)
	statusSvc := services.NewStatusPageService(statusRepo, monitorRepo)
	statusHandler := handlers.NewStatusPageHandler(statusSvc, monitorRepo, resultRepo)

	// Incident Management
	incidentRepo := repository.NewIncidentRepository(db)
	incidentService := services.NewIncidentService(incidentRepo)
	incidentHandler := handlers.NewIncidentHandler(incidentService)

	// API Group
	api := r.Group("/api")
	{
		// Public Routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		// Public Status Page
		api.GET("/public/status", statusHandler.GetStatus)       // Default
		api.GET("/public/status/:slug", statusHandler.GetStatus) // Named
		api.GET("/public/monitors/:id/history", statusHandler.GetMonitorHistory)
		api.GET("/public/incidents", incidentHandler.ListActive) // Public incidents

		// System Status
		api.GET("/system/status", systemHandler.GetStatus)

		// Push Route (Public)
		api.GET("/push/:token", pushHandler.HandleHeartbeat)
		api.POST("/push/:token", pushHandler.HandleHeartbeat)

		// Protected Routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/auth/profile", func(c *gin.Context) {
				userID, _ := c.Get("userID")
				role, _ := c.Get("role")
				c.JSON(200, gin.H{
					"user_id": userID,
					"role":    role,
					"message": "You are authenticated",
				})
			})

			// Status Page Management
			pages := protected.Group("/status-pages")
			{
				pages.GET("", statusHandler.List)
				pages.POST("", statusHandler.Create)
				pages.PUT("/:id", statusHandler.Update)
				pages.DELETE("/:id", statusHandler.Delete)
			}

			// Monitor Routes
			monitors := protected.Group("/monitors")
			{
				monitors.GET("", monitorHandler.List)
				monitors.POST("", monitorHandler.Create)
				monitors.GET("/:id", monitorHandler.Get)
				monitors.PUT("/:id", monitorHandler.Update)
				monitors.DELETE("/:id", monitorHandler.Delete)
			}

			// Group Routes
			groups := protected.Group("/groups")
			{
				groups.GET("", groupHandler.List)
				groups.POST("", groupHandler.Create)
				groups.GET("/:id", groupHandler.Get)
				groups.PUT("/:id", groupHandler.Update)
				groups.DELETE("/:id", groupHandler.Delete)
			}

			// Channel Routes
			channels := protected.Group("/channels")
			{
				channels.GET("", channelHandler.List)
				channels.POST("", channelHandler.Create)
				channels.PUT("/:id", channelHandler.Update)
				channels.DELETE("/:id", channelHandler.Delete)
			}

			// Subscription Routes
			subs := protected.Group("/subscriptions")
			{
				subs.POST("", subHandler.Subscribe)
				subs.DELETE("", subHandler.Unsubscribe)
				subs.GET("/monitor/:monitorID", subHandler.ListByMonitor)
			}

			// Incident Routes
			incidents := protected.Group("/incidents")
			{
				incidents.GET("", incidentHandler.ListActive) // For admin list
				incidents.POST("", incidentHandler.Create)
				incidents.POST("/:id/resolve", incidentHandler.Resolve)
			}
		}
	}

	return r
}
