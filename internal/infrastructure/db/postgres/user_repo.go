package postgres

import (
	"context"
	"errors"
	"fmt"
	"fuse/internal/domain/user"
	"fuse/internal/domain/user/models"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) user.Repository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, usr *user.User) error {
	if usr == nil {
		return user.ErrInvalidUser
	}

	dbUser := models.FromDomain(usr)

	if err := r.db.WithContext(ctx).Create(dbUser).Error; err != nil {
		if r.isUniqueConstraintError(err, "email") {
			return user.ErrEmailExists
		}
		return user.ErrCreateUserFailed.WithErr(err)
	}

	*usr = *dbUser.ToDomain()
	return nil
}

func (r *UserRepository) FindByID(ctx context.Context, id uuid.UUID) (*user.User, error) {
	if id == uuid.Nil {
		return nil, user.ErrUserIDEmpty
	}

	var dbUser models.DBUser
	if err := r.db.WithContext(ctx).First(&dbUser, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, user.ErrUserNotFound
		}
		return nil, user.ErrDatabaseOperation.WithErr(err)
	}

	return dbUser.ToDomain(), nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*user.User, error) {
	if email == "" {
		return nil, user.ErrEmailRequired
	}

	var dbUser models.DBUser
	if err := r.db.WithContext(ctx).First(&dbUser, "email = ?", email).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, user.ErrUserNotFound
		}
		return nil, user.ErrDatabaseOperation.WithErr(err)
	}

	return dbUser.ToDomain(), nil
}

func (r *UserRepository) Update(ctx context.Context, usr *user.User) error {
	if usr == nil {
		return user.ErrInvalidUser
	}

	dbUser := models.FromDomain(usr)
	if err := r.db.WithContext(ctx).Save(dbUser).Error; err != nil {
		if r.isUniqueConstraintError(err, "email") {
			return user.ErrEmailExists
		}
		return user.ErrUpdateUserFailed.WithErr(err)
	}

	return nil
}

func (r *UserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if id == uuid.Nil {
		return user.ErrUserIDEmpty
	}

	result := r.db.WithContext(ctx).Delete(&models.DBUser{}, "id = ?", id)
	if result.Error != nil {
		return user.ErrDeleteUserFailed.WithErr(result.Error)
	}

	if result.RowsAffected == 0 {
		return user.ErrUserNotFound
	}

	return nil
}

func (r *UserRepository) Search(ctx context.Context, query string, limit int) ([]*user.User, error) {
	if query == "" {
		return []*user.User{}, nil
	}

	if limit <= 0 {
		limit = 50
	}

	searchPattern := fmt.Sprintf("%%%s%%", strings.ToLower(query))
	var dbUsers []models.DBUser

	err := r.db.WithContext(ctx).
		Where("LOWER(name) LIKE ? OR LOWER(email) LIKE ?", searchPattern, searchPattern).
		Limit(limit).
		Find(&dbUsers).Error

	if err != nil {
		return nil, user.ErrDatabaseOperation.WithErr(err)
	}

	return r.convertToUsers(dbUsers), nil
}

func (r *UserRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	if email == "" {
		return false, user.ErrEmailRequired
	}

	var count int64
	err := r.db.WithContext(ctx).Model(&models.DBUser{}).Where("email = ?", email).Count(&count).Error
	if err != nil {
		return false, user.ErrDatabaseOperation.WithErr(err)
	}

	return count > 0, nil
}

func (r *UserRepository) convertToUsers(dbUsers []models.DBUser) []*user.User {
	users := make([]*user.User, len(dbUsers))
	for i, dbUser := range dbUsers {
		users[i] = dbUser.ToDomain()
	}
	return users
}

func (r *UserRepository) isUniqueConstraintError(err error, field string) bool {
	errStr := strings.ToLower(err.Error())
	return strings.Contains(errStr, "unique") &&
		strings.Contains(errStr, "constraint") &&
		strings.Contains(errStr, field)
}
