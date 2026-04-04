import api from "@/api/api";
import type { User } from "@/types";
import React,{ createContext, useContext, useEffect, useState } from "react";


interface AuthContextType{
    user:User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signin: (number:string, password:string)=>Promise<void>;
    signup: (number:string, password:string , name:string)=>Promise<void>
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

    const signup= async(number:string , password:string, name:string)=>{
        await api.signup({name,number,password});
        const currentUser = await api.me();
        setUser(currentUser);
    }
    const signin= async(number:string , password:string)=>{
        await api.signin({number,password});
        const currentUser = await api.me();
        setUser(currentUser);
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