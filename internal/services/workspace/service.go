package workspace

import (
	"context"

	"fuse/internal/domain/workspace"
	"fuse/pkg/errors"
	"fuse/pkg/log"

	"github.com/google/uuid"
)

type Service struct {
	workspaceRepo workspace.Repository
}

func NewService(wsRepo workspace.Repository) *Service {
	return &Service{
		workspaceRepo: wsRepo,
	}
}

func (s *Service) CreateWorkspace(ctx context.Context, name string, ownerID uuid.UUID) (*workspace.Workspace, error) {
	ws := workspace.NewWorkspace(name, ownerID)
	wsMember := workspace.NewMember(ownerID, ws.ID, workspace.RoleOwner)

	// existing, _ := s.workspaceRepo.FindByName(ctx, name)
	// if existing != nil {
	// 	return nil, errors.ErrNameExists.WithDetail("workspace name already exists in the system")
	// }
	//
	if err := s.workspaceRepo.CreateWorkspaceWithOwner(ctx, ws, wsMember); err != nil {
		log.Error("failed to create workspace in db: %v", err)
		return nil, err
	}
	return ws, nil

}

func (s *Service) GetUserWorkspaces(ctx context.Context, ownerID uuid.UUID) ([]*workspace.Workspace, error) {
	if ownerID == uuid.Nil {
		return nil, errors.ErrInternalServer.WithDetail("owner ID cannot be empty")
	}

	workspaces, err := s.workspaceRepo.GetUserWorkspaces(ctx, ownerID)
	if err != nil {
		log.Error("failed to retrieve workspaces for owner %s: %v", ownerID, err)
		return nil, err
	}
	return workspaces, nil
}

func (s *Service) DeleteWorkspace(ctx context.Context, wsID uuid.UUID) error {
	if wsID == uuid.Nil {
		return errors.ErrInternalServer.WithDetail("workspace ID cannot be empty")
	}

	if err := s.workspaceRepo.Delete(ctx, wsID); err != nil {
		log.Error("failed to delete workspace %s: %v", wsID, err)
		return err
	}

	return nil
}
