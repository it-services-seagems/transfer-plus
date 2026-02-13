import React, { useEffect, useState, useCallback } from "react";
import "../styles/main.css";
import { useNavigate } from "react-router-dom";

// ===== Interfaces =====
interface User {
  username: string;
  email: string;
  user_type: 'ADMIN' | 'DESEMBARQUE' | 'CONFERENTE' | 'EMBARQUE';
  success: boolean;
}

interface QuarentenaItem {
  id: number;
  FromVessel_NavioOrigem: string;
  ToVessel_NavioDestino: string;
  FromDepartment_DepartamentoOrigem?: string;
  ToDepartment_DepartamentoDestino?: string;
  PRNumberTMMaster_NumeroPRTMMaster: string;
  OraclePRNumber_NumeroPROracle: string;
  SPN: string;
  ItemDescription_DescricaoItem: string;
  OriginAllocatedPosition_PosicaoAlocadaOrigem?: string;
  QuantityToBeTransferred_QuantidadeATransferir?: string;
  conf_QuantidadeConferida?: number;
  conferencia_quantidade_conferida?: number;
  desembarque_quantidade_conferida?: number;
  status_final?: string;
  observacao?: string;
  conferencia_responsavel?: string;
  data_inicio_quarentena?: string;
  data_fim_quarentena?: string;
  TotalAmount_USD_ValorTotal_USD?: string;
  lom?: string;
}

// ====== Constantes iniciais ======
const initialFiltros = {
  FromVessel_NavioOrigem: "",
  ToVessel_NavioDestino: "",
  PRNumberTMMaster_NumeroPRTMMaster: "",
  OraclePRNumber_NumeroPROracle: "",
  ItemDescription_DescricaoItem: "",
  SPN: "",
};

