import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardShell } from './components/dashboard/DashboardShell'
import { Login } from './components/auth/Login'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Overview } from './components/dashboard/Overview'
import { AttendanceLogs } from './components/dashboard/AttendanceLogs'
import { EmployeeList } from './components/dashboard/EmployeeList'
import { Settings } from './components/dashboard/Settings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardShell>
              <Routes>
                <Route index element={<Overview />} />
                <Route path="attendance" element={<AttendanceLogs />} />
                <Route path="employees" element={<EmployeeList />} />
                <Route path="settings" element={<Settings />} />
              </Routes>
            </DashboardShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
