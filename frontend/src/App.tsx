import type React from "react"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Chat from "./pages/Chat";
import LandingPage from "./pages/LandingPage";

function ProtectedRoutes({children}:{children: React.ReactNode}){
  const {isAuthenticated, isLoading} = useAuth();
  if(isLoading){
    return <div>Loading...</div>
  }
  if(!isAuthenticated){
    return <Navigate to={"/signin"} replace/>
  }
  return <>{children}</>
}

function PublicRoute({children}:{children: React.ReactNode}){
  const {isAuthenticated, isLoading} = useAuth();
  if(isLoading){
    return <div>Loading...</div>
  }
  if(isAuthenticated){
    return <Navigate to={"/chats"} replace/>
  }
  return <>{children}</>
}

function AppRoutes(){
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LandingPage/></PublicRoute>}/>
      <Route path="/signin" element={<PublicRoute><SignIn/></PublicRoute>}/>
      <Route path="/signup" element={<PublicRoute><SignUp/></PublicRoute>}/>
      <Route path="/chats" element={<ProtectedRoutes><Chat/></ProtectedRoutes>}/>
    </Routes>
  )
}

function App(){
  return <>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes/>
      </AuthProvider>
    </BrowserRouter>
  </>
}

export default App
