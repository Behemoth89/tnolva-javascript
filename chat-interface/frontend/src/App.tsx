import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import NavBar from './components/NavBar';
import RouteGuard from './components/RouteGuard';
import HealthCheck from './components/HealthCheck';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <RouteGuard>
                  <HealthCheck />
                </RouteGuard>
              }
            />
            <Route
              path="/admin"
              element={
                <RouteGuard>
                  <Admin />
                </RouteGuard>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
