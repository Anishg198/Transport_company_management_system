import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ToastProvider } from './components/ui/Toast'
import Layout from './components/Layout/Layout'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Consignments from './pages/Consignments'
import ConsignmentDetail from './pages/ConsignmentDetail'
import Fleet from './pages/Fleet'
import FleetDetail from './pages/FleetDetail'
import Dispatch from './pages/Dispatch'
import DispatchDetail from './pages/DispatchDetail'
import Bills from './pages/Bills'
import Reports from './pages/Reports'
import Pricing from './pages/Pricing'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Chat from './pages/Chat'

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function LayoutWithOutlet() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

      <Route path="/" element={
        <ProtectedRoute>
          <LayoutWithOutlet />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="consignments" element={<Consignments />} />
        <Route path="consignments/:id" element={<ConsignmentDetail />} />
        <Route path="fleet" element={
          <ProtectedRoute roles={['TransportManager', 'SystemAdministrator']}>
            <Fleet />
          </ProtectedRoute>
        } />
        <Route path="fleet/:id" element={
          <ProtectedRoute roles={['TransportManager', 'SystemAdministrator']}>
            <FleetDetail />
          </ProtectedRoute>
        } />
        <Route path="dispatch" element={<Dispatch />} />
        <Route path="dispatch/:id" element={<DispatchDetail />} />
        <Route path="bills" element={<Bills />} />
        <Route path="bills/:id" element={<Bills />} />
        <Route path="reports" element={
          <ProtectedRoute roles={['TransportManager', 'SystemAdministrator']}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="pricing" element={
          <ProtectedRoute roles={['SystemAdministrator']}>
            <Pricing />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute roles={['SystemAdministrator']}>
            <Users />
          </ProtectedRoute>
        } />
        <Route path="chat" element={
          <ProtectedRoute roles={['BranchOperator', 'TransportManager', 'SystemAdministrator']}>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
