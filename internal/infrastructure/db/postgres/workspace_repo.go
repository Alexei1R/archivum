package postgres

import (
	"context"
	"errors"
	"fuse/internal/domain/workspace"
	"fuse/internal/domain/workspace/models"
	"fuse/pkg/log"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type WorkspaceRepository struct {
	db *gorm.DB
}

func NewWorkspaceRepository(db *gorm.DB) workspace.Repository {
	return &WorkspaceRepository{db: db}
}

func (r *WorkspaceRepository) Create(ctx context.Context, ws *workspace.Workspace) error {
	if ws == nil {
		return workspace.ErrInvalidWorkspace
	}

	dbWorkspace := models.FromDomain(ws)
	if err := r.db.WithContext(ctx).Create(dbWorkspace).Error; err != nil {
		if r.isUniqueConstraintError(err, "idx_workspace_owner_name") {
			log.Error("workspace name already exists for this owner: %v", err)
		}
		return workspace.ErrCreateWorkspaceFailed.WithErr(err)
	}

	*ws = *dbWorkspace.ToDomain()
	return nil
}

func (r *WorkspaceRepository) FindByName(ctx context.Context, name string) (*workspace.Workspace, error) {
	if name == "" {
		return nil, workspace.ErrWorkspaceNameEmpty
	}

	var dbWorkspace models.DBWorkspace
	if err := r.db.WithContext(ctx).Preload("Members").First(&dbWorkspace, "name = ?", name).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, workspace.ErrWorkspaceNotFound
		}
		return nil, workspace.ErrDatabaseOperation.WithErr(err)
	}
	return dbWorkspace.ToDomain(), nil
}

func (r *WorkspaceRepository) GetUserWorkspaces(ctx context.Context, ownerID uuid.UUID) ([]*workspace.Workspace, error) {
	if ownerID == uuid.Nil {
		return nil, workspace.ErrOwnerIDEmpty
	}

	var dbWorkspaces []models.DBWorkspace
	if err := r.db.WithContext(ctx).Preload("Members").Where("owner_id = ?", ownerID.String()).Find(&dbWorkspaces).Error; err != nil {
		return nil, workspace.ErrDatabaseOperation.WithErr(err)
	}

	return r.convertToWorkspaces(dbWorkspaces), nil
}

func (r *WorkspaceRepository) Update(ctx context.Context, ws *workspace.Workspace) error {
	if ws == nil {
		return workspace.ErrInvalidWorkspace
	}

	dbWorkspace := models.FromDomain(ws)
	if err := r.db.WithContext(ctx).Save(dbWorkspace).Error; err != nil {
		if r.isUniqueConstraintError(err, "idx_workspace_owner_name") {
			return workspace.ErrWorkspaceNameExists
		}
		return workspace.ErrUpdateWorkspaceFailed.WithErr(err)
	}
	return nil
}

func (r *WorkspaceRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if id == uuid.Nil {
		return workspace.ErrWorkspaceIDEmpty
	}

	//NOTE: Use transaction to delete members first, then workspace
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		//NOTE: Delete all workspace members first
		if err := tx.Delete(&models.DBMember{}, "workspace_id = ?", id.String()).Error; err != nil {
			return workspace.ErrDeleteWorkspaceFailed.WithErr(err)
		}

		//NOTE: Delete the workspace
		result := tx.Delete(&models.DBWorkspace{}, "id = ?", id)
		if result.Error != nil {
			return workspace.ErrDeleteWorkspaceFailed.WithErr(result.Error)
		}
		if result.RowsAffected == 0 {
			return workspace.ErrWorkspaceNotFound
		}
		return nil
	})
}

func (r *WorkspaceRepository) FindByMemberID(ctx context.Context, memberID uuid.UUID) ([]*workspace.Workspace, error) {
	if memberID == uuid.Nil {
		return nil, workspace.ErrMemberIDEmpty
	}

	var dbWorkspaces []models.DBWorkspace
	if err := r.db.WithContext(ctx).
		Joins("JOIN workspace_members ON workspace_members.workspace_id = workspaces.id").
		Where("workspace_members.user_id = ?", memberID.String()).
		Preload("Members").
		Find(&dbWorkspaces).Error; err != nil {
		return nil, workspace.ErrDatabaseOperation.WithErr(err)
	}

	return r.convertToWorkspaces(dbWorkspaces), nil
}

