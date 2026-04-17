package workspace

import "fuse/pkg/errors"

var (
	ErrCreateWorkspaceInSevice = errors.New("CREATE_WORKSPACE_FAILED", "failed to create workspace")
	ErrFindWorkspace           = errors.New("FIND_WORKSPACE_FAILED", "failed to find workspace")
)
