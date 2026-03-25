import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Menu.css';
import CardIcon from '../components/CardIcons';

interface User {
  username: string;
  email: string;
  user_type: 'ADMIN' | 'DESEMBARQUE' | 'CONFERENTE' | 'EMBARQUE';
  success: boolean;
}

interface MenuProps {
  user: User;
}

axios.defaults.baseURL = 'http://10.15.3.30:9280';

const MenuComponent: React.FC<MenuProps> = ({ user }) => {
  const navigate = useNavigate();
  const [pendencies, setPendencies] = useState({ embarque: 0, conferencia: 0 });

  // Buscar dados reais de pendências da API
  useEffect(() => {
    const fetchPendencies = async () => {
      try {
        // Buscar conferências pendentes
        const confRes = await axios.get("/api/conferencia", {
          headers: {
            'x-user-name': user.username,
            'x-user-type': user.user_type,
          }
        });
        const conferenciaPendentes = confRes.data?.data?.length || 0;

        // Buscar embarques preparados
        const embRes = await axios.get("/api/embarque", {
          headers: {
            'x-user-name': user.username,
            'x-user-type': user.user_type,
          }
        });
        const embarquePreparados = embRes.data?.data?.length || 0;

        setPendencies({
          embarque: embarquePreparados,
          conferencia: conferenciaPendentes
        });
      } catch (error) {
        console.error('Erro ao buscar pendências:', error);
        setPendencies({ embarque: 0, conferencia: 0 });
      }
    };

    if (user) {
      fetchPendencies();
    }
  }, [user]);

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
        iconType: 'desembarque' as const,
        color: '#004795',
        roles: ['ADMIN', 'DESEMBARQUE'],
        badge: null
      },
      {
        path: '/conferencia',
        name: 'Conferência',
        subtitle: 'Conferência de Recebimento Base',
        iconType: 'conferencia' as const,
        color: '#004795',
        roles: ['ADMIN', 'CONFERENTE'],
        badge: pendencies.conferencia > 0 ? pendencies.conferencia : null
      },
      {
        path: '/embarque',
        name: 'Embarque',
        subtitle: 'Gestão de Embarque',
        iconType: 'embarque' as const,
        color: '#004795',
        roles: ['ADMIN', 'EMBARQUE'],
        badge: pendencies.embarque > 0 ? pendencies.embarque : null
      },
      {
        path: '/Desembarque_consulta',
        name: 'Consulta Status Transferência',
        subtitle: 'Consulta de Movimentações',
        iconType: 'consulta' as const,
        color: '#004795',
        roles: ['ADMIN', 'DESEMBARQUE', 'CONFERENTE', 'EMBARQUE'],
        badge: null
      },
      {
        path: '/purchase-requisitions',
        name: 'Consulta de Requisições de Compras em Aberto',
        subtitle: 'Requisições de Compra',
        iconType: 'requisicoes' as const,
        color: '#004795',
        roles: ['ADMIN', 'DESEMBARQUE'],
        badge: null
      },
      {
        path: '/dashboard',
        name: 'Analítico',
        subtitle: 'Dashboard & Relatórios',
        iconType: 'analitico' as const,
        color: '#004795',
        roles: ['ADMIN'],
        badge: null
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
      {/* Navbar Header - global navbar renders at app level */}

      {/* Menu Cards Grid */}
      <div className="home-container">
        <div className="card-group">
          {availablePages.map((page) => (
            <a
              key={page.path}
              className="home-card"
              onClick={(e) => {
                e.preventDefault();
                handleCardClick(page.path);
              }}
              href={page.path}
              style={{ cursor: 'pointer' }}
            >
              <div className="home-card__icon-wrapper">
                <CardIcon type={page.iconType} className="home-card__icon" />
                {page.badge && (
                  <div className="home-card__badge" title={`${page.badge} itens pendentes`}>
                    {page.badge}
                  </div>
                )}
              </div>
              <h2 className="home-card__title">{page.name}</h2>
              <p className="home-card__desc">{page.subtitle}</p>
            </a>
          ))}
        </div>
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