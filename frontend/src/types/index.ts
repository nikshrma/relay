export interface User {
    id: string;
    name: string;
    number: string;
}

export interface ApiMessage {
    message: string;
}

export interface Message {
    content: string;
    createdAt: string;
    id: string;
    senderId: string;
    receiverId: string;
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
