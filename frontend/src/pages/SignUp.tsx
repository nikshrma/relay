import { useAuth } from "@/contexts/AuthContext";
import { useState, type FormEvent } from "react";


export default function SignUp(){
    const [name , setName] = useState("");
    const [number , setNumber] = useState("");
    const [password , setPassword] = useState("");
    const [isLoading , setIsLoading] = useState(false);
    const {signup} = useAuth();
    const handleSubmit = async(e: FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        setIsLoading(true);
        try{
            await signup(number, password , name);
            //TODO: navigate to /chats here
        }catch(e){
            //TODO: log error
        }finally{
            setIsLoading(false);
        }
    }
    return <div>
        <div> <h1>Sign up</h1></div>
        <form onSubmit={handleSubmit}>
            <div>
            <label htmlFor="name"> Name </label>
            <input id="name" type="text" placeholder="John Doe" value={name} onChange={(e)=>setName(e.target.value)} required disabled={isLoading}/>
            </div>
            <div>
            <div>
            <label htmlFor="number"> Number </label>
            <input id="number" type="text" placeholder="1234567890" value={number} onChange={(e)=>setNumber(e.target.value)} required disabled={isLoading}/>
            </div>
            <label htmlFor="password"> Password </label>
            <input id="password" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required disabled={isLoading}/>
            </div>
            <button type="submit" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
    </div>

}