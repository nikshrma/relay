import { useAuth } from "@/contexts/AuthContext";
import { useState, type FormEvent } from "react";
import AuthLayout from "@/layouts/AuthLayout";
import { Link, useNavigate } from "react-router-dom";


export default function SignUp(){
    const [name , setName] = useState("");
    const [number , setNumber] = useState("");
    const [password , setPassword] = useState("");
    const [isLoading , setIsLoading] = useState(false);
    const {signup} = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async(e: FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        setIsLoading(true);
        try{
            await signup({number, password , name});
            navigate("/chats");
        }catch(e){
            console.error("Sign up failed", e);
        }finally{
            setIsLoading(false);
        }
    }
    return <AuthLayout>
        <h2 className="text-lg font-semibold">Sign up</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <input id="name" className="border rounded-lg px-3 py-2 text-sm outline-none" type="text" placeholder="John Doe" value={name} onChange={(e)=>setName(e.target.value)} required disabled={isLoading}/>
            </div>
            <div className="flex flex-col gap-1">
                <label htmlFor="number" className="text-sm font-medium">Number</label>
                <input id="number" className="border rounded-lg px-3 py-2 text-sm outline-none" type="text" placeholder="1234567890" value={number} onChange={(e)=>setNumber(e.target.value)} required disabled={isLoading}/>
            </div>
            <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <input id="password" className="border rounded-lg px-3 py-2 text-sm outline-none" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required disabled={isLoading}/>
            </div>
            <button className="border rounded-lg px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-50 mt-2" type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Sign Up"}
            </button>
        </form>
        <p className="text-sm text-center">Already have an account? <Link to="/signin" className="font-medium underline">Sign In</Link></p>
    </AuthLayout>

}