import React, { useContext } from 'react'
import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import Project from '../screens/Project'
import { UserContext } from '../context/user.context'

const Approutes = () => {
  const { user } = useContext(UserContext)

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect to login if not logged in */}
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" replace />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected route */}
        <Route path="/project" element={user ? <Project /> : <Navigate to="/login" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Approutes
