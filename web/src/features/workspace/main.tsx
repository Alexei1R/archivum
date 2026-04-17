import React from "react";
import Workspaces from "./components/workspaces/workspaces";
import type { Workspace } from "./types";
import { useWorkspaceStore } from "./store";


const Main: React.FC = () => {

    const setCurrentWs = useWorkspaceStore(store => store.setCurrentWorkspace);

    const handleRowClick = React.useCallback((workspace: Workspace) => {
        setCurrentWs(workspace);

    }, []);

    return (
        <div className="w-full h-full">
            <Workspaces onRowClick={handleRowClick} />
        </div>


    );
};

export default Main;
