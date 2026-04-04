import axios, { type AxiosInstance } from "axios";
import type { User, ApiMessage, Message, SignupPayload, SigninPayload } from "@/types";

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
        this.client.interceptors.response.use((response)=> response,(error)=>{
            if (error.response?.status===401){
                //TODO: redirect to login page
            }
        })
    }
    public static getInstance(): APIClient {
        if (!APIClient.instance) {
            APIClient.instance = new APIClient();
        }
        return APIClient.instance;
    }
    async signup(payload: SignupPayload): Promise<ApiMessage> {
        const { data } = await this.client.post<ApiMessage>('/signup', payload);
        return data;
    }
    async signin(payload: SigninPayload): Promise<ApiMessage> {
        const { data } = await this.client.post<ApiMessage>('/signin', payload);
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
    async logout(): Promise<ApiMessage>{
        const { data } = await this.client.post<ApiMessage>('/logout');
        return data.message;
    }
    async me():
}

const api = APIClient.getInstance();
export default api;