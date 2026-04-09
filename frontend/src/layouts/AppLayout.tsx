import type React from "react";

export default function AppLayout({sidebar, children}:{sidebar:React.ReactNode; children:React.ReactNode}){
    return <div className="flex h-screen w-screen overflow-hidden">
        <aside className="w-80 shrink-0">{sidebar}</aside>
        <main className="flex-1 min-w-0">{children}</main>
    </div>
}
