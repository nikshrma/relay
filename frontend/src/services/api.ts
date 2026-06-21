import axios, { type AxiosInstance } from "axios";
import type { User, ApiMessage, AuthResponse, Message, SignupPayload, SigninPayload, Group } from "@/types";

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
    async createGroup(name: string, userIds: string[]): Promise<Group> {
        const { data } = await this.client.post<{ message: string; createdGroup: Group }>('/groups', { name, members: userIds });
        return data.createdGroup;
    }
    async getGroups(): Promise<Group[]> {
        const { data } = await this.client.get<{ groups: Group[] }>('/groups');
        return data.groups;
    }
    async getGroupMessages(groupId: string): Promise<Message[]> {
        const { data } = await this.client.get<{ messages: Message[] }>(`/groups/${groupId}/messages`);
        return data.messages;
    }
    async logout(): Promise<ApiMessage> {
        const { data } = await this.client.post<ApiMessage>('/logout');
        return data;
    }
    async me(): Promise<User> {
        const { data } = await this.client.get<{user:User}>('/me');
        return data.user;
    }
    async getGroupDetails(groupId: string): Promise<Group> {
        const { data } = await this.client.get<{ group: Group }>(`/groups/${groupId}`);
        return data.group;
    }
    async addGroupMembers(groupId: string, userIds: string[]): Promise<void> {
        await this.client.post(`/groups/${groupId}/members`, userIds);
    }
    async removeGroupMembers(groupId: string, userIds: string[]): Promise<void> {
        await this.client.delete(`/groups/${groupId}/members`, { data: userIds });
    }
    async leaveGroup(groupId: string): Promise<void> {
        await this.client.delete(`/groups/${groupId}/leave`);
    }
}

const api = APIClient.getInstance();
export default api;