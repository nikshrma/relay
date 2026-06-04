import { createContext, useContext } from "react";
import type { SigninPayload, SignupPayload, User } from "@/types";

export interface AuthContextType{
    user:User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signin: (payload: SigninPayload)=>Promise<void>;
    signup: (payload:SignupPayload)=>Promise<void>
    logout:()=>void
}

export const AuthContext = createContext< AuthContextType | undefined >(undefined)

export function useAuth(){
    const context = useContext(AuthContext);
    if(!context){
       throw new Error("useAuth must be used within provider");
    }
    return context;
}
