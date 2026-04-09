import { useAuth } from "@/contexts/AuthContext";
import { useState, type FormEvent } from "react";
import AuthLayout from "@/layouts/AuthLayout";
import { Link, useNavigate } from "react-router-dom";


export default function SignIn(){
    const [number , setNumber] = useState("");
    const [password , setPassword] = useState("");
    const [isLoading , setIsLoading] = useState(false);
    const {signin} = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async(e: FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        setIsLoading(true);
        try{
            await signin({number, password})
            navigate("/chats");
        }catch(e){
            console.error("Sign in failed", e);
        }finally{
            setIsLoading(false);
        }
    }
    return <AuthLayout>
        <h2 className="text-lg font-semibold">Sign in</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label htmlFor="number" className="text-sm font-medium">Number</label>
                <input id="number" className="border rounded-lg px-3 py-2 text-sm outline-none" type="text" placeholder="1234567890" value={number} onChange={(e)=>setNumber(e.target.value)} required disabled={isLoading}/>
            </div>
            <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <input id="password" className="border rounded-lg px-3 py-2 text-sm outline-none" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required disabled={isLoading}/>
            </div>
            <button className="border rounded-lg px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-50 mt-2" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
            </button>
        </form>
        <p className="text-sm text-center">Don't have an account? <Link to="/signup" className="font-medium underline">Sign Up</Link></p>
    </AuthLayout>

}