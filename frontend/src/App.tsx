import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertProvider } from './components/AlertProvider';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Desembarque from './pages/Desembarque';
import DesembarqueConsulta from './pages/Desembarque_consulta';

import Conferencia from './pages/Conferencia';
import ConferenciaTransfer from './pages/Conferencia_transfer';

import Quarentena from './pages/Quarentena';
import QuarentenaTransfer from './pages/Quarentena_transfer';

import Lom from './pages/lom';
import LomTransfer from './pages/lom_transfer';

import Embarque from './pages/Embarque';
import DesembarqueTransfer from './pages/Desembarque_transfer';
import EmbarqueTransfer from './pages/Embarque_transfer';

import PurchaseRequisitions from './pages/PurchaseRequisitions';

import MenuComponent from './pages/MenuComponent';
import './styles/main.css';
import Navbar from './components/Navbar';

interface User {
  username: string;
  email: string;
  user_type: 'ADMIN' | 'DESEMBARQUE' | 'CONFERENTE' | 'EMBARQUE';
  success: boolean;
  groups?: string[];
  access_level?: string;
  allowed_paths?: string[] | string;
  ou?: string;
}

// ===== INTERCEPTOR FETCH GLOBAL =====
const setupFetchInterceptor = () => {
  const originalFetch = window.fetch;

  // Salvar referência para uso em uploads
  (window as any).originalFetch = originalFetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();

    // Se é uma requisição para API, adicionar headers de autenticação
    if (url.includes('/api/') && !url.includes('/api/login')) {
      const userStr = localStorage.getItem('user');

      if (userStr) {
        try {
          const user = JSON.parse(userStr);

          // ✅ SE É FORMDATA, NÃO INTERCEPTAR (para uploads)
          if (init?.body instanceof FormData) {
            const newInit: RequestInit = {
              ...init,
              headers: {
                ...init?.headers,
                'x-user-name': user.username,
                'x-user-type': user.user_type
                // NÃO adicionar Content-Type para FormData
              }
            };
            return originalFetch(input, newInit);
          }

          // Para outras requisições, adicionar headers normalmente
          const newInit: RequestInit = {
            ...init,
            headers: {
              ...init?.headers,
              'x-user-name': user.username,
              'x-user-type': user.user_type,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          };


          return originalFetch(input, newInit);
        } catch (error) {
          console.error('Erro ao adicionar headers de autenticação:', error);
        }
      }
    }

    // Para outras requisições, usar fetch original
    return originalFetch(input, init);
  };
};

// Função para verificar se está autenticado
const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) return false;

  try {
    const user = JSON.parse(userStr);
    return user && user.success === true && user.user_type && user.user_type !== 'NO_ACCESS';
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return false;
  }
};

// Verifica se o usuário tem permissão para acessar uma rota específica
const hasPermission = (requiredUserTypes: string[], currentPath?: string) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return false;

  try {
    const user = JSON.parse(userStr);
    if (!user || !user.success || !user.user_type) return false;

    // Admin tem acesso a tudo
    if (user.user_type === 'ADMIN') return true;

    // Verifica se o user_type está na lista de tipos permitidos
    if (!requiredUserTypes.includes(user.user_type)) return false;

    // Se há um path específico, verifica se está nos allowed_paths
    if (currentPath && user.allowed_paths && user.allowed_paths !== 'ALL') {
      const allowedPaths = Array.isArray(user.allowed_paths) ? user.allowed_paths : [];
      const pathAllowed = allowedPaths.some((allowedPath: string) =>
        currentPath.includes(allowedPath) || allowedPath.includes(currentPath.replace('/', ''))
      );
      return pathAllowed;
    }

    return true;
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    return false;
  }
};

// Componente para proteger rotas privadas
interface PrivateRouteProps {
  children: React.ReactNode;
  requiredUserTypes?: string[];
  currentPath?: string;
}

function PrivateRoute({ children, requiredUserTypes = [], currentPath }: PrivateRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredUserTypes.length > 0 && !hasPermission(requiredUserTypes, currentPath)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Layout principal com menu
interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    }
  }, []);

  // Se não tem usuário, não renderiza o menu
  if (!user) {
    return <div className="loading-screen">🔄 Carregando...</div>;
  }

  return (
    <div className="app-layout">
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

// Global Navbar rendered once for authenticated users
function GlobalNavbar() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    if (!user || !user.success) return null;

    return (
      <Navbar
        user={user}
        onLogout={() => {
          try {
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
          } catch {}
          navigate('/login');
        }}
      />
    );
  } catch (e) {
    return null;
  }
}

