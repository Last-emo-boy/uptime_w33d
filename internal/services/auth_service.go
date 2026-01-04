package services

import (
	"errors"

	"uptime_w33d/internal/models"
	"uptime_w33d/internal/repository"
	"uptime_w33d/pkg/utils"
)

type AuthService interface {
	Register(username, password, email string) error
	Login(username, password string) (string, error)
}

type authService struct {
	userRepo repository.UserRepository
}

func NewAuthService(userRepo repository.UserRepository) AuthService {
	return &authService{userRepo: userRepo}
}

func (s *authService) Register(username, password, email string) error {
	existingUser, err := s.userRepo.GetByUsername(username)
	if err != nil {
		return err
	}
	if existingUser != nil {
		return errors.New("username already exists")
	}

	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return err
	}

	user := &models.User{
		Username:     username,
		PasswordHash: hashedPassword,
		Email:        email,
		Role:         models.RoleGuest, // Default role
	}

	// First user is admin (optional logic, skipping for simplicity)

	return s.userRepo.Create(user)
}

func (s *authService) Login(username, password string) (string, error) {
	user, err := s.userRepo.GetByUsername(username)
	if err != nil {
		return "", err
	}
	if user == nil {
		return "", errors.New("invalid username or password")
	}

	if !utils.CheckPasswordHash(password, user.PasswordHash) {
		return "", errors.New("invalid username or password")
	}

	token, err := utils.GenerateToken(user.ID, string(user.Role))
	if err != nil {
		return "", err
	}

	return token, nil
}
