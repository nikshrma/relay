import type React from "react";

export default function AuthLayout({children}:{children:React.ReactNode}){
    return <div className="flex items-center justify-center h-screen w-screen">
        <div className="w-full max-w-md border rounded-xl p-8 flex flex-col gap-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">Relay</h1>
                <p className="text-sm mt-1">Send messages, instantly.</p>
            </div>
            {children}
        </div>
    </div>
}
