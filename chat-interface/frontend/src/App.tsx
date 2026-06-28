import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import NavBar from './components/NavBar';
import RouteGuard from './components/RouteGuard';
import BackdropMesh from './components/BackdropMesh';
import CursorGlow from './components/CursorGlow';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import AdminLLMProviders from './pages/AdminLLMProviders';
import AdminLLMProviderModels from './pages/AdminLLMProviderModels';
import ProjectGrid from './pages/ProjectGrid';
import ProjectChat from './pages/ProjectChat';
import ProjectsManage from './pages/ProjectsManage';
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
              path="/"
              element={
                <RouteGuard>
                  <Navigate to="/projects" replace />
                </RouteGuard>
              }
            />
            <Route
              path="/chat"
              element={
                <RouteGuard>
                  <Navigate to="/projects" replace />
                </RouteGuard>
              }
            />
            <Route
              path="/projects"
              element={
                <RouteGuard>
                  <ProjectGrid />
                </RouteGuard>
              }
            />
            <Route
              path="/projects/manage"
              element={
                <RouteGuard>
                  <ProjectsManage />
                </RouteGuard>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <RouteGuard>
                  <ProjectChat />
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
