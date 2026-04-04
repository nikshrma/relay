import axios, { type AxiosInstance } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Users {
    id: string,
    name: string,
    number: string,
}
interface apiMessage {
    message: string
}
interface Message {
    content: string,
    createdAt: string,
    id: string,
    senderId: string,
    receiverId: string
}
//TODO: move these over to types and add zod validation
export interface SignupPayload {
    number: string;
    name: string;
    password: string;
}
export interface SigninPayload {
    number: string;
    password: string;
}

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
    async signup(payload: SignupPayload): Promise<apiMessage> {
        const { data } = await this.client.post<apiMessage>('/signup', payload);
        return data;
    }
    async signin(payload: SigninPayload): Promise<apiMessage> {
        const { data } = await this.client.post<apiMessage>('/signin', payload);
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
    async getUsers(): Promise<Users[]> {
        const {data} = await this.client.get<{users : Users[]}>('/users');
        return data.users;
    }
}

const api = APIClient.getInstance();
export default api;