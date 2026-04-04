import type { User } from "@/types";


interface AuthContextType{
    user:User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signin: (number:string, password:string)=>Promise<void>;
    signup: (number:string, password:string , name:string)=>Promise<void>
    logout:()=>void
}