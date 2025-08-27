import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Páginas
import Login from "./pages/login";
import RegistrationScreen from "./pages/registration";
import Home from "./pages/home";
import { type ReactNode } from "react";
import MainLayout from "./layout/main-layout";
import NotFound from "./pages/not-found";
import Perfil from "./pages/perfil";
import TesteJuan from "./pages/teste-juan";
import TeamExamplePage from "./components/comunidade/team-example";
import LandingPage from "./pages/landing-page";
import ChatPage from './pages/chat';

// Componente para proteger rotas privadas
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Carregando...</div>;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// 🔥 Novo comunidade para rotas públicas
function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Carregando...</div>;
  if (user) return <Navigate to="/home" replace />; // se já logado -> vai pro menu
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Rotas Públicas */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegistrationScreen />
                </PublicRoute>
              }
            />

            <Route path="/teste-juan" element={<TesteJuan />} />
            <Route path="/team" element={<TeamExamplePage />} />
            <Route path="/" element={<LandingPage />} />
              <Route path="chat" element={<ChatPage />} />



            {/* Rotas Protegidas com Layout */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Home />} />
              <Route path="dashboard" element={<h1>Dashboard</h1>} />
              <Route path="perfil" element={<Perfil />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
