import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/main.css";
import { useNavigate } from "react-router-dom";

// ===== Interfaces =====
interface User {
  username: string;
  email: string;
  user_type: 'ADMIN' | 'DESEMBARQUE' | 'CONFERENTE' | 'EMBARQUE';
  success: boolean;
}

interface Filtros {
  FromVessel_NavioOrigem: string;
  ToVessel_NavioDestino: string;
  FromDepartment_DepartamentoOrigem: string;
  ToDepartment_DepartamentoDestino: string;
  SPN: string;
  ItemDescription_DescricaoItem: string;
  PRNumberTMMaster_NumeroPRTMMaster: string;
  OraclePRNumber_NumeroPROracle: string;
  status_final: string;
}

interface Registro {
  id: number;
  FromVessel_NavioOrigem: string;
  ToVessel_NavioDestino: string;
  PRNumberTMMaster_NumeroPRTMMaster: string;
  OraclePRNumber_NumeroPROracle: string;
  ItemDescription_DescricaoItem: string;
  SPN: string;
  FromDepartment_DepartamentoOrigem?: string;
  ToDepartment_DepartamentoDestino?: string;
  OriginAllocatedPosition_PosicaoAlocadaOrigem?: string;
  transfer_status?: string;
  status_final?: string;
  QuantityToBeTransferred_QuantidadeATransferir?: string;
  UnitValue_USD_ValorUnitario_USD?: string;
  TotalAmount_USD_ValorTotal_USD?: string;
  desembarque_quantidade_conferida?: string;
  created?: string;
  data_insercao?: string;
}

const initialFiltros: Filtros = {
  FromVessel_NavioOrigem: "",
  ToVessel_NavioDestino: "",
  FromDepartment_DepartamentoOrigem: "",
  ToDepartment_DepartamentoDestino: "",
  SPN: "",
  ItemDescription_DescricaoItem: "",
  PRNumberTMMaster_NumeroPRTMMaster: "",
  OraclePRNumber_NumeroPROracle: "",
  status_final: "",
};

axios.defaults.baseURL = 'http://10.15.3.30:9280';

