import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Menu.css';
import logo from '../image/LOGO.png';

interface User {
  username: string;
  email: string;
  user_type: 'ADMIN' | 'DESEMBARQUE' | 'CONFERENTE' | 'EMBARQUE';
  success: boolean;
}

interface MenuProps {
  user: User;
}

const MenuComponent: React.FC<MenuProps> = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  // Definir páginas disponíveis baseadas no tipo de usuário
  const getAvailablePages = () => {
    const allPages = [
      {
        path: '/desembarque',
        name: 'Desembarque',
        subtitle: 'Análise de itens para Desembarque',
        icon: '⚓',
        color: '#004795',
        roles: ['ADMIN', 'DESEMBARQUE']
      },
      {
        path: '/conferencia',
        name: 'Conferência',
        subtitle: 'Conferência de Recebimento Base',
        icon: '📦',
        color: '#004795',
        roles: ['ADMIN', 'CONFERENTE']
      },
      {
        path: '/embarque',
        name: 'Embarque',
        subtitle: 'Gestão de Embarque',
        icon: '🚢',
        color: '#004795',
        roles: ['ADMIN', 'EMBARQUE']
      },
      {
        path: '/Desembarque_consulta',
        name: 'Consulta Status Transferência',
        subtitle: 'Consulta de movimentações',
        icon: '🔎',
        color: '#004795',
        roles: ['ADMIN', 'DESEMBARQUE', 'CONFERENTE', 'EMBARQUE']
      },
      {
        path: '/purchase-requisitions',
        name: 'Consulta de Requisições de Compras em Aberto',
        subtitle: 'Purchase Requisitions',
        icon: '📄',
        color: '#004795',
        roles: ['ADMIN', 'DESEMBARQUE']
      },
      {
        path: '/dashboard',
        name: 'Analítico',
        subtitle: 'Dashboard & Relatórios',
        icon: '📈',
        color: '#004795',
        roles: ['ADMIN']
      }
    ];

    return allPages.filter(page => page.roles.includes(user.user_type));
  };

  const availablePages = getAvailablePages();

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="menu-page-container">
      {/* Header */}
      <header className="menu-header-main">
        <div className="menu-logo-section">
          <img src={logo} alt="Logo" className="menu-logo-img" />
          <div className="menu-title-section">
            <h1>TransferPlus</h1>
            <p>Sistema Integrado de Gestão Logística</p>
          </div>
        </div>
        <div className="menu-user-section">
          <div className="menu-user-info">
            <div className="menu-user-avatar">
              <span>{user.username[0]?.toUpperCase() || 'U'}</span>
            </div>
            <div className="menu-user-details">
              <div className="menu-user-name">{user.username}</div>
              <div className="menu-user-role">{user.user_type}</div>
            </div>
          </div>
          <button className="menu-logout-btn" onClick={handleLogout} title="Sair">
            � Sair
          </button>
        </div>
      </header>



      {/* Menu Cards Grid */}
      <div className="menu-cards-grid">
        {availablePages.map((page) => (
          <div
            key={page.path}
            className="menu-card"
            onClick={() => handleCardClick(page.path)}
            style={{ backgroundColor: page.color }}
          >
            <div className="menu-card-content">
              <div className="menu-card-icon">{page.icon}</div>
              <h3 className="menu-card-title">{page.name}</h3>
              <p className="menu-card-subtitle">{page.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <footer className="menu-footer-info">
        <p>© 2025 TransferPlus - Sistema de Gestão Logística</p>
        <p>Usuário: <strong>{user.username}</strong> | Nível: <strong>{user.user_type}</strong></p>
      </footer>
    </div>
  );
};

export default MenuComponent;