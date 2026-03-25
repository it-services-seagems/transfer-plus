import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationCircle, faFlag, faArrowLeft, faClipboardCheck, faFlask, faFileAlt, faBoxes, faInbox } from '@fortawesome/free-solid-svg-icons';
import '../styles/main.css';
import CardIcon from '../components/CardIcons';
import PageHeader from '../components/PageHeader';

interface User {
  username: string;
  email: string;
  user_type: 'ADMIN' | 'DESEMBARQUE' | 'CONFERENTE' | 'EMBARQUE';
  success: boolean;
}

interface ModuleStats {
  total: number;
  finalizados: number;
  pendentes: number;
}

interface Atividade {
  tipo: string;
  icon: string;
  titulo: string;
  descricao: string;
  data: string;
}

// Função para obter dados de autenticação do localStorage
const getAuthData = () => {
  try {
    const userStr = localStorage.getItem('user');
    const authDataStr = localStorage.getItem('authData');

    if (!userStr) return null;

    const user = JSON.parse(userStr);
    const authData = authDataStr ? JSON.parse(authDataStr) : null;

    return {
      username: user.username,
      user_type: user.user_type,
      token: authData?.token || localStorage.getItem('authToken')
    };
  } catch (error) {
    return null;
  }
};

// Função para fazer requisições com headers corretos
const apiRequest = async (endpoint: string) => {
  const authData = getAuthData();

  if (!authData) {
    throw new Error('Dados de autenticação não encontrados');
  }

  try {
    const response = await fetch(`http://10.15.3.30:9280${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-user-name': authData.username,
        'x-user-type': authData.user_type
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [desembarqueStats, setDesembarqueStats] = useState<ModuleStats>({ total: 0, finalizados: 0, pendentes: 0 });
  const [conferenciaStats, setConferenciaStats] = useState<ModuleStats>({ total: 0, finalizados: 0, pendentes: 0 });
  const [lomStats, setLomStats] = useState<ModuleStats>({ total: 0, finalizados: 0, pendentes: 0 });
  const [quarentenaStats, setQuarentenaStats] = useState<ModuleStats>({ total: 0, finalizados: 0, pendentes: 0 });
  const [embarqueStats, setEmbarqueStats] = useState<ModuleStats>({ total: 0, finalizados: 0, pendentes: 0 });
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('pt-br');

  const navigate = useNavigate();

  // ===== Tradução =====
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'pt-br': {
        // Títulos
        'adminDashboard': 'Dashboard Administrativo',
        'adminOnly': 'Admin Only',
        'recentActivity': 'Atividade Recente',

        // Módulos
        'disembarkation': 'Desembarque',
        'conference': 'Conferência',
        'quarantine': 'Quarentena',
        'pendingLom': 'LOM Pendente',
        'shipment': 'Embarque',
        'reports': 'Relatórios',

        // Descrições
        'manageDisembarkationTransfers': 'Gerencie transferências de desembarque',
        'itemValidationConference': 'Validação e conferência de itens',
        'itemsQuarantineProcess': 'Itens em processo de quarentena',
        'listMaterialsShipment': 'List of Materials para embarque',
        'shipmentReceiptControl': 'Controle de recebimento e embarque',
        'systemAnalyticsMetrics': 'Análises e métricas do sistema',

        // Stats
        'pendingTransfers': 'Transferências pendentes',
        'completedTransfers': 'Transferências finalizadas',
        'pendingItems': 'Itens pendentes',
        'completedItems': 'Itens finalizados',
        'itemsInQuarantine': 'Itens em quarentena',
        'releasedItems': 'Itens liberados',
        'pendingLoms': 'LOM pendentes',
        'completedLoms': 'LOM finalizados',
        'processedItems': 'Itens processados',
        'availableReports': 'Relatórios disponíveis',

        // Atividade
        'noRecentActivity': 'Nenhuma atividade recente encontrada.',

        // Tempo
        'timeAgo': 'Há',
        'minute': 'minuto',
        'minutes': 'minutos',
        'hour': 'hora',
        'hours': 'horas',
        'day': 'dia',
        'days': 'dias',

        // Estados
        'loading': 'Carregando...',
        'userNotFound': 'Usuário não encontrado'
      },
      'en': {
        // Títulos
        'adminDashboard': 'Administrative Dashboard',
        'adminOnly': 'Admin Only',
        'recentActivity': 'Recent Activity',

        // Módulos
        'disembarkation': 'Disembarkation',
        'conference': 'Conference',
        'quarantine': 'Quarantine',
        'pendingLom': 'Pending LOM',
        'shipment': 'Shipment',
        'reports': 'Reports',

        // Descrições
        'manageDisembarkationTransfers': 'Manage disembarkation transfers',
        'itemValidationConference': 'Item validation and conference',
        'itemsQuarantineProcess': 'Items in quarantine process',
        'listMaterialsShipment': 'List of Materials for shipment',
        'shipmentReceiptControl': 'Shipment receipt control',
        'systemAnalyticsMetrics': 'System analytics and metrics',

        // Stats
        'pendingTransfers': 'Pending transfers',
        'completedTransfers': 'Completed transfers',
        'pendingItems': 'Pending items',
        'completedItems': 'Completed items',
        'itemsInQuarantine': 'Items in quarantine',
        'releasedItems': 'Released items',
        'pendingLoms': 'Pending LOMs',
        'completedLoms': 'Completed LOMs',
        'processedItems': 'Processed items',
        'availableReports': 'Available reports',

        // Atividade
        'noRecentActivity': 'No recent activity found.',

        // Tempo
        'timeAgo': '',
        'minute': 'minute',
        'minutes': 'minutes',
        'hour': 'hour',
        'hours': 'hours',
        'day': 'day',
        'days': 'days',

        // Estados
        'loading': 'Loading...',
        'userNotFound': 'User not found'
      }
    };

    return translations[language]?.[key] || key;
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        fetchAllData();
      } catch (error) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchDesembarqueStats(),
      fetchConferenciaStats(),
      fetchLomStats(),
      fetchQuarentenaStats(),
      fetchEmbarqueStats(),
      fetchAtividades()
    ]);
    setLoading(false);
  };

  const fetchDesembarqueStats = async () => {
    try {
      const res = await apiRequest('/api/dashboard/desembarque_stats');

      if (res?.status === 'success' && res?.data) {
        setDesembarqueStats({
          total: res.data.total || 0,
          finalizados: res.data.finalizados || 0,
          pendentes: res.data.pendentes || 0
        });
      }
    } catch (err) {
    }
  };

  const fetchConferenciaStats = async () => {
    try {
      const res = await apiRequest('/api/dashboard/conferencia_stats');

      if (res?.status === 'success' && res?.data) {
        setConferenciaStats({
          total: res.data.total || 0,
          finalizados: res.data.finalizados || 0,
          pendentes: res.data.pendentes || 0
        });
      }
    } catch (err) {
    }
  };

  const fetchLomStats = async () => {
    try {
      const res = await apiRequest('/api/dashboard/lom_stats');

      if (res?.status === 'success' && res?.data) {
        setLomStats({
          total: res.data.total || 0,
          finalizados: res.data.finalizados || 0,
          pendentes: res.data.pendentes || 0
        });
      }
    } catch (err) {
    }
  };

  const fetchQuarentenaStats = async () => {
    try {
      const res = await apiRequest('/api/dashboard/quarentena_stats');

      if (res?.status === 'success' && res?.data) {
        setQuarentenaStats({
          total: res.data.total || 0,
          finalizados: res.data.finalizados || 0,
          pendentes: res.data.pendentes || 0
        });
      }
    } catch (err) {
    }
  };

  const fetchEmbarqueStats = async () => {
    try {
      const res = await apiRequest('/api/dashboard/embarque_stats');

      if (res?.status === 'success' && res?.data) {
        setEmbarqueStats({
          total: res.data.total || 0,
          finalizados: res.data.finalizados || 0,
          pendentes: res.data.pendentes || 0
        });
      }
    } catch (err) {
    }
  };

  const fetchAtividades = async () => {
    try {
      const res = await apiRequest('/api/dashboard/atividades_recentes');

      if (res?.status === 'success' && res?.data) {
        // Verificar se o backend está retornando o nome correto do usuário
        const atividadesComLog = res.data.map((atividade: Atividade) => {
          return atividade;
        });
        setAtividades(atividadesComLog);
      }
    } catch (err) {
    }
  };

  const formatarTempo = (dataString: string) => {
    const agora = new Date();
    const dataAtividade = new Date(dataString);
    const diffMs = agora.getTime() - dataAtividade.getTime();
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutos < 60) {
      const minuteLabel = diffMinutos === 1 ? t('minute') : t('minutes');
      return language === 'pt-br' ? `${t('timeAgo')} ${diffMinutos} ${minuteLabel}` : `${diffMinutos} ${minuteLabel} ago`;
    } else if (diffHoras < 24) {
      const hourLabel = diffHoras === 1 ? t('hour') : t('hours');
      return language === 'pt-br' ? `${t('timeAgo')} ${diffHoras} ${hourLabel}` : `${diffHoras} ${hourLabel} ago`;
    } else {
      const dayLabel = diffDias === 1 ? t('day') : t('days');
      return language === 'pt-br' ? `${t('timeAgo')} ${diffDias} ${dayLabel}` : `${diffDias} ${dayLabel} ago`;
    }
  };

  // ===== Change language =====
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: 8 }} /> {t('loading')}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="loading-screen">
        <FontAwesomeIcon icon={faExclamationCircle} style={{ marginRight: 8, color: '#cc0a0a' }} /> {t('userNotFound')}
      </div>
    );
  }

  const isAdmin = user.user_type === 'ADMIN';

  return (
    <div className="page-container">
      <PageHeader
        title={t('adminDashboard')}
        icon={<FontAwesomeIcon icon={faFileAlt} />}
        adminBadge={isAdmin ? 'Administrator' : undefined}
        language={language}
        onLanguageChange={handleLanguageChange}
        buttons={[
          { label: 'Voltar ao Menu', onClick: () => navigate('/menu'), className: 'btn-primary', title: 'Voltar ao Menu Principal', icon: <FontAwesomeIcon icon={faArrowLeft} /> }
        ]}
      />

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-icon"><FontAwesomeIcon icon={faInbox} /></div>
          <div className="card-content">
            <h3> {t('disembarkation')}</h3>
            <p>{t('manageDisembarkationTransfers')}</p>
            <div className="card-stats">
              <span className="stat-number">{desembarqueStats.pendentes}</span>
              <span className="stat-label">{t('pendingTransfers')}</span>
            </div>
            <div className="card-stats">
              <span className="stat-number">{desembarqueStats.finalizados}</span>
              <span className="stat-label">{t('completedTransfers')}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon"><FontAwesomeIcon icon={faClipboardCheck} /></div>
          <div className="card-content">
            <h3>{t('conference')}</h3>
            <p>{t('itemValidationConference')}</p>
            <div className="card-stats">
              <span className="stat-number">{conferenciaStats.pendentes}</span>
              <span className="stat-label">{t('pendingItems')}</span>
            </div>
            <div className="card-stats">
              <span className="stat-number">{conferenciaStats.finalizados}</span>
              <span className="stat-label">{t('completedItems')}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon"><FontAwesomeIcon icon={faFlask} /></div>
          <div className="card-content">
            <h3>{t('quarantine')}</h3>
            <p>{t('itemsQuarantineProcess')}</p>
            <div className="card-stats">
              <span className="stat-number">{quarentenaStats.pendentes}</span>
              <span className="stat-label">{t('itemsInQuarantine')}</span>
            </div>
            <div className="card-stats">
              <span className="stat-number">{quarentenaStats.finalizados}</span>
              <span className="stat-label">{t('releasedItems')}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon"><FontAwesomeIcon icon={faFileAlt} /></div>
          <div className="card-content">
            <h3>{t('pendingLom')}</h3>
            <p>{t('listMaterialsShipment')}</p>
            <div className="card-stats">
              <span className="stat-number">{lomStats.pendentes}</span>
              <span className="stat-label">{t('pendingLoms')}</span>
            </div>
            <div className="card-stats">
              <span className="stat-number">{lomStats.finalizados}</span>
              <span className="stat-label">{t('completedLoms')}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon"><FontAwesomeIcon icon={faBoxes} /></div>
          <div className="card-content">
            <h3>{t('shipment')}</h3>
            <p>{t('shipmentReceiptControl')}</p>
            <div className="card-stats">
              <span className="stat-number">{embarqueStats.pendentes}</span>
              <span className="stat-label">{t('pendingItems')}</span>
            </div>
            <div className="card-stats">
              <span className="stat-number">{embarqueStats.finalizados}</span>
              <span className="stat-label">{t('processedItems')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h2>{t('recentActivity')}</h2>
        <div className="activity-list">
          {atividades.length > 0 ? (
            atividades.map((atividade, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {atividade.tipo ? (
                    // try to render CardIcon for known types
                    <CardIcon type={atividade.tipo as any} className="activity-icon" />
                  ) : (
                    <FontAwesomeIcon icon={faInbox} />
                  )}
                </div>
                <div className="activity-content">
                  <p>{atividade.titulo} {atividade.descricao}</p>
                  <span className="activity-time">{formatarTempo(atividade.data)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results"><FontAwesomeIcon icon={faInbox} style={{ marginRight: 8 }} /> {t('noRecentActivity')}</div>
          )}
        </div>
      </div>
      <style>{`
        /* Make card icons small and inline (left of the title) */
        .dashboard-card .card-content h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
        }

        .dashboard-card .card-content .card-icon {
          font-size: 18px;
          line-height: 1;
        }

        .section-icon {
          font-size: 20px;
          vertical-align: middle;
          margin-right: 6px;
        }

        /* Force FontAwesome SVG icons on this page to use blue color
           FontAwesome svgs inherit currentColor, so setting color on containers works. */
        .page-container .card-icon,
        .page-container .section-icon,
        .page-container .activity-icon,
        .page-container .no-results,
        .page-container .language-selector,
        .page-container .btn-secondary {
          color: #033682 !important;
        }

        /* Ensure SVG fill uses currentColor */
        .page-container svg {
          fill: currentColor !important;
          color: inherit !important;
        }

        @media (max-width: 768px) {
          .page-header {
            position: static !important;
            transform: none !important;
            left: auto !important;
            width: auto !important;
            margin-bottom: 16px;
          }
        }
      `}</style>
    </div>
  );
}