func (r *WorkspaceRepository) AddMember(ctx context.Context, member *workspace.Member) error {
	if member == nil {
		return workspace.ErrInvalidMember
	}

	dbMember := models.FromDomainMember(member)
	if err := r.db.WithContext(ctx).Create(dbMember).Error; err != nil {
		return workspace.ErrAddMemberFailed.WithErr(err)
	}
	return nil
}

func (r *WorkspaceRepository) RemoveMember(ctx context.Context, workspaceID, userID uuid.UUID) error {
	if workspaceID == uuid.Nil || userID == uuid.Nil {
		return workspace.ErrInvalidMember
	}

	result := r.db.WithContext(ctx).Delete(&models.DBMember{}, "workspace_id = ? AND user_id = ?", workspaceID.String(), userID.String())
	if result.Error != nil {
		return workspace.ErrRemoveMemberFailed.WithErr(result.Error)
	}
	if result.RowsAffected == 0 {
		return workspace.ErrMemberNotFound
	}
	return nil
}

func (r *WorkspaceRepository) UpdateMemberRole(ctx context.Context, workspaceID, userID uuid.UUID, role workspace.Role) error {
	if workspaceID == uuid.Nil || userID == uuid.Nil {
		return workspace.ErrInvalidMember
	}

	if err := r.db.WithContext(ctx).Model(&models.DBMember{}).
		Where("workspace_id = ? AND user_id = ?", workspaceID.String(), userID.String()).
		Update("role", string(role)).Error; err != nil {
		return workspace.ErrUpdateMemberRoleFailed.WithErr(err)
	}

	return nil
}

func (r *WorkspaceRepository) ListMembers(ctx context.Context, workspaceID uuid.UUID) ([]*workspace.Member, error) {
	if workspaceID == uuid.Nil {
		return nil, workspace.ErrWorkspaceIDEmpty
	}

	var dbMembers []models.DBMember
	if err := r.db.WithContext(ctx).Where("workspace_id = ?", workspaceID.String()).Find(&dbMembers).Error; err != nil {
		return nil, workspace.ErrDatabaseOperation.WithErr(err)
	}

	members := make([]*workspace.Member, len(dbMembers))
	for i, dbm := range dbMembers {
		members[i] = dbm.ToDomain()
	}
	return members, nil
}

func (r *WorkspaceRepository) CreateWorkspaceWithOwner(ctx context.Context, ws *workspace.Workspace, owner *workspace.Member) error {
	if ws == nil {
		return workspace.ErrInvalidWorkspace
	}
	if owner == nil {
		return workspace.ErrInvalidMember
	}
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		dbWorkspace := models.FromDomain(ws)
		if err := tx.Create(dbWorkspace).Error; err != nil {
			if r.isUniqueConstraintError(err, "idx_workspace_owner_name") {
				return workspace.ErrWorkspaceNameExists
			}
			return workspace.ErrCreateWorkspaceFailed.WithErr(err)
		}
		dbMember := models.FromDomainMember(owner)
		if err := tx.Create(dbMember).Error; err != nil {
			return workspace.ErrAddMemberFailed.WithErr(err)
		}
		*ws = *dbWorkspace.ToDomain()
		*owner = *dbMember.ToDomain()
		return nil
	})
}

func (r *WorkspaceRepository) convertToWorkspaces(dbWorkspaces []models.DBWorkspace) []*workspace.Workspace {
	workspaces := make([]*workspace.Workspace, len(dbWorkspaces))
	for i, dbw := range dbWorkspaces {
		workspaces[i] = dbw.ToDomain()
	}
	return workspaces
}

func (r *WorkspaceRepository) isUniqueConstraintError(err error, field string) bool {
	errStr := strings.ToLower(err.Error())
	return strings.Contains(errStr, "unique") &&
		strings.Contains(errStr, "constraint") &&
		strings.Contains(errStr, field)
}