// Componente wrapper para MenuComponent
function MenuPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        
        // Verificar grupos e corrigir user_type se necessário
        if (userData.groups && Array.isArray(userData.groups)) {
          if (userData.groups.includes('SHQ-TRANSFERPLUS_CONFERENTE')) {
            userData.user_type = 'CONFERENTE';
          } else if (userData.groups.includes('SHQ-TRANSFERPLUS_DESEMBARQUE')) {
            userData.user_type = 'DESEMBARQUE';
          } else if (userData.groups.includes('SHQ-TRANSFERPLUS_EMBARQUE')) {
            userData.user_type = 'EMBARQUE';
          }
          // Atualizar localStorage com o tipo correto
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        setUser(userData);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    }
  }, []);

  if (!user) {
    return <div className="loading-screen">🔄 Carregando...</div>;
  }

  return <MenuComponent user={user} />;
}

// Função auxiliar para obter usuário do localStorage
function getUserFromStorage(): User | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    return null;
  }
}

function getDefaultRedirect(userType: string) {
  // Todos os usuários vão para o menu - o menu controla as permissões
  return '/menu';
}

// Componente para redirecionamento inteligente
function SmartRedirect() {
  const userStr = localStorage.getItem('user');


  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    // Sempre redirecionar para menu - página padrão
    return <Navigate to="/menu" replace />;
  } catch (error) {
    return <Navigate to="/login" replace />;
  }
}

function App() {
  // Configurar interceptor quando a aplicação inicializa
  useEffect(() => {
    setupFetchInterceptor();
  }, []);

  return (
    <AlertProvider>
      <Router>
        <GlobalNavbar />
        <Routes>
          {/* Rota pública - Login */}
          <Route path="/login" element={<Login />} />

          {/* Rota padrão - Menu como página inicial */}
          <Route path="/" element={<SmartRedirect />} />

          {/* Rota do Menu - página completa sem layout */}
          <Route
            path="/menu"
            element={
              <PrivateRoute>
                <MenuPage />
              </PrivateRoute>
            }
          />

          {/* Rotas protegidas com layout */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute requiredUserTypes={['ADMIN']}>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/desembarque"
            element={
              <PrivateRoute requiredUserTypes={['ADMIN', 'DESEMBARQUE']}>
                <MainLayout>
                  <Desembarque />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/desembarque_consulta"
            element={
              <PrivateRoute requiredUserTypes={['ADMIN', 'DESEMBARQUE', 'CONFERENTE', 'EMBARQUE']}>
                <MainLayout>
                  <DesembarqueConsulta />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/Desembarque_consulta"
            element={
              <PrivateRoute requiredUserTypes={['ADMIN', 'DESEMBARQUE', 'CONFERENTE', 'EMBARQUE']}>
                <MainLayout>
                  <DesembarqueConsulta />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/conferencia"
            element={
              <PrivateRoute requiredUserTypes={['ADMIN', 'CONFERENTE']}>
                <MainLayout>
                  <Conferencia />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/Conferencia_transfer"
            element={
              <PrivateRoute requiredUserTypes={['ADMIN', 'CONFERENTE']}>
                <MainLayout>
                  <ConferenciaTransfer />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/quarentena"
            element={
              <PrivateRoute requiredUserTypes={['ADMIN', 'CONFERENTE']}>
                <MainLayout>
                  <Quarentena />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/quarentena_transfer"
            element={
              <PrivateRoute requiredUserTypes={['ADMIN', 'CONFERENTE']}>
                <MainLayout>
                  <QuarentenaTransfer />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/lom"
            element={
              <PrivateRoute requiredUserTypes={['ADMIN', 'CONFERENTE']}>
                <MainLayout>
                  <Lom />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/lom_transfer"
            element={
              <PrivateRoute requiredUserTypes={['ADMIN', 'CONFERENTE']}>
                <MainLayout>
                  <LomTransfer />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/Desembarque_transfer"
            element={
              <PrivateRoute requiredUserTypes={['ADMIN', 'DESEMBARQUE']}>
                <MainLayout>
                  <DesembarqueTransfer />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/embarque"
            element={
              <PrivateRoute requiredUserTypes={['ADMIN', 'EMBARQUE']}>
                <MainLayout>
                  <Embarque />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/embarque_transfer"
            element={
              <PrivateRoute requiredUserTypes={['ADMIN', 'EMBARQUE']}>
                <MainLayout>
                  <EmbarqueTransfer />
                </MainLayout>
              </PrivateRoute>
            }
          />

          {/* ===== ROTA DE PURCHASE REQUISITIONS ===== */}
          <Route
            path="/purchase-requisitions"
            element={
              <PrivateRoute requiredUserTypes={['ADMIN', 'DESEMBARQUE', 'CONFERENTE', 'EMBARQUE']}>
                <MainLayout>
                  <PurchaseRequisitions />
                </MainLayout>
              </PrivateRoute>
            }
          />

          {/* Fallback - qualquer rota não encontrada vai para menu */}
          <Route path="*" element={<SmartRedirect />} />
        </Routes>
      </Router>
    </AlertProvider>
  );
}

export default App;