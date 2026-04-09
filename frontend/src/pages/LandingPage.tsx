import { Link } from "react-router-dom";

export default function LandingPage(){
    return <div className="flex items-center justify-center h-screen w-screen">
        <div className="text-center flex flex-col gap-6">
            <h1 className="text-5xl font-bold tracking-tight">Relay</h1>
            <p className="text-lg">Real-time messaging, no noise.</p>
            <div className="flex items-center justify-center gap-4">
                <Link to="/signin" className="border rounded-lg px-6 py-2 text-sm font-medium">Sign In</Link>
                <Link to="/signup" className="border rounded-lg px-6 py-2 text-sm font-medium">Sign Up</Link>
            </div>
        </div>
    </div>
}
