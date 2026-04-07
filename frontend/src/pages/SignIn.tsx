import { useAuth } from "@/contexts/AuthContext";
import { useState, type FormEvent } from "react";


export default function SignIn(){
    const [number , setNumber] = useState("");
    const [password , setPassword] = useState("");
    const [isLoading , setIsLoading] = useState(false);
    const {signin} = useAuth();
    const handleSubmit = async(e: FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        setIsLoading(true);
        try{
            await signin(number, password)
            //TODO: navigate to /chats here
        }catch(e){
            //TODO: log error
        }finally{
            setIsLoading(false);
        }
    }
    return <div>
        <div> <h1>Sign in</h1></div>
        <form onSubmit={handleSubmit}>
            <div>
            <label htmlFor="number"> Number </label>
            <input id="number" type="text" placeholder="1234567890" value={number} onChange={(e)=>setNumber(e.target.value)} required disabled={isLoading}/>
            </div>
            <div>
            <label htmlFor="password"> Password </label>
            <input id="password" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required disabled={isLoading}/>
            </div>
            <button type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
    </div>

}