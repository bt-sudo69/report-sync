import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Report from './pages/Report'
import SharedReport from './pages/SharedReport'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#1f2937',
              color: '#fff',
              fontSize: '14px',
            },
          }}
        />
        <Routes>
          {/* Public routes with navbar */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Landing />
              </>
            }
          />
          <Route
            path="/login"
            element={
              <>
                <Navbar />
                <Login />
              </>
            }
          />
          <Route
            path="/signup"
            element={
              <>
                <Navbar />
                <Signup />
              </>
            }
          />
          <Route
            path="/share/:id"
            element={
              <>
                <Navbar />
                <SharedReport />
              </>
            }
          />

          {/* Dashboard — has its own sidebar, no top navbar */}
          <Route path="/dashboard/*" element={<Dashboard />} />

          {/* Individual report view */}
          <Route
            path="/report/:id"
            element={
              <>
                <Navbar />
                <Report />
              </>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}