import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardShell } from './components/dashboard/DashboardShell'
import { Login } from './components/auth/Login'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route 
        path="/dashboard/*" 
        element={
          <DashboardShell>
            <div className="p-6">
              <h1 className="text-2xl font-bold">Dashboard Placeholder</h1>
              <p className="text-muted-foreground mt-2">Nội dung trang Tổng quan sẽ nằm ở đây</p>
            </div>
          </DashboardShell>
        } 
      />
    </Routes>
  )
}

export default App
