import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardShell } from './components/layout/DashboardShell'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { AppDataProvider } from './contexts/app-data-context'
import { ErrorBoundary } from './components/ErrorBoundary'

import { PageTransition } from './components/layout/PageTransition'

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const OverviewPage = lazy(() => import('./pages/OverviewPage').then(m => ({ default: m.OverviewPage })))
const AttendancePage = lazy(() => import('./pages/AttendancePage').then(m => ({ default: m.AttendancePage })))
const EmployeesPage = lazy(() => import('./pages/EmployeesPage').then(m => ({ default: m.EmployeesPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <span className="animate-pulse">Đang tải...</span>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <AppDataProvider>
                <DashboardShell>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route index element={<PageTransition><OverviewPage /></PageTransition>} />
                        <Route path="attendance" element={<PageTransition><AttendancePage /></PageTransition>} />
                        <Route path="employees" element={<PageTransition><EmployeesPage /></PageTransition>} />
                        <Route path="settings" element={<PageTransition><SettingsPage /></PageTransition>} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </DashboardShell>
              </AppDataProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
