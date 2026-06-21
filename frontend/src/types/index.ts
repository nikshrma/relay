export interface User {
    id: string;
    name: string;
    number: string;
}

export interface ApiMessage {
    message: string;
}

export interface AuthResponse {
    message: string;
    user: User;
}

export interface Group {
    id: string;
    name: string;
    createdAt: string;
    members?: GroupMember[];
}

export interface GroupMember {
    id: string;
    userId: string;
    groupId: string;
    role: string;
    joinedAt: string;
    user?: User;
}

export type Conversation = 
    | (User & { type: 'user' })
    | (Group & { type: 'group' });

export interface Message {
    content: string;
    createdAt: string;
    id: string;
    senderId: string;
    receiverId?: string;
    groupId?: string;
    deliveredAt?: string | null;
    readAt?: string | null;
    sender:{
        id:string;
        name:string;
    }
}

export interface SignupPayload {
    number: string;
    name: string;
    password: string;
}

export interface SigninPayload {
    number: string;
    password: string;
}
