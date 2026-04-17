interface CreateWorkspaceRequest {
    name: string;
}


// type Workspace struct {
// 	ID        uuid.UUID `json:"id"`
// 	Name      string    `json:"name"`
// 	OwnerID   uuid.UUID `json:"owner_id"`
// 	Plan      Plan      `json:"plan"`
// 	UpdatedAt time.Time `json:"updated_at"`
// 	CreatedAt time.Time `json:"created_at"`
// }
//
//
interface CreateWorkspaceRequest {
    name: string;
}

interface Workspace {
    id: string;
    name: string;
    owner_id: string;
    plan: string;
    updated_at: string;
    created_at: string;
}


export type { CreateWorkspaceRequest, Workspace }
