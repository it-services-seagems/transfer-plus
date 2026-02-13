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
  ItemDescription_Descricao: string;
  OriginAllocatedPosition: string;
  PRNumberTMMaster_Nome: string;
  status_movimentacao: string;
}

interface Registro {
  id: number;
  FromVessel_NavioOrigem: string;
  ToVessel_NavioDestino: string;
  FromDepartment_DepartamentoOrigem: string;
  ToDepartment_DepartamentoDestino: string;
  SPN: string;
  ItemDescription_DescricaoItem: string;
  OriginAllocatedPosition_PosicaoAlocadaOrigem: string;
  PRNumberTMMaster_NumeroPRTMMaster: string;
  RD2_NUMERO_LINHA_PR: number;
  QuantityToBeTransferred_QuantidadeATransferir: string;
  conferencia_quantidade_conferida: string;
  conferencia_responsavel: string;
  embarque_quantidade_conferida: string;
  embarque_responsavel: string;
  Desembarque_quantidade_conferida: string;
  Desembarque_responsavel: string;
  UnitValue_USD_ValorUnitario_USD: number;
  TotalAmount_USD_ValorTotal_USD: string;
  arquivo_referencia: string;
  LOM: string;
  status_movimentacao: string;
  observacao_movimentacao: string;
  // Campos R2D
  RD2_UNIDADE_OPERACIONAL_PR: string;
  RD2_REQUISITANTE_PR: string;
  RD2_STATUS_PR: string;
  RD2_VALOR_UNITARIO_PO: number;
  RD2_TOTAL_LINHA_PO: number;
  PR_MT_MASTER_MIGRACAO_ORACLE: string;
  RD2_PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER: string;
  OraclePRNumber_NumeroPROracle: string;
}

type FiltrosDropdown = {
  [key: string]: string[];
};

// ====== Constantes iniciais ======
const initialFiltros: Filtros = {
  FromVessel_NavioOrigem: "",
  ToVessel_NavioDestino: "",
  FromDepartment_DepartamentoOrigem: "",
  ToDepartment_DepartamentoDestino: "",
  SPN: "",
  ItemDescription_Descricao: "",
  OriginAllocatedPosition: "",
  PRNumberTMMaster_Nome: "",
  status_movimentacao: "",
};

axios.defaults.baseURL = 'http://10.15.3.30:9280';

