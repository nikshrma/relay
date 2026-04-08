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

export interface Message {
    content: string;
    createdAt: string;
    id: string;
    senderId: string;
    receiverId: string;
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