const Quarentena: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [filtros, setFiltros] = useState<typeof initialFiltros>(initialFiltros);
  const [resultados, setResultados] = useState<QuarentenaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('pt-br');
  const navigate = useNavigate();

  // ===== Tradução =====
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'pt-br': {
        quarantine: 'QUARENTENA',
        filters: 'Filtros de Busca',
        results: 'Resultados',
        origin: 'ORIGEM',
        destination: 'DESTINO',
        prTmMaster: 'PR TM MASTER (REQUISIÇÃO DE COMPRA NO TM MASTER)',
        prOracle: 'PR ORACLE (REQUISIÇÃO DE COMPRA NO ORACLE)',
        itemDescription: 'DESCRIÇÃO DO ITEM',
        search: 'Buscar',
        clear: 'Limpar',
        searching: 'Buscando...',
        treatment: 'TRATAMENTO',
        noItems: 'Nenhum item encontrado.',
        originVessel: 'NAVIO ORIGEM',
        destinationVessel: 'NAVIO DESTINO',
        item: 'ITEM',
        landedQuantity: 'QUANTIDADE DESEMBARCADA',
        conferredQuantity: 'QUANTIDADE CONFERIDA',
        startDate: 'INÍCIO',
        status: 'STATUS',
        responsible: 'RESPONSÁVEL',
        'backToMenu': 'Voltar ao Menu'
      },
      'en': {
        'backToMenu': 'Back to Menu',
        quarantine: 'QUARANTINE',
        filters: 'Search Filters',
        results: 'Results',
        origin: 'ORIGIN',
        destination: 'DESTINATION',
        prTmMaster: 'PR TM MASTER (PURCHASE REQUEST IN TM MASTER)',
        prOracle: 'PR ORACLE (PURCHASE REQUEST IN ORACLE)',
        itemDescription: 'ITEM DESCRIPTION',
        search: 'Search',
        clear: 'Clear',
        searching: 'Searching...',
        treatment: 'TREATMENT',
        noItems: 'No items found.',
        originVessel: 'ORIGIN VESSEL',
        destinationVessel: 'DESTINATION VESSEL',
        item: 'ITEM',
        landedQuantity: 'LANDED QUANTITY',
        conferredQuantity: 'CONFERRED QUANTITY',
        startDate: 'START',
        status: 'STATUS',
        responsible: 'RESPONSIBLE',
        spn: 'SPN'
      }
    };
    return translations[language]?.[key] || key;
  };

  // ===== Usuário & inicialização =====
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    }
  }, []);

  // ===== Buscar dados usando fetch (interceptor automático) =====
  const buscar = useCallback(async () => {
    if (!user?.username || !user?.user_type) {
      console.error("Usuário não definido ao buscar quarentena!");
      return;
    }
    setLoading(true);

    try {
      // Construir URL com parâmetros de filtro
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          params.append(key, value.trim());
        }
      });

      const url = `http://10.15.3.30:9280/api/quarentena${params.toString() ? '?' + params.toString() : ''}`;


      // Usar fetch - o interceptor do App.tsx adicionará os headers automaticamente
      const response = await fetch(url, {
        method: 'GET'
      });

      const data = await response.json();

      if (data.status === 'success') {
        setResultados(data.data || []);
      } else {
        console.error('❌ Erro na resposta:', data.message);
        setResultados([]);
      }
    } catch (err) {
      console.error("❌ Erro ao buscar quarentena:", err);
      setResultados([]);
    }
    setLoading(false);
  }, [user, filtros]);

  // ===== Formatar datetime para exibição =====
  const formatDateTime = (dateTimeStr: string | undefined) => {
    if (!dateTimeStr) return "-";
    try {
      // Formato do banco: "YYYY-MM-DD HH:MM:SS" ou "YYYY-MM-DDTHH:MM:SS"
      const date = new Date(dateTimeStr.replace(' ', 'T'));
      if (isNaN(date.getTime())) return dateTimeStr; // Se inválido, mostra raw

      // Formato brasileiro: DD/MM/YYYY HH:MM
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return dateTimeStr; // Em caso de erro, mostra raw
    }
  };

  useEffect(() => {
    if (user) {
      buscar();
    }
  }, [user, buscar]);

  // ===== Limpar filtros =====
  const limpar = () => {
    setFiltros(initialFiltros);
    setResultados([]);
  };

  // ===== Change language =====
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  if (!user) {
    return <div className="loading-screen">🔄 Carregando...</div>;
  }

  const isAdmin = user.user_type === 'ADMIN';

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <h1>🧪 {t('quarantine')}</h1>
          {isAdmin && <span className="admin-badge">Administrator</span>}
        </div>
        <div className="page-actions">
          <div className="language-selector">
            <button
              type="button"
              className={`language-btn ${language === 'pt-br' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('pt-br')}
            >
              🇧🇷 PT
            </button>
            <button
              type="button"
              className={`language-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en')}
            >
              🇺🇸 EN
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate('/menu')}
              title={t('backToMenu')}
            >

              🏠 {t('backToMenu')}
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <section className="filter-section">
        <h2 className="section-title">🔍 {t('filters')}</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            buscar();
          }}
        >
          <div className="filter-grid">
            <div className="form-group">
              <label className="field-label">🚢 {t('origin')}</label>
              <input
                type="text"
                className="form-input"
                value={filtros.FromVessel_NavioOrigem}
                onChange={e =>
                  setFiltros(f => ({
                    ...f,
                    FromVessel_NavioOrigem: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label className="field-label">🎯 {t('destination')}</label>
              <input
                type="text"
                className="form-input"
                value={filtros.ToVessel_NavioDestino}
                onChange={e =>
                  setFiltros(f => ({
                    ...f,
                    ToVessel_NavioDestino: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label className="field-label">📋 {t('prTmMaster')}</label>
              <input
                type="text"
                className="form-input"
                value={filtros.PRNumberTMMaster_NumeroPRTMMaster}
                onChange={e =>
                  setFiltros(f => ({
                    ...f,
                    PRNumberTMMaster_NumeroPRTMMaster: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label className="field-label">📋 {t('prOracle')}</label>
              <input
                type="text"
                className="form-input"
                value={filtros.OraclePRNumber_NumeroPROracle}
                onChange={e =>
                  setFiltros(f => ({
                    ...f,
                    OraclePRNumber_NumeroPROracle: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label className="field-label">📦 {t('itemDescription')}</label>
              <input
                type="text"
                className="form-input"
                value={filtros.ItemDescription_DescricaoItem}
                onChange={e =>
                  setFiltros(f => ({
                    ...f,
                    ItemDescription_DescricaoItem: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label className="field-label">🔢 {t('spn')}</label>
              <input
                type="text"
                className="form-input"
                value={filtros.SPN}
                onChange={e =>
                  setFiltros(f => ({
                    ...f,
                    SPN: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="buttons-container">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? `🔄 ${t('searching')}` : `🔍 ${t('search')}`}
            </button>
            <button type="button" className="btn-secondary" onClick={limpar}>
              🧹 {t('clear')}
            </button>
          </div>
        </form>
      </section>

      {/* Resultados */}
      <section className="results-section">
        <h2 className="section-title">📊 {t('results')} ({resultados.length})</h2>
        <div className="results-grid">
          {resultados.length === 0 ? (
            <div className="no-results">📭 {t('noItems')}</div>
          ) : (
            resultados.map(row => (
              <div key={row.id} className="result-item">
                <div className="result-header">
                  <div className="result-id">
                    <div className="detail-label">ID</div>
                    <div className="detail-value">#{row.id}</div>
                  </div>
                  <button
                    type="button"
                    className="transfer-btn"
                    onClick={() =>
                      navigate("/quarentena_transfer", {
                        state: row,
                      })
                    }
                  >
                    🛠️ {t('treatment')}
                  </button>
                </div>
                <div className="result-details">
                  <div className="detail-item">
                    <div className="detail-label">🚢 {t('originVessel')}</div>
                    <div className="detail-value">{row.FromVessel_NavioOrigem}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">🎯 {t('destinationVessel')}</div>
                    <div className="detail-value">{row.ToVessel_NavioDestino}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">🔢 {t('spn')}</div>
                    <div className="detail-value">{row.SPN}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">📦 {t('item')}</div>
                    <div className="detail-value">{row.ItemDescription_DescricaoItem}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">📊 {t('landedQuantity')}</div>
                    <div className="detail-value">{row.desembarque_quantidade_conferida ?? "-"}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">📊 {t('conferredQuantity')}</div>
                    <div className="detail-value">{row.conferencia_quantidade_conferida ?? "-"}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">🕒 {t('startDate')}</div>
                    <div className="detail-value">{formatDateTime(row.data_inicio_quarentena).split(' ')[0]}</div>
                  </div>
                  {row.lom && (
                    <div className="detail-item">
                      <div className="detail-label">📌 LOM</div>
                      <div className="detail-value">{row.lom}</div>
                    </div>
                  )}
                  <div className="detail-item">
                    <div className="detail-label">📍 {t('status')}</div>
                    <div className="detail-value">{row.status_final ?? "-"}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">👤 {t('responsible')}</div>
                    <div className="detail-value">{row.conferencia_responsavel ?? "-"}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      <style>{`
        .filter-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .filter-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Quarentena;