import api from "@/services/api";
import type { SigninPayload, SignupPayload, User } from "@/types";
import React,{ createContext, useContext, useEffect, useState } from "react";


interface AuthContextType{
    user:User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signin: (payload: SigninPayload)=>Promise<void>;
    signup: (payload:SignupPayload)=>Promise<void>
    logout:()=>void
}

const AuthContext = createContext< AuthContextType | undefined >(undefined)
export function AuthProvider({children}:{children: React.ReactNode}){
    const [user , setUser] = useState<User | null>(null);
    const [isLoading , setIsLoading] = useState(true);

    useEffect(()=>{
        api.me()
        .then(setUser)
        .catch(()=>setUser(null))
        .finally(()=>setIsLoading(false))
    },[])

    const signup= async(payload:SignupPayload)=>{
        const data = await api.signup(payload);
        setUser(data.user);
    }
    const signin= async(payload:SigninPayload)=>{
       const data = await api.signin(payload);
        setUser(data.user);
    }
    const logout = async()=>{
        await api.logout();
        setUser(null);
    }
    return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, signin, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(){
    const context = useContext(AuthContext);
    if(!context){
       throw new Error("useAuth must be used within provider");
    }
    return context;
}