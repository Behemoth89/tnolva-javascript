import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import NavBar from './components/NavBar';
import RouteGuard from './components/RouteGuard';
import HealthCheck from './components/HealthCheck';
import BackdropMesh from './components/BackdropMesh';
import CursorGlow from './components/CursorGlow';
import ChatPanel from './components/ChatPanel';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import AdminLLMProviders from './pages/AdminLLMProviders';
import AdminLLMProviderModels from './pages/AdminLLMProviderModels';
import Projects from './pages/Projects';
import AdminProjectTemplates from './pages/AdminProjectTemplates';

function App() {
  return (
    <AuthProvider>
      <BackdropMesh />
      <CursorGlow />
      <BrowserRouter>
        <NavBar />
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/chat"
              element={
                <RouteGuard>
                  <ChatPanel />
                </RouteGuard>
              }
            />
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
            <Route
              path="/admin/llm-providers"
              element={
                <RouteGuard>
                  <AdminLLMProviders />
                </RouteGuard>
              }
            />
            <Route
              path="/admin/llm-provider-models"
              element={
                <RouteGuard>
                  <AdminLLMProviderModels />
                </RouteGuard>
              }
            />
            <Route
              path="/projects"
              element={
                <RouteGuard>
                  <Projects />
                </RouteGuard>
              }
            />
            <Route
              path="/admin/project-templates"
              element={
                <RouteGuard>
                  <AdminProjectTemplates />
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
