import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const session = sessionStorage.getItem('userSession');
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
