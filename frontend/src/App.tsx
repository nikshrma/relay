import type React from "react"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Chat from "./pages/Chat";

function ProtectedRoutes({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div>Loading...</div>
  }
  if (!isAuthenticated) {
    return <Navigate to={"/signin"} replace />
  }
  return <>{children}</>
}

function App() {
  function AppRoutes() {
    return (
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/chats" element={<ProtectedRoutes><Chat /></ProtectedRoutes>} />
      </Routes>
    )
  }

  return <>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </>
}

export default App
