import api from "@/services/api";
import type { SigninPayload, SignupPayload, User } from "@/types";
import React,{ useEffect, useState } from "react";
import { AuthContext } from "./auth";

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
