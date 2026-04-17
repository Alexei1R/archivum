export interface User {
    id: string;
    email: string;
    name: string;
    nickname: string;
    status: 'onboarding' | 'active' | 'pending' | 'inactive';
    role: 'admin' | 'user' | 'guest';
    provider: string;
    avatar?: string;
    location?: string;
    updatedAt: string; // ISO date string
    createdAt: string; // ISO date string
}


export interface LogoutResponse {
    message: string;
}