const DesembarqueConsulta: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(initialFiltros);
  const [data, setData] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterError, setFilterError] = useState('');
  const [language, setLanguage] = useState('pt-br');
  const [filtrosDropdown, setFiltrosDropdown] = useState<FiltrosDropdown>({});
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Estados para campos com busca inteligente
  const [spnSearchValue, setSpnSearchValue] = useState("");
  const [descricaoSearchValue, setDescricaoSearchValue] = useState("");
  const [prTmSearchValue, setPrTmSearchValue] = useState("");

  const [filteredSpnOptions, setFilteredSpnOptions] = useState<string[]>([]);
  const [filteredDescricaoOptions, setFilteredDescricaoOptions] = useState<string[]>([]);
  const [filteredPrTmOptions, setFilteredPrTmOptions] = useState<string[]>([]);

  // Estados para controlar visibilidade dos dropdowns
  const [showSpnDropdown, setShowSpnDropdown] = useState(false);
  const [showDescricaoDropdown, setShowDescricaoDropdown] = useState(false);
  const [showPrTmDropdown, setShowPrTmDropdown] = useState(false);

  // Refs para inputs e dropdowns de busca inteligente
  const spnInputRef = React.useRef<HTMLInputElement>(null);
  const spnDropdownRef = React.useRef<HTMLDivElement>(null);
  const descricaoInputRef = React.useRef<HTMLInputElement>(null);
  const descricaoDropdownRef = React.useRef<HTMLDivElement>(null);
  const prTmInputRef = React.useRef<HTMLInputElement>(null);
  const prTmDropdownRef = React.useRef<HTMLDivElement>(null);

  // Fecha dropdowns ao clicar fora do input e do dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // SPN
      if (
        showSpnDropdown &&
        spnInputRef.current &&
        spnDropdownRef.current &&
        !spnInputRef.current.contains(target) &&
        !spnDropdownRef.current.contains(target)
      ) {
        setShowSpnDropdown(false);
      }
      // DESCRIÇÃO
      if (
        showDescricaoDropdown &&
        descricaoInputRef.current &&
        descricaoDropdownRef.current &&
        !descricaoInputRef.current.contains(target) &&
        !descricaoDropdownRef.current.contains(target)
      ) {
        setShowDescricaoDropdown(false);
      }
      // PR TM MASTER
      if (
        showPrTmDropdown &&
        prTmInputRef.current &&
        prTmDropdownRef.current &&
        !prTmInputRef.current.contains(target) &&
        !prTmDropdownRef.current.contains(target)
      ) {
        setShowPrTmDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSpnDropdown, showDescricaoDropdown, showPrTmDropdown]);

  const navigate = useNavigate();

  // ===== Helper para validar se pelo menos um filtro foi preenchido =====
  const hasAnyFilter = (): boolean => {
    return Object.values(filtros).some(value => value && value.trim() !== '');
  };

  // ===== Tradução =====
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'pt-br': {
        'disembarkmentConsult': 'CONSULTA DE DESEMBARQUE',
        'searchFilters': 'Filtros de Busca',
        'searchResults': 'Resultados da Busca',
        'backToMenu': 'Voltar ao Menu',
        'originVessel': 'NAVIO ORIGEM',
        'destinationVessel': 'NAVIO DESTINO',
        'originDepartment': 'DEPARTAMENTO ORIGEM',
        'destinationDepartment': 'DEPARTAMENTO DESTINO',
        'itemDescription': 'DESCRIÇÃO DO ITEM',
        'allocatedPosition': 'POSIÇÃO ALOCADA',
        'prTmMaster': 'PR TM MASTER (REQUISIÇÃO DE COMPRA NO TM MASTER)',
        'transferStatus': 'STATUS TRANSFERÊNCIA',
        'all': 'Todos',
        'search': 'Buscar',
        'clear': 'Limpar',
        'searching': 'Buscando...',
        'recordsFound': 'registro(s) encontrado(s)',
        'noRecordsFound': 'Nenhum registro encontrado.',
        'tryDifferentFilters': 'Tente ajustar os filtros para encontrar registros.',
        'filterRequired': 'Pelo menos um filtro deve ser preenchido para realizar a busca.',
        'cardsView': 'Visualização em Cards',
        'tableView': 'Visualização em Tabela',
        'viewDetails': 'VER DETALHES',
        // Labels específicos
        'movementData': 'DADOS DO MOVIMENTO',
        'r2dData': 'DADOS R2D',
        'transferQuantity': 'QUANTIDADE A TRANSFERIR',
        'unitValue': 'VALOR UNITÁRIO (USD)',
        'totalValue': 'VALOR TOTAL (USD)',
        'LandingData': 'DADOS DESEMBARQUE',
        'conferenceData': 'DADOS CONFERÊNCIA',
        'shipmentData': 'DADOS EMBARQUE',
        'quantityConferenced': 'QUANTIDADE CONFERIDA',
        'responsible': 'RESPONSÁVEL',
        'quantityShipped': 'QUANTIDADE EMBARCADA',
        'migrationOracle': 'MIGRAÇÃO ORACLE',
        'prOracle': 'PR ORACLE',
        'observation': 'OBSERVAÇÃO',
        'status': 'STATUS',
        'referenceFile': 'ARQUIVO REFERÊNCIA'
      },
      'en': {
        'disembarkmentConsult': 'DISEMBARKMENT CONSULTATION',
        'searchFilters': 'Search Filters',
        'searchResults': 'Search Results',
        'backToMenu': 'Back to Menu',
        'originVessel': 'ORIGIN VESSEL',
        'destinationVessel': 'DESTINATION VESSEL',
        'originDepartment': 'ORIGIN DEPARTMENT',
        'destinationDepartment': 'DESTINATION DEPARTMENT',
        'itemDescription': 'ITEM DESCRIPTION',
        'allocatedPosition': 'ALLOCATED POSITION',
        'prTmMaster': 'PR TM MASTER (PURCHASE REQUEST IN TM MASTER)',
        'transferStatus': 'TRANSFER STATUS',
        'all': 'All',
        'search': 'Search',
        'clear': 'Clear',
        'searching': 'Searching...',
        'recordsFound': 'record(s) found',
        'noRecordsFound': 'No records found.',
        'tryDifferentFilters': 'Try adjusting the filters to find records.',
        'filterRequired': 'At least one filter must be filled to perform the search.',
        'cardsView': 'Cards View',
        'tableView': 'Table View',
        'viewDetails': 'VIEW DETAILS',
        // Labels específicos
        'movementData': 'MOVEMENT DATA',
        'r2dData': 'R2D DATA',
        'transferQuantity': 'TRANSFER QUANTITY',
        'unitValue': 'UNIT VALUE (USD)',
        'totalValue': 'TOTAL VALUE (USD)',
        'LandingData': 'LANDING DATA',
        'conferenceData': 'CONFERENCE DATA',
        'shipmentData': 'SHIPMENT DATA',
        'quantityConferenced': 'QUANTITY CONFERENCED',
        'responsible': 'RESPONSIBLE',
        'quantityShipped': 'QUANTITY SHIPPED',
        'migrationOracle': 'ORACLE MIGRATION',
        'prOracle': 'PR ORACLE',
        'observation': 'OBSERVATION',
        'status': 'STATUS',
        'referenceFile': 'REFERENCE FILE'
      }
    };

    return translations[language]?.[key] || key;
  };

  // ===== Helper para navegar baseado no status =====
  const handleStatusClick = (status: string, id: number) => {
    const normalizedStatus = status.toUpperCase().trim();

    if (normalizedStatus.includes('AGUARDANDO CONFERÊNCIA BASE')) {
      navigate(`/desembarque?id=${id}`);
    } else if (normalizedStatus.includes('AGUARDANDO CONFERÊNCIA') || normalizedStatus.includes('CONFERÊNCIA')) {
      navigate(`/conferencia?id=${id}`);
    } else if (normalizedStatus.includes('QUARENTENA')) {
      navigate(`/quarentena?id=${id}`);
    } else if (normalizedStatus.includes('AGUARDANDO LOM') || normalizedStatus.includes('LOM')) {
      navigate(`/lom?id=${id}`);
    } else if (normalizedStatus.includes('ENVIADO PARA EMBARQUE')) {
      navigate(`/embarque?id=${id}`);
    }
  };

  // ===== Filtros inteligentes =====
  const filterOptions = (searchValue: string, options: string[]): string[] => {
    if (!searchValue.trim()) return options;
    const validOptions = options.filter(option =>
      option && typeof option === 'string' && option.trim() !== ''
    );
    return validOptions.filter(option =>
      option.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  useEffect(() => {
    const spnOptions = Array.isArray(filtrosDropdown.SPN) ? filtrosDropdown.SPN.map(String) : [];
    setFilteredSpnOptions(filterOptions(spnSearchValue, spnOptions));
  }, [spnSearchValue, filtrosDropdown.SPN]);

  useEffect(() => {
    const descricaoOptions = Array.isArray(filtrosDropdown.ItemDescription_Descricao) ? filtrosDropdown.ItemDescription_Descricao : [];
    setFilteredDescricaoOptions(filterOptions(descricaoSearchValue, descricaoOptions));
  }, [descricaoSearchValue, filtrosDropdown.ItemDescription_Descricao]);

  useEffect(() => {
    const prTmOptions = Array.isArray(filtrosDropdown.PRNumberTMMaster_Nome) ? filtrosDropdown.PRNumberTMMaster_Nome : [];
    setFilteredPrTmOptions(filterOptions(prTmSearchValue, prTmOptions));
  }, [prTmSearchValue, filtrosDropdown.PRNumberTMMaster_Nome]);

  // ===== Handlers para busca inteligente =====
  const handleSpnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSpnSearchValue(value);
    setFiltros(f => ({ ...f, SPN: value }));
  };

  const handleDescricaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDescricaoSearchValue(value);
    setFiltros(f => ({ ...f, ItemDescription_Descricao: value }));
  };

  const handlePrTmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrTmSearchValue(value);
    setFiltros(f => ({ ...f, PRNumberTMMaster_Nome: value }));
  };

  // ===== Handlers para seleção de opções =====
  const selectSpnOption = (option: string) => {
    setSpnSearchValue(option);
    setFiltros(f => ({ ...f, SPN: option }));
    setShowSpnDropdown(false);
  };

  const selectDescricaoOption = (option: string) => {
    try {
      setDescricaoSearchValue(option);
      setFiltros(f => ({ ...f, ItemDescription_Descricao: option }));
    } finally {
      setTimeout(() => setShowDescricaoDropdown(false), 100);
    }
  };

  const selectPrTmOption = (option: string) => {
    try {
      setPrTmSearchValue(option);
      setFiltros(f => ({ ...f, PRNumberTMMaster_Nome: option }));
    } finally {
      setTimeout(() => setShowPrTmDropdown(false), 100);
    }
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

  // ===== Buscar opções para dropdowns =====
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const res = await axios.get("/api/desembarque/filtros_consulta", {
          headers: {
            'x-user-name': user?.username,
            'x-user-type': user?.user_type,
          }
        });
        setFiltrosDropdown(res.data?.filtros || {});
      } catch {
        setFiltrosDropdown({});
      }
    };

    if (user) {
      fetchDropdowns();
    }
  }, [user]);

  // ===== Buscar dados (registros) =====
  const buscar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Permite buscar sem filtros (retorna todos os registros)
    setFilterError('');
    setLoading(true);

    try {
      // Remove espaços extras dos filtros antes de enviar
      // Corrige o envio do filtro status_movimentacao para garantir valor exato
      const filtrosLimpos = Object.fromEntries(
        Object.entries(filtros)
          .filter(([k, v]) => {
            if (k === "status_movimentacao") {
              // Só envia se for uma seleção exata (não parte de texto)
              return v && v.trim() !== "";
            }
            return v && v.trim() !== "";
          })
          .map(([k, v]) => {
            if (k === "status_movimentacao") {
              // Garante que o valor enviado é exatamente o selecionado
              return [k, v.trim()];
            }
            return [k, typeof v === "string" ? v.trim() : v];
          })
      );
      // LOG extra para depuração
      const res = await axios.get("/api/desembarque/consulta", {
        params: filtrosLimpos,
        headers: {
          'x-user-name': user?.username,
          'x-user-type': user?.user_type,
        }
      });
      // LOG resposta da API
      if (Array.isArray(res.data?.data)) {
        setData(res.data.data);
      } else {
        setData([]);
      }
    } catch (err: any) {
      setData([]);
      setFilterError(
        t('noRecordsFound') + (err?.message ? ` (${err.message})` : '')
      );
      // LOG erro
      console.error('Erro na consulta API:', err);
    }
    setLoading(false);
    setCurrentPage(1); // Reset página ao buscar
  };

  // ===== Limpar filtros =====
  const limpar = () => {
    setFiltros(initialFiltros);
    setData([]);
    setFilterError('');
    setSpnSearchValue("");
    setDescricaoSearchValue("");
    setPrTmSearchValue("");
    setShowSpnDropdown(false);
    setShowDescricaoDropdown(false);
    setShowPrTmDropdown(false);
    setCurrentPage(1); // Reset página ao limpar
  };

  // ===== Change language =====
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  // ===== Helper para renderizar dropdown com busca =====
  const renderDropdownWithSearch = (
    fieldName: keyof Filtros,
    label: string,
    searchValue: string,
    filteredOptions: string[],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onSelect: (option: string) => void,
    showDropdown: boolean,
    setShowDropdown: (show: boolean) => void
  ) => (
    <div className="form-group" key={fieldName}>
      <label className="field-label" htmlFor={`input-${fieldName}`}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          id={`input-${fieldName}`}
          name={String(fieldName)}
          value={searchValue}
          onChange={onChange}
          onFocus={() => setShowDropdown(true)}
          autoComplete="off"
          placeholder="Digite para buscar ou selecionar..."
          style={{ background: searchValue === '' ? '#fff' : undefined }}
          ref={
            fieldName === 'SPN' ? spnInputRef :
              fieldName === 'ItemDescription_Descricao' ? descricaoInputRef :
                fieldName === 'PRNumberTMMaster_Nome' ? prTmInputRef : undefined
          }
        />
        {showDropdown && (
          <div
            className="search-dropdown"
            ref={
              fieldName === 'SPN' ? spnDropdownRef :
                fieldName === 'ItemDescription_Descricao' ? descricaoDropdownRef :
                  fieldName === 'PRNumberTMMaster_Nome' ? prTmDropdownRef : undefined
            }
          >
            <div className="dropdown-header">
              <button
                type="button"
                className="dropdown-close"
                onClick={() => setShowDropdown(false)}
              >
                ✕
              </button>
            </div>
            {filteredOptions.length === 0 ? (
              <div className="no-options">Nenhuma opção encontrada</div>
            ) : (
              <React.Fragment>
                {filteredOptions.slice(0, 15).map((option: string, index: number) => (
                  <div
                    key={`${option}-${index}`}
                    className="search-option"
                    onMouseDown={e => {
                      // Preenche o campo ANTES do dropdown sumir
                      onSelect(option);
                    }}
                  >
                    {String(option)}
                  </div>
                ))}
                {filteredOptions.length > 15 && (
                  <div className="search-more">
                    +{filteredOptions.length - 15} mais opções... (continue digitando para filtrar)
                  </div>
                )}
              </React.Fragment>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ===== Helper para montar dropdown simples =====
  const renderSelect = (
    name: keyof Filtros,
    label: string
  ) => (
    <div className="form-group" key={name}>
      <label className="field-label">{label}</label>
      <select
        className="form-input"
        value={filtros[name]}
        onChange={e => {
          const value = e.target.value;
          setFiltros(f => ({ ...f, [name]: value === '' ? '' : value.trim() }));
        }}
      >
        <option value="">{t('all')}</option>
        {filtrosDropdown[name]?.map(opt =>
          <option key={opt} value={opt.trim()}>{opt}</option>
        )}
      </select>
    </div>
  );

  // ===== Formatação =====
  const formatCurrency = (value: number | string | null | undefined): string => {
    if (!value) return '-';
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // ===== Lógica de paginação =====
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // ===== Render =====
  if (!user) {
    return <div className="loading-screen">Carregando...</div>;
  }

  const isAdmin = user.user_type === 'ADMIN';

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
        </div>
        <div className="page-actions">
          <div className="language-selector">
            <button
              type="button"
              className={`language-btn ${language === 'pt-br' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('pt-br')}
            >
              PT
            </button>
            <button
              type="button"
              className={`language-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en')}
            >
              EN
            </button>
          </div>
          <button
            className="btn-secondary"
            onClick={() => navigate("/menu")}
            style={{ marginLeft: "12px" }}
          >
            {t('backToMenu')}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <section className="filter-section">
        <h2>{t('disembarkmentConsult')}</h2>
        <h2 className="section-title">{t('searchFilters')}</h2>
        <form onSubmit={buscar}>
          <div className="filter-grid">
            {renderSelect("FromVessel_NavioOrigem", t('originVessel'))}
            {renderSelect("ToVessel_NavioDestino", t('destinationVessel'))}
            {renderSelect("FromDepartment_DepartamentoOrigem", t('originDepartment'))}
            {renderSelect("ToDepartment_DepartamentoDestino", t('destinationDepartment'))}

            {renderDropdownWithSearch("SPN", "SPN (SPARE PART NUMBER)", spnSearchValue, filteredSpnOptions, handleSpnChange, selectSpnOption, showSpnDropdown, setShowSpnDropdown)}
            {renderDropdownWithSearch("ItemDescription_Descricao", t('itemDescription'), descricaoSearchValue, filteredDescricaoOptions, handleDescricaoChange, selectDescricaoOption, showDescricaoDropdown, setShowDescricaoDropdown)}
            {renderDropdownWithSearch("PRNumberTMMaster_Nome", t('prTmMaster'), prTmSearchValue, filteredPrTmOptions, handlePrTmChange, selectPrTmOption, showPrTmDropdown, setShowPrTmDropdown)}

            {renderSelect("OriginAllocatedPosition", t('allocatedPosition'))}
            {renderSelect("status_movimentacao", t('transferStatus'))}
          </div>

          <div className="buttons-container" style={{ marginTop: 12 }}>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? t('searching') : t('search')}
              {loading && <span className="loading-spinner"></span>}
            </button>
            <button type="button" className="btn-secondary" onClick={limpar}>
              {t('clear')}
            </button>
          </div>

          {filterError && (
            <div className="filter-error">
              {filterError}
            </div>
          )}
        </form>
      </section>

      {/* Resultados */}
      <section className="results-section">
        <div className="results-header">
          <h2 className="section-title">
            {t('searchResults')} ({data.length} {t('recordsFound')})
          </h2>
          <div className="view-toggle">
            <button
              type="button"
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title={t('cardsView')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h6v6H4V4zm0 10h6v6H4v-6zm10-10h6v6h-6V4zm0 10h6v6h-6v-6z" />
              </svg>
              Cards
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title={t('tableView')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z" />
              </svg>
              Tabela
            </button>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="no-results">
            <p>{t('noRecordsFound')}</p>
            <p>{t('tryDifferentFilters')}</p>
          </div>
        ) : (
          <>
            {/* Controles de paginação no topo */}
            <div className="results-controls-top">
              <div className="entries-selector-requisitions">
                Show
                <select
                  className="form-input"
                  value={itemsPerPage}
                  onChange={(e) => {
                    const nextValue = Number(e.target.value) || 5;
                    setItemsPerPage(nextValue);
                    setCurrentPage(1);
                  }}
                  style={{ width: 70, height: 32, padding: '4px 8px' }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={12}>12</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={data.length}>All</option>
                </select>
                <span style={{ fontSize: 13, color: '#073776' }}>entries</span>
              </div>

              {/* Busca por número de registro */}
              <div className="filter-input-search">
                <div className="form-group" style={{ maxWidth: 260, width: '100%' }}>
                  <label className="field-label">®️ Search</label>
                  <input
                    type="number"
                    className="form-input"
                    min={1}
                    max={data.length}
                    placeholder={`1 - ${data.length}`}
                    onBlur={(e) => {
                      const num = Number((e.target as HTMLInputElement).value);
                      if (Number.isFinite(num) && num >= 1 && num <= data.length) {
                        const targetPage = Math.ceil(num / itemsPerPage);
                        setCurrentPage(targetPage);
                      }
                    }}
                    style={{ height: 32 }}
                  />
                </div>
              </div>
            </div>

            {/* Paginação no topo */}
            {totalPages > 1 && (
              <div className="pagination-container" style={{ marginBottom: "20px", justifyContent: "space-between" }}>
                <button
                  className="pagination-btn"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                >
                  « Primeiro
                </button>

                <button
                  className="pagination-btn"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  ← Anterior
                </button>

                <div className="pagination-numbers">
                  {Array.from({ length: 3 }, (_, i) => {
                    const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
                    const pageNum = start + i;
                    return pageNum <= totalPages ? (
                      <button
                        key={pageNum}
                        className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ) : null;
                  })}
                </div>

                <button
                  className="pagination-btn"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Próximo »
                </button>

                <button
                  className="pagination-btn"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Última »
                </button>

                <div className="pagination-info">
                  Página {currentPage} de {totalPages} ({data.length} registros)
                </div>
              </div>
            )}

            {/* Visualizações */}
            {viewMode === 'cards' ? (
              <div className="results-grid">
                {currentItems.map((row) => (
              <div key={row.id} className="result-item">
                <div className="result-header">
                  <div className="result-id">
                    <div className="detail-label">ID MOVIMENTO</div>
                    <div className="detail-value">#{row.id}</div>
                  </div>
                  <div className="result-status">
                    <div className="status-section">
                      <div className="status-mini-title">{t('status')}</div>
                      <button
                        className={`status-badge ${row.status_movimentacao?.includes('CONFERÊNCIA') ? 'status-conference' :
                          row.status_movimentacao?.includes('QUARENTENA') ? 'status-quarantine' :
                            row.status_movimentacao?.includes('AGUARDANDO LOM') || row.status_movimentacao?.includes('LOM') ? 'status-lom' :
                              row.status_movimentacao?.includes('EMBARQUE') ? 'status-embarkation' :
                                row.status_movimentacao?.includes('DESEMBARQUE') ? 'status-disembarkation' :
                                  'status-default'
                          }`}
                        onClick={() => handleStatusClick(row.status_movimentacao, row.id)}
                        title="Clique para ir para a tela do status atual"
                      >
                        {row.status_movimentacao}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="result-details">
                  {/* Seção Movimento */}
                  <div className="detail-section">
                    <h4 className="section-subtitle">{t('movementData')}</h4>
                    <div className="detail-item">
                      <div className="detail-label">{t('originVessel')}</div>
                      <div className="detail-value">{row.FromVessel_NavioOrigem || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">{t('destinationVessel')}</div>
                      <div className="detail-value">{row.ToVessel_NavioDestino || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">{t('originDepartment')}</div>
                      <div className="detail-value">{row.FromDepartment_DepartamentoOrigem || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">{t('destinationDepartment')}</div>
                      <div className="detail-value">{row.ToDepartment_DepartamentoDestino || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">SPN</div>
                      <div className="detail-value">{row.SPN !== undefined && row.SPN !== null && String(row.SPN).trim() !== '' ? String(row.SPN) : "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">{t('itemDescription')}</div>
                      <div className="detail-value">{row.ItemDescription_DescricaoItem || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">{t('allocatedPosition')}</div>
                      <div className="detail-value">{row.OriginAllocatedPosition_PosicaoAlocadaOrigem || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">{t('transferQuantity')}</div>
                      <div className="detail-value">{row.QuantityToBeTransferred_QuantidadeATransferir || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">LOM</div>
                      <div className="detail-value">{row.LOM || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">{t('unitValue')}</div>
                      <div className="detail-value">{formatCurrency(row.UnitValue_USD_ValorUnitario_USD)}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">{t('totalValue')}</div>
                      <div className="detail-value">{formatCurrency(row.TotalAmount_USD_ValorTotal_USD)}</div>
                    </div>
                  </div>

                  {/* Seção R2D */}
                  <div className="detail-section">
                    <h4 className="section-subtitle">{t('r2dData')}</h4>
                    <div className="detail-item">
                      <div className="detail-label">UNIDADE OPERACIONAL</div>
                      <div className="detail-value">{row.RD2_UNIDADE_OPERACIONAL_PR || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">REQUISITANTE</div>
                      <div className="detail-value">{row.RD2_REQUISITANTE_PR || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">PR TM MASTER</div>
                      <div className="detail-value">{row.PRNumberTMMaster_NumeroPRTMMaster || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">LINHA PR</div>
                      <div className="detail-value">{row.RD2_NUMERO_LINHA_PR || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">STATUS PR</div>
                      <div className="detail-value">{row.RD2_STATUS_PR || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">{t('migrationOracle')}</div>
                      <div className="detail-value">
                        <span className={`migration-badge ${row.PR_MT_MASTER_MIGRACAO_ORACLE === 'SIM' ? 'migrated' : 'not-migrated'}`}>
                          {row.PR_MT_MASTER_MIGRACAO_ORACLE || "-"}
                        </span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">{t('prOracle')}</div>
                      <div className="detail-value">{row.OraclePRNumber_NumeroPROracle || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">VALOR UNIT. PO</div>
                      <div className="detail-value">{formatCurrency(row.RD2_VALOR_UNITARIO_PO)}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">TOTAL LINHA PO</div>
                      <div className="detail-value">{formatCurrency(row.RD2_TOTAL_LINHA_PO)}</div>
                    </div>
                  </div>

                  {/* Seção Desembarque */}
                  <div className="detail-section">
                    <h4 className="section-subtitle">{t('LandingData')}</h4>
                    <div className="detail-item">
                      <div className="detail-label">Desembarque - Quantidade Conferida</div>
                      <div className="detail-value">{(row.Desembarque_quantidade_conferida !== undefined && row.Desembarque_quantidade_conferida !== null && row.Desembarque_quantidade_conferida !== "") ? row.Desembarque_quantidade_conferida : "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Responsável</div>
                      <div className="detail-value">{row.Desembarque_responsavel || "-"}</div>
                    </div>
                  </div>

                  {/* Seção Conferência */}
                  <div className="detail-section">
                    <h4 className="section-subtitle">{t('conferenceData')}</h4>
                    <div className="detail-item">
                      <div className="detail-label">{t('quantityConferenced')}</div>
                      <div className="detail-value">{row.conferencia_quantidade_conferida || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">{t('responsible')}</div>
                      <div className="detail-value">{row.conferencia_responsavel || "-"}</div>
                    </div>
                  </div>

                  {/* Seção Embarque */}
                  <div className="detail-section">
                    <h4 className="section-subtitle">{t('shipmentData')}</h4>
                    <div className="detail-item">
                      <div className="detail-label">{t('quantityShipped')}</div>
                      <div className="detail-value">{row.embarque_quantidade_conferida || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">{t('responsible')}</div>
                      <div className="detail-value">{row.embarque_responsavel || "-"}</div>
                    </div>
                  </div>

                  {/* Seção Observações */}
                  {(row.observacao_movimentacao || row.arquivo_referencia) && (
                    <div className="detail-section">
                      <h4 className="section-subtitle">INFORMAÇÕES ADICIONAIS</h4>
                      {row.observacao_movimentacao && (
                        <div className="detail-item">
                          <div className="detail-label">{t('observation')}</div>
                          <div className="detail-value">{row.observacao_movimentacao}</div>
                        </div>
                      )}
                      {row.arquivo_referencia && (
                        <div className="detail-item">
                          <div className="detail-label">{t('referenceFile')}</div>
                          <div className="detail-value">{row.arquivo_referencia}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th style={{ width: '120px' }}>UNIDADE OPERACIONAL</th>
                  <th style={{ width: '120px' }}>REQUISITANTE</th>
                  <th style={{ width: '180px' }}>PR TM MASTER R2D</th>
                  <th style={{ width: '100px' }}>LINHA PR</th>
                  <th style={{ width: '120px' }}>STATUS PR</th>
                  <th style={{ width: '120px' }}>VALOR UNITÁRIO PO</th>
                  <th style={{ width: '120px' }}>VALOR TOTAL LINHA PO</th>
                  <th style={{ width: '140px' }}>{t('originVessel')}</th>
                  <th style={{ width: '140px' }}>{t('destinationVessel')}</th>
                  <th style={{ width: '140px' }}>{t('originDepartment')}</th>
                  <th style={{ width: '140px' }}>{t('destinationDepartment')}</th>
                  <th style={{ width: '180px' }}>PR TM MASTER</th>
                  <th style={{ width: '140px' }}>MIGRAÇÃO ORACLE</th>
                  <th style={{ width: '180px' }}>ORACLE PR NUMBER</th>
                  <th style={{ width: '120px' }}>SPN</th>
                  <th style={{ width: '220px' }}>{t('itemDescription')}</th>
                  <th style={{ width: '140px' }}>{t('allocatedPosition')}</th>
                  <th style={{ width: '120px' }}>QUANTIDADE A TRANSFERIR</th>
                  <th style={{ width: '120px' }}>LOM</th>
                  <th style={{ width: '160px' }}>DESEMBARQUE - QUANTIDADE CONFERIDA</th>
                  <th style={{ width: '180px' }}>DESEMBARQUE - RESPONSÁVEL</th>
                  <th style={{ width: '160px' }}>CONFERÊNCIA - QUANTIDADE CONFERIDA</th>
                  <th style={{ width: '180px' }}>CONFERÊNCIA - RESPONSÁVEL</th>
                  <th style={{ width: '160px' }}>EMBARQUE - QUANTIDADE CONFERIDA</th>
                  <th style={{ width: '180px' }}>EMBARQUE - RESPONSÁVEL</th>
                  <th style={{ width: '140px' }}>VALOR UNITÁRIO (USD)</th>
                  <th style={{ width: '160px' }}>VALOR TOTAL (USD)</th>
                  <th style={{ width: '180px' }}>ARQUIVO REFERÊNCIA</th>
                  <th style={{ width: '180px' }}>{t('observation')}</th>
                  <th style={{ width: '180px' }}>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(row => (
                  <tr key={row.id}>
                    <td className="id-column" style={{ width: '60px' }}>#{row.id}</td>
                    <td style={{ width: '80px' }} title={row.RD2_UNIDADE_OPERACIONAL_PR}>{row.RD2_UNIDADE_OPERACIONAL_PR || '-'}</td>
                    <td style={{ width: '100px' }} title={row.RD2_REQUISITANTE_PR}>{row.RD2_REQUISITANTE_PR || '-'}</td>
                    <td style={{ width: '120px' }} title={row.RD2_PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER}>{row.RD2_PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER || '-'}</td>
                    <td className="pr-line-column" style={{ width: '70px' }}>{row.RD2_NUMERO_LINHA_PR}</td>
                    <td style={{ width: '80px' }} title={row.RD2_STATUS_PR}>{row.RD2_STATUS_PR || '-'}</td>
                    <td className="value-column" style={{ width: '90px' }}>{formatCurrency(row.RD2_VALOR_UNITARIO_PO)}</td>
                    <td className="value-column" style={{ width: '90px' }}>{formatCurrency(row.RD2_TOTAL_LINHA_PO)}</td>
                    <td style={{ width: '100px' }}>{row.FromVessel_NavioOrigem}</td>
                    <td style={{ width: '100px' }}>{row.ToVessel_NavioDestino}</td>
                    <td style={{ width: '100px' }}>{row.FromDepartment_DepartamentoOrigem}</td>
                    <td style={{ width: '100px' }}>{row.ToDepartment_DepartamentoDestino}</td>
                    <td className="pr-column" style={{ width: '120px' }}>{row.PRNumberTMMaster_NumeroPRTMMaster}</td>
                    <td className="migracao-column" style={{ width: '80px' }}>
                      <span className={`migration-badge ${row.PR_MT_MASTER_MIGRACAO_ORACLE === 'SIM' ? 'migrated' : 'not-migrated'}`}>
                        {row.PR_MT_MASTER_MIGRACAO_ORACLE}
                      </span>
                    </td>
                    <td className="pr-column" style={{ width: '120px' }}>{row.OraclePRNumber_NumeroPROracle || '-'}</td>
                    <td className="spn-column" style={{ width: '100px' }}>{row.SPN !== undefined && row.SPN !== null && String(row.SPN).trim() !== '' ? String(row.SPN) : '-'}</td>
                    <td className="description-column" style={{ width: '180px' }} title={row.ItemDescription_DescricaoItem}>
                      {row.ItemDescription_DescricaoItem}
                    </td>
                    <td style={{ width: '100px' }}>{row.OriginAllocatedPosition_PosicaoAlocadaOrigem}</td>
                    <td className="quantity-column" style={{ width: '90px' }}>{row.QuantityToBeTransferred_QuantidadeATransferir}</td>
                    <td className="lom-column" style={{ width: '80px' }}>{row.LOM || '-'}</td>
                    <td className="quantity-column" style={{ width: '90px' }}>{row.Desembarque_quantidade_conferida || '-'}</td>
                    <td className="resp-column" style={{ width: '100px' }}>{row.Desembarque_responsavel || '-'}</td>
                    <td className="quantity-column" style={{ width: '90px' }}>{row.conferencia_quantidade_conferida || '-'}</td>
                    <td className="resp-column" style={{ width: '100px' }}>{row.conferencia_responsavel || '-'}</td>

                    <td className="quantity-column" style={{ width: '90px' }}>{row.embarque_quantidade_conferida || '-'}</td>
                    <td className="resp-column" style={{ width: '100px' }}>{row.embarque_responsavel || '-'}</td>
                    <td className="unit-value-column" style={{ width: '100px' }}>{formatCurrency(row.UnitValue_USD_ValorUnitario_USD)}</td>
                    <td className="value-column" style={{ width: '110px' }}>{formatCurrency(row.TotalAmount_USD_ValorTotal_USD)}</td>
                    <td style={{ width: '120px' }} title={row.arquivo_referencia}>{row.arquivo_referencia || '-'}</td>
                    <td className="observacao-column" style={{ width: '120px' }} title={row.observacao_movimentacao}>
                      {row.observacao_movimentacao || '-'}
                    </td>
                    <td className="status-column" style={{ width: '140px' }}>
                      <button
                        className={`status-btn ${row.status_movimentacao?.includes('CONFERÊNCIA') ? 'status-conference' :
                          row.status_movimentacao?.includes('QUARENTENA') ? 'status-quarantine' :
                            row.status_movimentacao?.includes('AGUARDANDO LOM') || row.status_movimentacao?.includes('LOM') ? 'status-lom' :
                              row.status_movimentacao?.includes('EMBARQUE') ? 'status-embarkation' :
                                row.status_movimentacao?.includes('DESEMBARQUE') ? 'status-disembarkation' :
                                  'status-default'
                          }`}
                        onClick={() => handleStatusClick(row.status_movimentacao, row.id)}
                        title="Clique para ir para a tela do status atual"
                      >
                        {row.status_movimentacao}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação no final */}
        {totalPages > 1 && (
          <div className="pagination-container" style={{ marginTop: "20px" }}>
            <button
              className="pagination-btn"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              « Primeiro
            </button>

            <button
              className="pagination-btn"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              ← Anterior
            </button>

            <div className="pagination-numbers">
              {Array.from({ length: 3 }, (_, i) => {
                const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
                const pageNum = start + i;
                return pageNum <= totalPages ? (
                  <button
                    key={pageNum}
                    className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ) : null;
              })}
            </div>

            <button
              className="pagination-btn"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Próximo →
            </button>

            <button
              className="pagination-btn"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Última »
            </button>

            <div className="pagination-info">
              Página {currentPage} de {totalPages} ({data.length} registros)
            </div>
          </div>
        )}
      </>
    )}
  </section>

      <style>{`
        .filter-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: start;
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
          max-height: 300px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .dropdown-header {
          position: sticky;
          top: 0;
          background: #f8f9fa;
          padding: 8px 12px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dropdown-close {
          background: none;
          border: none;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          color: #6b7280;
          padding: 2px 6px;
          border-radius: 3px;
          margin-left: auto;
        }

        .dropdown-close:hover {
          background-color: #e5e7eb;
          color: #374151;
        }

        .search-option {
          padding: 10px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
          transition: background-color 0.2s ease;
          word-wrap: break-word;
        }

        .search-option:hover {
          background-color: #f3f4f6;
        }

        .search-option:last-child {
          border-bottom: none;
        }

        .search-more {
          padding: 10px 12px;
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        .no-options {
          padding: 16px 12px;
          text-align: center;
          color: #6b7280;
          font-style: italic;
          font-size: 14px;
        }

        .form-group {
          position: relative;
        }

        .detail-section {
          margin-bottom: 16px;
          padding: 12px;
          background-color: #f8f9fa;
          border-radius: 6px;
        }

        .section-subtitle {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 2px solid #e5e7eb;
        }

        .result-status {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: stretch;
        }

        .status-section {
          text-align: center;
        }

        .status-mini-title {
          font-size: 10px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 4px;
          letter-spacing: 0.5px;
        }

        .status-badge, .status-btn {
          padding: 6px 12px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .status-conference, .status-conference:hover { background-color: #3b82f6; }
        .status-quarantine, .status-quarantine:hover { background-color: #f59e0b; }
        .status-lom, .status-lom:hover { background-color: #8b5cf6; }
        .status-embarkation, .status-embarkation:hover { background-color: #10b981; }
        .status-disembarkation, .status-disembarkation:hover { background-color: #6b7280; }
        .status-default, .status-default:hover { background-color: #374151; }

        .migration-badge {
          padding: 4px 8px;
          border-radius: 8px;
          color: white;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .migration-badge.migrated {
          background-color: #10b981;
        }

        .migration-badge.not-migrated {
          background-color: #ef4444;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .filter-error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px;
          border-radius: 6px;
          margin-top: 12px;
          font-size: 14px;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 16px;
        }

        .view-toggle {
          display: flex;
          background-color: #f3f4f6;
          border-radius: 8px;
          padding: 4px;
          gap: 2px;
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        .view-btn:hover {
          color: #374151;
          background-color: #e5e7eb;
        }

        .view-btn.active {
          background-color: white;
          color: #1f2937;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .view-btn svg {
          width: 16px;
          height: 16px;
        }

        .table-container {
          overflow-x: auto;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .results-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .results-table th {
          background-color: #f9fafb;
          color: #374151;
          font-weight: 600;
          padding: 12px 8px;
          text-align: left;
          border-bottom: 2px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          white-space: nowrap;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .results-table th:last-child {
          border-right: none;
        }

        .results-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #f3f4f6;
          border-right: 1px solid #f3f4f6;
          vertical-align: middle;
          word-wrap: break-word;
        }

        .results-table td:last-child {
          border-right: none;
        }

        .results-table tbody tr:hover {
          background-color: #f9fafb;
        }

        .results-table tbody tr:nth-child(even) {
          background-color: #fafafa;
        }

        .results-table tbody tr:nth-child(even):hover {
          background-color: #f3f4f6;
        }

        /* Colunas específicas da tabela */
        .id-column {
          font-weight: 600;
          color: #1f2937;
        }

        .pr-line-column, .quantity-column {
          text-align: right;
          font-weight: 500;
        }

        .value-column, .unit-value-column {
          text-align: right;
          font-weight: 600;
          color: #059669;
        }

        .description-column {
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .spn-column, .pr-column {
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }

        .resp-column, .observacao-column {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-column {
          text-align: center;
        }

        .lom-column {
          text-align: center;
          font-weight: 600;
        }

        .migracao-column {
          text-align: center;
        }

        /* Estilos de paginação */
        .pagination-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin: 20px 0;
        }

        .pagination-btn {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          transition: all 0.2s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-numbers {
          display: flex;
          gap: 4px;
        }

        .pagination-number {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          transition: all 0.2s ease;
          min-width: 40px;
        }

        .pagination-number:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .pagination-number.active {
          background-color: #2563eb;
          color: white;
          border-color: #2563eb;
        }

        .pagination-info {
          font-size: 14px;
          color: #6b7280;
          margin-left: 16px;
        }

        .results-controls-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .entries-selector-requisitions {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #073776;
        }

        .filter-input-search {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 768px) {
          .filter-grid {
            grid-template-columns: 1fr;
          }
          
          .result-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .result-status {
            justify-content: center;
          }

          .detail-section {
            padding: 8px;
          }

          .results-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .view-toggle {
            align-self: center;
          }
        }
      `}</style>
    </div>
  );
};

export default DesembarqueConsulta;