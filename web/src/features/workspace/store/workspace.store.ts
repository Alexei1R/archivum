import { create } from 'zustand';
import type { Workspace } from '../types/workspace.types';

interface WorkspaceStoreProps {
    error: string | null;
    currentWorkspace: Workspace | null;
    setCurrentWorkspace: (workspace: Workspace | null) => void;
    workspaces: Workspace[];
    setWorkspaces: (workspaces: Workspace[]) => void;
    addWorkspace: (workspace: Workspace) => void;
    deleteWorkspace: (workspaceId: string) => void;
    reset: () => void;
    setError: (error: string | null) => void;
}

const useWorkspaceStore = create<WorkspaceStoreProps>((set) => ({
    currentWorkspace: null,
    error: null,
    setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
    workspaces: [],
    setWorkspaces: (workspaces) => set({ workspaces }),
    addWorkspace: (workspace) =>
        set((state) => ({
            workspaces: [...state.workspaces, workspace],
            currentWorkspace: workspace,
        })),
    deleteWorkspace: (workspaceId) =>
        set((state) => ({
            workspaces: state.workspaces.filter((workspace) => workspace.id !== workspaceId),
            currentWorkspace: state.currentWorkspace?.id === workspaceId ? null : state.currentWorkspace,
        })),
    setError: (error) => set({ error }),
    reset: () => set({ currentWorkspace: null, workspaces: [] }),
}));

export default useWorkspaceStore;
