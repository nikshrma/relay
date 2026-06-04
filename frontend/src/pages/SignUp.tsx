import { useAuth } from "@/contexts/auth";
import { useState, type FormEvent } from "react";
import AuthLayout from "@/layouts/AuthLayout";
import { Link, useNavigate } from "react-router-dom";
import { getAuthErrorMessage } from "@/utils/authFeedback";

type Feedback = {
    type: "success" | "error";
    message: string;
} | null;

export default function SignUp(){
    const [name , setName] = useState("");
    const [number , setNumber] = useState("");
    const [password , setPassword] = useState("");
    const [isLoading , setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<Feedback>(null);
    const {signup} = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async(e: FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        setIsLoading(true);
        setFeedback(null);
        try{
            await signup({number, password , name});
            setFeedback({type: "success", message: "Account created. Opening chats..."});
            window.setTimeout(()=>navigate("/chats"), 500);
        }catch(e){
            setIsLoading(false);
            setFeedback({
                type: "error",
                message: getAuthErrorMessage(e, "Sign up failed. Please check your details."),
            });
            return;
        }
    }
    const inputClassName = "border rounded-lg px-3 py-2 text-sm outline-none focus:border-black disabled:opacity-60";
    const clearFeedback = ()=>{
        if(feedback) setFeedback(null);
    }
    return <AuthLayout>
        <h2 className="text-lg font-semibold">Sign up</h2>
        {feedback && (
            <div
                role="status"
                className={`rounded-lg border px-3 py-2 text-sm ${feedback.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
            >
                {feedback.message}
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <input id="name" className={inputClassName} type="text" placeholder="John Doe" value={name} onChange={(e)=>{setName(e.target.value); clearFeedback();}} required disabled={isLoading}/>
            </div>
            <div className="flex flex-col gap-1">
                <label htmlFor="number" className="text-sm font-medium">Number</label>
                <input id="number" className={inputClassName} type="tel" inputMode="tel" placeholder="1234567890" value={number} onChange={(e)=>{setNumber(e.target.value); clearFeedback();}} minLength={10} required disabled={isLoading}/>
            </div>
            <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <input id="password" className={inputClassName} type="password" placeholder="Password" value={password} onChange={(e)=>{setPassword(e.target.value); clearFeedback();}} minLength={6} required disabled={isLoading}/>
            </div>
            <button className="border rounded-lg px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-50 mt-2" type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Sign Up"}
            </button>
        </form>
        <p className="text-sm text-center">Already have an account? <Link to="/signin" className="font-medium underline">Sign In</Link></p>
    </AuthLayout>

}