export default function Conferencia() {
  const [user, setUser] = useState<User | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(initialFiltros);
  const [data, setData] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('pt-br');
  const [dropdowns, setDropdowns] = useState<Record<keyof Filtros, string[]>>({
    FromVessel_NavioOrigem: [],
    ToVessel_NavioDestino: [],
    FromDepartment_DepartamentoOrigem: [],
    ToDepartment_DepartamentoDestino: [],
    SPN: [],
    ItemDescription_DescricaoItem: [],
    PRNumberTMMaster_NumeroPRTMMaster: [],
    OraclePRNumber_NumeroPROracle: [],
    status_final: [],
  });

  // Estados para campos com busca inteligente
  const [spnSearchValue, setSpnSearchValue] = useState("");
  const [descricaoSearchValue, setDescricaoSearchValue] = useState("");
  const [prTmSearchValue, setPrTmSearchValue] = useState("");
  const [filteredSpnOptions, setFilteredSpnOptions] = useState<string[]>([]);
  const [filteredDescricaoOptions, setFilteredDescricaoOptions] = useState<string[]>([]);
  const [filteredPrTmOptions, setFilteredPrTmOptions] = useState<string[]>([]);

  const navigate = useNavigate();

  // ===== Tradução
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'pt-br': {
        'conference': 'Conferência',
        'quarantine': 'Quarentena',
        'lomPending': 'LOM Pendente',
        'consult': 'Consultar',
        'filters': 'Filtros de Busca',
        'originVessel': 'NAVIO ORIGEM (A TRASNFERIR)',
        'destinationVessel': 'NAVIO DESTINO (A RECEBER)',
        'originDepartment': 'DEPARTAMENTO ORIGEM (A ENVIAR)',
        'destinationDepartment': 'DEPARTAMENTO DESTINO (A RECEBER)',

        'prTmMaster': 'PR TM MASTER (REQUISIÇÃO DE COMPRA NO TM MASTER)',
        'prOracle': 'PR ORACLE (REQUISIÇÃO DE COMPRA NO ORACLE)',
        'itemDescription': 'DESCRIÇÃO DO ITEM',
        'finalStatus': 'STATUS FINAL',
        'all': 'Todos',
        'search': 'Buscar',
        'clear': 'Limpar',
        'searching': 'Buscando...',
        'conference_action': 'CONFERIR',
        'results': 'Resultados da Busca',
        'noResults': 'Nenhum resultado encontrado.',
        'origin': 'NAVIO ORIGEM',
        'destination': 'NAVIO DESTINO',
        'depOrigin': 'DEPARTAMENTO ORIGEM',
        'depDestination': 'DEPARTAMENTO DESTINO',
        'description': 'DESCRIÇÃO',
        'finalStatusLabel': 'STATUS FINAL',
        'physicalOriginPosition': 'POSIÇÃO FÍSICA DE ORIGEM',
        'requestedQuantity': 'QUANTIDADE SOLICITADA PARA TRANSFERÊNCIA',
        'unitValue': 'VALOR UNITÁRIO (USD)',
        'disembarkedQuantity': 'QUANTIDADE DESEMBARCADA',
        'totalUsd': 'VALOR TOTAL (USD)',
        'creationDate': 'DATA DE CRIAÇÃO',
        'backToMenu': 'Voltar ao Menu'
      },
      'en': {
        'backToMenu': 'Back to Menu',
        'conference': 'Conference',
        'quarantine': 'Quarantine',
        'lomPending': 'LOM Pending',
        'consult': 'Consult',
        'filters': 'Search Filters',
        'originVessel': 'ORIGIN VESSEL (TO BE TRANSFERED)',
        'destinationVessel': 'DESTINATION VESSEL (TO BE RECEIVED)',
        'originDepartment': 'ORIGIN DEPARTMENT (TO BE SENT)',
        'destinationDepartment': 'DESTINATION DEPARTMENT (TO BE RECEIVED)',
        'prTmMaster': 'PR TM MASTER (PURCHASE REQUEST IN TM MASTER)',
        'prOracle': 'PR ORACLE (PURCHASE REQUEST IN ORACLE)',
        'itemDescription': 'ITEM DESCRIPTION',
        'finalStatus': 'FINAL STATUS',
        'all': 'All',
        'search': 'Search',
        'clear': 'Clear',
        'searching': 'Searching...',
        'conference_action': 'PROCESS',
        'results': 'Search Results',
        'noResults': 'No results found.',
        'origin': 'ORIGIN VESSEL',
        'destination': 'DESTINATION VESSEL',
        'depOrigin': 'ORIGIN DEPARTMENT',
        'depDestination': 'DESTINATION DEPARTMENT',
        'description': 'DESCRIPTION',
        'finalStatusLabel': 'FINAL STATUS',
        'physicalOriginPosition': 'PHYSICAL ORIGIN POSITION',
        'requestedQuantity': 'REQUESTED QUANTITY FOR TRANSFER',
        'disembarkedQuantity': 'DISEMBARKED QUANTITY',
        'unitValue': 'UNIT VALUE (USD)',
        'totalUsd': 'TOTAL VALUE (USD)',
        'creationDate': 'CREATION DATE'

      }
    };
    return translations[language]?.[key] || key;
  };

  // ===== Filtros inteligentes =====
  const filterOptions = (searchValue: string, options: string[]): string[] => {
    if (!searchValue.trim()) return options;
    return options.filter(option =>
      option.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  useEffect(() => {
    setFilteredSpnOptions(filterOptions(spnSearchValue, dropdowns.SPN || []));
  }, [spnSearchValue, dropdowns.SPN]);

  useEffect(() => {
    setFilteredDescricaoOptions(filterOptions(descricaoSearchValue, dropdowns.ItemDescription_DescricaoItem || []));
  }, [descricaoSearchValue, dropdowns.ItemDescription_DescricaoItem]);

  useEffect(() => {
    setFilteredPrTmOptions(filterOptions(prTmSearchValue, dropdowns.PRNumberTMMaster_NumeroPRTMMaster || []));
  }, [prTmSearchValue, dropdowns.PRNumberTMMaster_NumeroPRTMMaster]);

  // ===== Handlers para busca inteligente =====
  const handleSpnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSpnSearchValue(value);
    setFiltros(f => ({ ...f, SPN: value }));
  };

  const handleDescricaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDescricaoSearchValue(value);
    setFiltros(f => ({ ...f, ItemDescription_DescricaoItem: value }));
  };

  const handlePrTmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrTmSearchValue(value);
    setFiltros(f => ({ ...f, PRNumberTMMaster_NumeroPRTMMaster: value }));
  };

  const selectSpnOption = (option: string) => {
    setSpnSearchValue(option);
    setFiltros(f => ({ ...f, SPN: option }));
  };

  const selectDescricaoOption = (option: string) => {
    setDescricaoSearchValue(option);
    setFiltros(f => ({ ...f, ItemDescription_DescricaoItem: option }));
  };

  const selectPrTmOption = (option: string) => {
    setPrTmSearchValue(option);
    setFiltros(f => ({ ...f, PRNumberTMMaster_NumeroPRTMMaster: option }));
  };

  // ===== Usuário & inicialização =====
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        
        // Verificar grupos e corrigir user_type se necessário
        if (userData.user_type !== 'ADMIN' && userData.groups && Array.isArray(userData.groups)) {
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
        console.error('Erro ao carregar usuário:', error);
      }
    }
  }, []);

  // ===== Carregar valores dos dropdowns =====
  useEffect(() => {
    async function fetchDropdowns() {
      try {
        const res = await axios.get("/api/conferencia/dropdowns", {
          headers: {
            'x-user-name': user?.username,
            'x-user-type': user?.user_type,
          }
        });
        const d = res.data || {};
        setDropdowns({
          FromVessel_NavioOrigem: d.FromVessel_NavioOrigem || [],
          ToVessel_NavioDestino: d.ToVessel_NavioDestino || [],
          FromDepartment_DepartamentoOrigem: d.FromDepartment_DepartamentoOrigem || [],
          ToDepartment_DepartamentoDestino: d.ToDepartment_DepartamentoDestino || [],
          SPN: d.SPN || [],
          ItemDescription_DescricaoItem: d.ItemDescription_DescricaoItem || [],
          PRNumberTMMaster_NumeroPRTMMaster: d.PRNumberTMMaster_NumeroPRTMMaster || [],
          OraclePRNumber_NumeroPROracle: d.OraclePRNumber_NumeroPROracle || [],
          status_final: d.status_final || [],
        });
      } catch {
        setDropdowns(initialFiltros as any);
      }
    }
    if (user) fetchDropdowns();
  }, [user]);

  // ===== Buscar resultados =====
  const buscar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([_, v]) => v));
      const res = await axios.get("/api/conferencia", {
        params,
        headers: {
          'x-user-name': user?.username,
          'x-user-type': user?.user_type,
        }
      });
      console.log('🔍 DEBUG - Ordem recebida da API:', res.data.data?.map((r: any, i: number) => `${i+1}. ${r.id}`));
      setData(res.data.data || []);
    } catch (error) {
      console.error('Erro ao buscar conferência:', error);
      setData([]);
    }
    setLoading(false);
  };

  // ===== Limpar filtros =====
  const limparFiltros = () => {
    setFiltros(initialFiltros);
    setData([]);
    setSpnSearchValue("");
    setDescricaoSearchValue("");
    setPrTmSearchValue("");
  };

  // ===== Buscar ao carregar =====
  useEffect(() => {
    if (user) buscar();
  }, [user]);

  // ===== Change language =====
  const handleLanguageChange = (newLanguage: string) => setLanguage(newLanguage);

  // ===== Helper para dropdown simples =====
  const renderSelect = (
    name: keyof Filtros,
    label: string
  ) => (
    <div className="form-group" key={name}>
      <label className="field-label">{label}</label>
      <select
        name={name}
        className="form-input"
        value={filtros[name]}
        onChange={e => setFiltros(f => ({ ...f, [name]: e.target.value }))}
      >
        <option value="">{t('all')}</option>
        {dropdowns[name]?.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  // ===== Helper para campos com busca inteligente =====
  const renderSmartSearch = (
    fieldName: keyof Filtros,
    label: string,
    searchValue: string,
    filteredOptions: string[],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onSelect: (option: string) => void
  ) => (
    <div className="form-group" key={fieldName}>
      <label className="field-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          value={searchValue}
          onChange={onChange}
          placeholder="Digite para buscar..."
        />
        {searchValue && filteredOptions.length > 0 && (
          <div className="search-dropdown">
            {filteredOptions.slice(0, 10).map(option => (
              <div
                key={option}
                className="search-option"
                onClick={() => onSelect(option)}
              >
                {option}
              </div>
            ))}
            {filteredOptions.length > 10 && (
              <div className="search-more">
                +{filteredOptions.length - 10} mais opções...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (!user) {
    return <div className="loading-screen">🔄 Carregando...</div>;
  }
  
  // Apenas ADMIN e CONFERENTE podem acessar esta página
  const allowedTypes = ['ADMIN', 'CONFERENTE'];
  if (!allowedTypes.includes(user.user_type)) {
    return (
      <div className="loading-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <h2>🚫 Acesso Negado</h2>
        <p>Você não tem permissão para acessar a página de Conferência.</p>
        <button className="btn-primary" onClick={() => window.location.href='/menu'}>🏠 Voltar ao Menu</button>
      </div>
    );
  }

  const isAdmin = user.user_type === 'ADMIN';

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <h1>🧾 {t('conference')}</h1>
          {isAdmin && <span className="admin-badge">Administrator</span>}
        </div>
        <div className="page-actions">

          <div className="language-selector">
            <button
              type="button"
              className={`language-btn ${language === 'pt-br' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('pt-br')}
            >🇧🇷 PT</button>
            <button
              type="button"
              className={`language-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en')}
            >🇺🇸 EN</button>
          </div>
          <div style={{ display: "flex", gap: "12px", marginLeft: "12px" }}>
            <button
              className="btn-secondary"
              onClick={() => navigate("/quarentena")}
              title={t('quarantine')}
            >
              🧬 {t('quarantine')}
            </button>
            <button
              className="btn-warning"
              onClick={() => navigate("/lom")}
              title={t('lomPending')}
            >
              📌 {t('lomPending')}
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
        <form onSubmit={buscar}>
          {/* Grid organizado em 2 colunas */}
          <div className="filter-grid">
            {/* Primeira linha */}
            {renderSelect("FromVessel_NavioOrigem", `🚢 ${t('originVessel')}`)}
            {renderSelect("FromDepartment_DepartamentoOrigem", `🏢 ${t('originDepartment')}`)}

            {/* Segunda linha */}
            {renderSelect("ToVessel_NavioDestino", `🎯 ${t('destinationVessel')}`)}
            {renderSelect("ToDepartment_DepartamentoDestino", `🏢 ${t('destinationDepartment')}`)}

            {/* Terceira linha - Campos com busca inteligente */}
            {renderSmartSearch("SPN", "🔢 SPN (SPARE PART NUMBER NO TM MASTER)", spnSearchValue, filteredSpnOptions, handleSpnChange, selectSpnOption)}
            {renderSmartSearch("ItemDescription_DescricaoItem", `📦 ${t('itemDescription')}`, descricaoSearchValue, filteredDescricaoOptions, handleDescricaoChange, selectDescricaoOption)}

            {/* Quarta linha */}
            {renderSmartSearch("PRNumberTMMaster_NumeroPRTMMaster", `📋 ${t('prTmMaster')}`, prTmSearchValue, filteredPrTmOptions, handlePrTmChange, selectPrTmOption)}
            {renderSelect("OraclePRNumber_NumeroPROracle", `📋 ${t('prOracle')}`)}

            {/* Quinta linha - STATUS centralizado */}
            <div className="form-group status-field">
              <label className="field-label">📊 {t('finalStatus')}</label>
              <select
                className="form-input"
                value={filtros.status_final}
                onChange={e => setFiltros(f => ({ ...f, status_final: e.target.value }))}
              >
                <option value="">{t('all')}</option>
                {dropdowns.status_final?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="buttons-container">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? `🔄 ${t('searching')}` : `🔍 ${t('search')}`}
              {loading && <span className="loading-spinner"></span>}
            </button>
            <button type="button" className="btn-secondary" onClick={limparFiltros}>
              🗑️ {t('clear')}
            </button>
          </div>
        </form>
      </section>

      {/* Resultados */}
      <section className="results-section">
        <h2 className="section-title">
          📊 {t('results')} ({data.length})
        </h2>
        <div className="results-grid">
          {data.length === 0 ? (
            <div className="no-results">📭 {t('noResults')}</div>
          ) : (
            data.map(row => (
              <div key={row.id} className="result-item">
                <div className="result-header">
                  <div className="result-id">
                    <div className="detail-label">ID</div>
                    <div className="detail-value">#{row.id}</div>
                    <div style={{fontSize: '10px', color: '#666', marginTop: '4px'}}>Inserido: {row.data_insercao || 'NULL'}</div>
                  </div>
                  <button
                    type="button"
                    className="transfer-btn"
                    onClick={() =>
                      navigate("/Conferencia_transfer", {
                        state: {
                          ...row,
                          username: user.username,
                        },
                      })
                    }
                  >
                    📤 {t('conference_action')}
                  </button>
                </div>
                <div className="result-details">
                  <div className="detail-item">
                    <div className="detail-label">🚢 {t('origin')}</div>
                    <div className="detail-value">{row.FromVessel_NavioOrigem}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">🏢 {t('depOrigin')}</div>
                    <div className="detail-value">{row.FromDepartment_DepartamentoOrigem || "-"}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">🎯 {t('destination')}</div>
                    <div className="detail-value">{row.ToVessel_NavioDestino}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">🏢 {t('depDestination')}</div>
                    <div className="detail-value">{row.ToDepartment_DepartamentoDestino || "-"}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">📋 {t('prTmMaster')}</div>
                    <div className="detail-value">{row.PRNumberTMMaster_NumeroPRTMMaster}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">📋 {t('prOracle')}</div>
                    <div className="detail-value">{row.OraclePRNumber_NumeroPROracle}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">📦 {t('description')}</div>
                    <div className="detail-value">{row.ItemDescription_DescricaoItem}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">🔢 SPN (SPARE PART NUMBER NO TM MASTER)</div>
                    <div className="detail-value">{row.SPN}</div>
                  </div>
                  {row.status_final && (
                    <div className="detail-item">
                      <div className="detail-label">📊 {t('finalStatusLabel')}</div>
                      <div className="detail-value">{row.status_final}</div>
                    </div>
                  )}
                  {row.OriginAllocatedPosition_PosicaoAlocadaOrigem && (
                    <div className="detail-item">
                      <div className="detail-label">📍 {t('physicalOriginPosition')}</div>
                      <div className="detail-value">{row.OriginAllocatedPosition_PosicaoAlocadaOrigem}</div>
                    </div>
                  )}
                  {row.QuantityToBeTransferred_QuantidadeATransferir && (
                    <div className="detail-item">
                      <div className="detail-label">📦 {t('requestedQuantity')}</div>
                      <div className="detail-value">{row.QuantityToBeTransferred_QuantidadeATransferir}</div>
                    </div>
                  )}
                  {row.desembarque_quantidade_conferida !== null && row.desembarque_quantidade_conferida !== undefined && (
                    <div className="detail-item">
                      <div className="detail-label">📦 {t('disembarkedQuantity')}</div>
                      <div className="detail-value">{row.desembarque_quantidade_conferida}</div>
                    </div>
                  )}
                  {row.UnitValue_USD_ValorUnitario_USD && (
                    <div className="detail-item">
                      <div className="detail-label">💵 {t('unitValue')}</div>
                      <div className="detail-value">
                        {Number(row.UnitValue_USD_ValorUnitario_USD).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    </div>
                  )}
                  {row.TotalAmount_USD_ValorTotal_USD && (
                    <div className="detail-item">
                      <div className="detail-label">💲 {t('totalUsd')}</div>
                      <div className="detail-value">
                        {Number(row.TotalAmount_USD_ValorTotal_USD).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    </div>
                  )}
                  {row.created && (
                    <div className="detail-item">
                      <div className="detail-label">📅 {t('creationDate')}</div>
                      <div className="detail-value">
                        {new Date(row.created).toLocaleString(language === 'pt-br' ? 'pt-BR' : 'en-US')}
                      </div>
                    </div>
                  )}
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
          gap: 6px;
          align-items: start;
        }

        .status-field {
          grid-column: 1 / -1;
          max-width: 300px;
        }

        .search-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 4px 4px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .search-option {
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
          transition: background-color 0.2s ease;
        }

        .search-option:hover {
          background-color: #f5f5f5;
        }

        .search-option:last-child {
          border-bottom: none;
        }

        .search-more {
          padding: 8px 12px;
          font-size: 12px;
          color: #666;
          font-style: italic;
          background-color: #f9f9f9;
          border-top: 1px solid #e0e0e0;
        }

        .form-group {
          position: relative;
        }

        @media (max-width: 768px) {
          .filter-grid {
            grid-template-columns: 1fr;
          }
          
          .status-field {
            grid-column: 1;
          }
        }
      `}</style>
    </div>
  );
}