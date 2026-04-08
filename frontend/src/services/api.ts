import axios, { type AxiosInstance } from "axios";
import type { User, ApiMessage, AuthResponse, Message, SignupPayload, SigninPayload } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class APIClient {
    private static instance: APIClient;
    private client: AxiosInstance;
    private constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                "Content-Type": "application/json"
            },
            withCredentials: true
        });
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response?.status === 401) {
                //TODO: redirect to login page
            }
            return Promise.reject(error);
        })
    }
    public static getInstance(): APIClient {
        if (!APIClient.instance) {
            APIClient.instance = new APIClient();
        }
        return APIClient.instance;
    }
    async signup(payload: SignupPayload): Promise<AuthResponse> {
        const { data } = await this.client.post<AuthResponse>('/signup', payload);
        return data;
    }
    async signin(payload: SigninPayload): Promise<AuthResponse> {
        const { data } = await this.client.post<AuthResponse>('/signin', payload);
        return data;
    }
    async getMessages(userId: string): Promise<Message[]> {
        const { data } = await this.client.get<{ messages: Message[] }>('/messages', {
            params: {
                userId
            }
        });
        return data.messages;
    }
    async getUsers(): Promise<User[]> {
        const { data } = await this.client.get<{ users: User[] }>('/users');
        return data.users;
    }
    async logout(): Promise<ApiMessage> {
        const { data } = await this.client.post<ApiMessage>('/logout');
        return data;
    }
    async me(): Promise<User> {
        const { data } = await this.client.get<{user:User}>('/me');
        return data.user;
    }
}

const api = APIClient.getInstance();
export default api;