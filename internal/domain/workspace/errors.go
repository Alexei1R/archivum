package workspace

import "fuse/pkg/errors"

var (
	ErrInvalidWorkspace      = errors.New("INVALID_WORKSPACE", "the workspace is invalid")
	ErrWorkspaceNameExists   = errors.New("WORKSPACE_NAME_EXISTS", "a workspace with the given name already exists")
	ErrCreateWorkspaceFailed = errors.New("CREATE_WORKSPACE_FAILED", "failed to create workspace")
	ErrUpdateWorkspaceFailed = errors.New("UPDATE_WORKSPACE_FAILED", "failed to update workspace")
	ErrDeleteWorkspaceFailed = errors.New("DELETE_WORKSPACE_FAILED", "failed to delete workspace")
	ErrWorkspaceIDEmpty      = errors.New("WORKSPACE_ID_EMPTY", "workspace ID cannot be empty")
	ErrWorkspaceNameEmpty    = errors.New("WORKSPACE_NAME_EMPTY", "workspace name cannot be empty")
	ErrWorkspaceNotFound     = errors.New("WORKSPACE_NOT_FOUND", "workspace not found")
	ErrOwnerIDEmpty          = errors.New("OWNER_ID_EMPTY", "workspace owner ID cannot be empty")
	ErrDatabaseOperation     = errors.New("DATABASE_OPERATION_FAILED", "database operation failed")

	ErrInvalidMember          = errors.New("INVALID_MEMBER", "the member is invalid")
	ErrMemberNotFound         = errors.New("MEMBER_NOT_FOUND", "workspace member not found")
	ErrAddMemberFailed        = errors.New("ADD_MEMBER_FAILED", "failed to add member to workspace")
	ErrRemoveMemberFailed     = errors.New("REMOVE_MEMBER_FAILED", "failed to remove member from workspace")
	ErrUpdateMemberRoleFailed = errors.New("UPDATE_MEMBER_ROLE_FAILED", "failed to update member role")
	ErrMemberIDEmpty          = errors.New("MEMBER_ID_EMPTY", "member ID cannot be empty")
)
