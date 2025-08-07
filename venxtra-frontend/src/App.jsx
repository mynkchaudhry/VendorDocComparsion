import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { TranslationProvider } from './contexts/TranslationContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
// import Documents from './pages/Documents'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import ProjectDetails from './pages/ProjectDetails'
import VendorDetails from './pages/VendorDetails'
import Comparison from './pages/Comparison'
import ComparisonResults from './pages/ComparisonResults'
import ToastContainer from './components/ui/Toast'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TranslationProvider>
        <div className="min-h-screen bg-white dark:bg-dark-primary transition-colors duration-200">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              {/* <Route path="documents" element={<Documents />} /> */}
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="projects/:projectId" element={<ProjectDetails />} />
              <Route path="vendors/:vendorId" element={<VendorDetails />} />
              <Route path="projects/:projectId/compare" element={<Comparison />} />
              <Route path="projects/:projectId/results" element={<ComparisonResults />} />
            </Route>
          </Routes>
          <ToastContainer />
        </div>
        </TranslationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App