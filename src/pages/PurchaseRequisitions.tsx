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
  PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER: string;
  NUMERO_PO: string;
  DESCRICAO_ITEM_PTB: string;
  DESCRICAO_ITEM_US: string;
  ID: string;
  SPN: string;
  STATUS_PR: string;
  STATUS_APROVACAO_PO: string;
  data_inicio: string;
  data_fim: string;
}

interface R2DRecord {
  UNIDADE_OPERACIONAL_PR: string;
  PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE: string;
  NUMERO_LINHA_PR: number;
  PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER: string;
  DEPARTMENT: string;
  PRIORIDADE_COMPRA: string;
  DATA_NECESSARIA_PR: string;
  CODIGO_ITEM_PR: string;
  SPN: string;
  ID: string;
  DESCRICAO_ITEM_PTB: string;
  DESCRICAO_ITEM_US: string;
  UNIDADE_DE_MEDIDA_PR: string;
  QUANTIDADE_PR: number;
  QUANTIDADE_ATENDIDA_PR: number;
  DESP_CENTRO_CUSTO_PR: string;
  DESP_DISCIPLINA_PR: string;
  DESP_CONTA_PR: string;
  STATUS_PR: string;
  DATA_CRIACAO_PR: string;
  NUMERO_PO: string;
  NUM_PO_COPIA: string;
  COMPRADOR_PO: string;
  NOME_FORNECEDOR_PO: string;
  ORIGEM_FORNECEDOR_PO: string;
  STATUS_APROVACAO_PO: string;
  MOTIVO_REJEICAO_PO: string;
  QUANTIDADE_PO: number;
  MOEDA_PO: string;
  VALOR_UNITARIO_PO: number;
  TOTAL_LINHA_PO: number;
  TOTAL_CENTRO_CUSTO_PO: number;
  NRO_LINHA_DISTRIB_CONTABIL_PO: string;
  DATA_NECESSARIA_PO: string;
  DATA_CRIACAO_PO: string;
  DATA_PROMETIDA_ORIGINAL_PO_2: string;
  QUANTIDADE_RECEBIDA_PO: number;
  QUANTIDADE_EM_ABERTO_PO: number;
  QUANTIDADE_CANCELADA_PO: number;
  DATA_FECHAMENTO: string;
  STATUS_FECHAMENTO_LINHA_PO: string;
}

// ====== Constantes iniciais ======
const initialFiltros: Filtros = {
  PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER: "",
  NUMERO_PO: "",
  DESCRICAO_ITEM_PTB: "",
  DESCRICAO_ITEM_US: "",
  ID: "",
  SPN: "",
  STATUS_PR: "",
  STATUS_APROVACAO_PO: "",
  data_inicio: "",
  data_fim: "",
};

axios.defaults.baseURL = 'http://10.15.3.30:9280';

export default function PurchaseRequisitions() {
  const [user, setUser] = useState<User | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(initialFiltros);
  const [data, setData] = useState<R2DRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('pt-br');
  const [dropdowns, setDropdowns] = useState<Partial<Record<keyof Filtros, string[]>>>({});
  const [filterError, setFilterError] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // ADICIONAR Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12); // 20 itens por página

  // Estados para campos com busca inteligente
  const [prTmMasterSearchValue, setPrTmMasterSearchValue] = useState("");
  const [numeroPOSearchValue, setNumeroPOSearchValue] = useState("");
  const [descricaoPTBSearchValue, setDescricaoPTBSearchValue] = useState("");
  const [descricaoUSSearchValue, setDescricaoUSSearchValue] = useState("");
  const [idSearchValue, setIdSearchValue] = useState("");
  const [spnSearchValue, setSpnSearchValue] = useState("");

  const [filteredPrTmMasterOptions, setFilteredPrTmMasterOptions] = useState<string[]>([]);
  const [filteredNumeroPOOptions, setFilteredNumeroPOOptions] = useState<string[]>([]);
  const [filteredDescricaoPTBOptions, setFilteredDescricaoPTBOptions] = useState<string[]>([]);
  const [filteredDescricaoUSOptions, setFilteredDescricaoUSOptions] = useState<string[]>([]);
  const [filteredIdOptions, setFilteredIdOptions] = useState<string[]>([]);
  const [filteredSpnOptions, setFilteredSpnOptions] = useState<string[]>([]);

  // Estados para controlar visibilidade dos dropdowns
  const [showPrTmMasterDropdown, setShowPrTmMasterDropdown] = useState(false);
  const [showNumeroPODropdown, setShowNumeroPODropdown] = useState(false);
  const [showDescricaoPTBDropdown, setShowDescricaoPTBDropdown] = useState(false);
  const [showDescricaoUSDropdown, setShowDescricaoUSDropdown] = useState(false);
  const [showIdDropdown, setShowIdDropdown] = useState(false);
  const [showSpnDropdown, setShowSpnDropdown] = useState(false);


  const navigate = useNavigate();

  // ===== Helper para validar se pelo menos um filtro foi preenchido =====
  const hasAnyFilter = (): boolean => {
    return Object.values(filtros).some(value => value && value.trim() !== '');
  };

  // ===== Tradução =====
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'pt-br': {
        // Títulos e Navegação
        'purchaseRequisitions': 'CONSULTA R2D - REQUISIÇÕES DE COMPRA',
        'searchFilters': 'Filtros de Busca',
        'searchResults': 'Resultados da Busca',
        'backToMenu': 'Voltar ao Menu',

        // Filtros
        'prTmMaster': 'PR TM MASTER (REQUISIÇÃO DE COMPRA NO TM MASTER)',
        'numeroPO': 'NÚMERO PO',
        'descricaoItemPTB': 'DESCRIÇÃO ITEM (PORTUGUÊS)',
        'descricaoItemUS': 'DESCRIÇÃO ITEM (INGLÊS)',
        'idItem': 'ID DO ITEM',
        'spn': 'SPN (SPARE PART NUMBER)',
        'statusPR': 'STATUS PR',
        'statusAprovacaoPO': 'STATUS APROVAÇÃO PO',
        'startDate': 'DATA INÍCIO (CRIAÇÃO PO)',
        'endDate': 'DATA FIM (CRIAÇÃO PO)',
        'all': 'Todos',

        // Ações
        'search': 'Buscar',
        'clear': 'Limpar',
        'searching': 'Buscando...',
        'viewDetails': 'VER DETALHES',
        'cardsView': 'Visualização em Cards',
        'tableView': 'Visualização em Tabela',

        // Validações
        'filterRequired': 'Pelo menos um filtro deve ser preenchido para realizar a busca.',
        'dateValidation': 'Se selecionar filtro de data, deve informar início e fim.',

        // Resultados
        'recordsFound': 'registro(s) encontrado(s)',
        'noRecordsFound': 'Nenhum registro encontrado.',
        'tryDifferentFilters': 'Tente ajustar os filtros para encontrar registros.',

        // Labels dos campos - PR
        'unidadeOperacional': 'UNIDADE OPERACIONAL',
        'prOracle': 'PR ORACLE',
        'numeroLinhaPR': 'NÚMERO LINHA PR',
        'department': 'DEPARTAMENTO',
        'prioridade': 'PRIORIDADE',
        'dataNecessariaPR': 'DATA NECESSÁRIA PR',
        'codigoItem': 'CÓDIGO ITEM',
        'unidadeMedida': 'UNIDADE MEDIDA',
        'quantidadePR': 'QUANTIDADE PR',
        'quantidadeAtendida': 'QUANTIDADE ATENDIDA',
        'centroCusto': 'CENTRO CUSTO',
        'disciplina': 'DISCIPLINA',
        'conta': 'CONTA',
        'statusPrLabel': 'STATUS PR',
        'dataCriacaoPR': 'DATA CRIAÇÃO PR',

        // Labels dos campos - PO
        'numPOCopia': 'NUM PO CÓPIA',
        'compradorPO': 'COMPRADOR PO',
        'fornecedor': 'FORNECEDOR',
        'origemFornecedor': 'ORIGEM FORNECEDOR',
        'statusAprovacao': 'STATUS APROVAÇÃO',
        'motivoRejeicao': 'MOTIVO REJEIÇÃO',
        'quantidadePO': 'QUANTIDADE PO',
        'moeda': 'MOEDA',
        'valorUnitario': 'VALOR UNITÁRIO',
        'totalLinha': 'TOTAL LINHA',
        'totalCentroCusto': 'TOTAL CENTRO CUSTO',
        'nroLinhaContabil': 'NRO LINHA CONTÁBIL',
        'dataNecessariaPO': 'DATA NECESSÁRIA PO',
        'dataCriacaoPO': 'DATA CRIAÇÃO PO',
        'dataPrometida': 'DATA PROMETIDA',
        'quantidadeRecebida': 'QUANTIDADE RECEBIDA',
        'quantidadeAberto': 'QUANTIDADE EM ABERTO',
        'quantidadeCancelada': 'QUANTIDADE CANCELADA',
        'dataFechamento': 'DATA FECHAMENTO',
        'statusFechamento': 'STATUS FECHAMENTO'
      },
      'en': {
        // Títulos e Navegação
        'purchaseRequisitions': 'R2D QUERY - PURCHASE REQUISITIONS',
        'searchFilters': 'Search Filters',
        'searchResults': 'Search Results',
        'backToMenu': 'Back to Menu',

        // Filtros
        'prTmMaster': 'PR TM MASTER (PURCHASE REQUEST IN TM MASTER)',
        'numeroPO': 'PO NUMBER',
        'descricaoItemPTB': 'ITEM DESCRIPTION (PORTUGUESE)',
        'descricaoItemUS': 'ITEM DESCRIPTION (ENGLISH)',
        'idItem': 'ITEM ID',
        'spn': 'SPN (SPARE PART NUMBER)',
        'statusPR': 'PR STATUS',
        'statusAprovacaoPO': 'PO APPROVAL STATUS',
        'startDate': 'START DATE (PO CREATION)',
        'endDate': 'END DATE (PO CREATION)',
        'all': 'All',

        // Ações
        'search': 'Search',
        'clear': 'Clear',
        'searching': 'Searching...',
        'viewDetails': 'VIEW DETAILS',
        'cardsView': 'Cards View',
        'tableView': 'Table View',

        // Validações
        'filterRequired': 'At least one filter must be filled to perform the search.',
        'dateValidation': 'If selecting date filter, must inform start and end.',

        // Resultados
        'recordsFound': 'record(s) found',
        'noRecordsFound': 'No records found.',
        'tryDifferentFilters': 'Try adjusting the filters to find records.',

        // Labels dos campos - PR
        'unidadeOperacional': 'OPERATIONAL UNIT',
        'prOracle': 'PR ORACLE',
        'numeroLinhaPR': 'PR LINE NUMBER',
        'department': 'DEPARTMENT',
        'prioridade': 'PRIORITY',
        'dataNecessariaPR': 'REQUIRED DATE PR',
        'codigoItem': 'ITEM CODE',
        'unidadeMedida': 'UNIT OF MEASURE',
        'quantidadePR': 'PR QUANTITY',
        'quantidadeAtendida': 'QUANTITY SERVED',
        'centroCusto': 'COST CENTER',
        'disciplina': 'DISCIPLINE',
        'conta': 'ACCOUNT',
        'statusPrLabel': 'PR STATUS',
        'dataCriacaoPR': 'PR CREATION DATE',

        // Labels dos campos - PO
        'numPOCopia': 'PO COPY NUM',
        'compradorPO': 'PO BUYER',
        'fornecedor': 'SUPPLIER',
        'origemFornecedor': 'SUPPLIER ORIGIN',
        'statusAprovacao': 'APPROVAL STATUS',
        'motivoRejeicao': 'REJECTION REASON',
        'quantidadePO': 'PO QUANTITY',
        'moeda': 'CURRENCY',
        'valorUnitario': 'UNIT VALUE',
        'totalLinha': 'LINE TOTAL',
        'totalCentroCusto': 'COST CENTER TOTAL',
        'nroLinhaContabil': 'ACCOUNTING LINE NUMBER',
        'dataNecessariaPO': 'REQUIRED DATE PO',
        'dataCriacaoPO': 'PO CREATION DATE',
        'dataPrometida': 'PROMISED DATE',
        'quantidadeRecebida': 'RECEIVED QUANTITY',
        'quantidadeAberto': 'OPEN QUANTITY',
        'quantidadeCancelada': 'CANCELLED QUANTITY',
        'dataFechamento': 'CLOSING DATE',
        'statusFechamento': 'CLOSING STATUS'
      }
    };

    return translations[language]?.[key] || key;
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

  // ===== useEffect para filtros inteligentes =====
  useEffect(() => {
    const prOptions = Array.isArray(dropdowns.PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER) ? dropdowns.PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER : [];
    setFilteredPrTmMasterOptions(filterOptions(prTmMasterSearchValue, prOptions));
  }, [prTmMasterSearchValue, dropdowns.PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER]);

  useEffect(() => {
    const poOptions = Array.isArray(dropdowns.NUMERO_PO) ? dropdowns.NUMERO_PO : [];
    setFilteredNumeroPOOptions(filterOptions(numeroPOSearchValue, poOptions));
  }, [numeroPOSearchValue, dropdowns.NUMERO_PO]);

  useEffect(() => {
    const descPTBOptions = Array.isArray(dropdowns.DESCRICAO_ITEM_PTB) ? dropdowns.DESCRICAO_ITEM_PTB : [];
    setFilteredDescricaoPTBOptions(filterOptions(descricaoPTBSearchValue, descPTBOptions));
  }, [descricaoPTBSearchValue, dropdowns.DESCRICAO_ITEM_PTB]);

  useEffect(() => {
    const descUSOptions = Array.isArray(dropdowns.DESCRICAO_ITEM_US) ? dropdowns.DESCRICAO_ITEM_US : [];
    setFilteredDescricaoUSOptions(filterOptions(descricaoUSSearchValue, descUSOptions));
  }, [descricaoUSSearchValue, dropdowns.DESCRICAO_ITEM_US]);

  useEffect(() => {
    const idOptions = Array.isArray(dropdowns.ID) ? dropdowns.ID : [];
    setFilteredIdOptions(filterOptions(idSearchValue, idOptions));
  }, [idSearchValue, dropdowns.ID]);

  useEffect(() => {
    const spnOptions = Array.isArray(dropdowns.SPN) ? dropdowns.SPN : [];
    setFilteredSpnOptions(filterOptions(spnSearchValue, spnOptions));
  }, [spnSearchValue, dropdowns.SPN]);

  // ===== Handlers para busca inteligente =====
  const handlePrTmMasterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrTmMasterSearchValue(value);
    setFiltros(f => ({ ...f, PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER: value }));
  };

  const handleNumeroPOChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNumeroPOSearchValue(value);
    setFiltros(f => ({ ...f, NUMERO_PO: value }));
  };

  const handleDescricaoPTBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDescricaoPTBSearchValue(value);
    setFiltros(f => ({ ...f, DESCRICAO_ITEM_PTB: value }));
  };

  const handleDescricaoUSChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDescricaoUSSearchValue(value);
    setFiltros(f => ({ ...f, DESCRICAO_ITEM_US: value }));
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIdSearchValue(value);
    setFiltros(f => ({ ...f, ID: value }));
  };

  const handleSpnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSpnSearchValue(value);
    setFiltros(f => ({ ...f, SPN: value }));
  };

  // ===== Handlers para seleção de opções =====
  const selectPrTmMasterOption = (option: string) => {
    setPrTmMasterSearchValue(option);
    setFiltros(f => ({ ...f, PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER: option }));
    setShowPrTmMasterDropdown(false);
  };

  const selectNumeroPOOption = (option: string) => {
    setNumeroPOSearchValue(option);
    setFiltros(f => ({ ...f, NUMERO_PO: option }));
    setShowNumeroPODropdown(false);
  };

  const selectDescricaoPTBOption = (option: string) => {
    setDescricaoPTBSearchValue(option);
    setFiltros(f => ({ ...f, DESCRICAO_ITEM_PTB: option }));
    setShowDescricaoPTBDropdown(false);
  };

  const selectDescricaoUSOption = (option: string) => {
    setDescricaoUSSearchValue(option);
    setFiltros(f => ({ ...f, DESCRICAO_ITEM_US: option }));
    setShowDescricaoUSDropdown(false);
  };

  const selectIdOption = (option: string) => {
    setIdSearchValue(option);
    setFiltros(f => ({ ...f, ID: option }));
    setShowIdDropdown(false);
  };

  const selectSpnOption = (option: string) => {
    setSpnSearchValue(option);
    setFiltros(f => ({ ...f, SPN: option }));
    setShowSpnDropdown(false);
  };

  // ===== Usuário & inicialização =====
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch { }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchDropdowns();
    }
  }, [user]);

  // ===== Dropdowns Dinâmicos =====
  const fetchDropdowns = async () => {
    try {
      const res = await axios.get("/api/R2D/filtros_consulta", {
        headers: { 'x-user-name': user?.username, 'x-user-type': user?.user_type }
      });
      if (res.data?.filtros) setDropdowns(res.data.filtros);
    } catch { setDropdowns({}); }
  };

  // ===== Buscar dados =====
  const buscar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!hasAnyFilter()) {
      setFilterError(t('filterRequired'));
      return;
    }

    if ((filtros.data_inicio && !filtros.data_fim) || (!filtros.data_inicio && filtros.data_fim)) {
      setFilterError(t('dateValidation'));
      return;
    }

    setFilterError('');
    setLoading(true);
    setCurrentPage(1); // ✅ RESET da página ao buscar

    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([_, v]) => v));
      const res = await axios.get("/api/R2D/consulta", {
        params,
        headers: { 'x-user-name': user?.username, 'x-user-type': user?.user_type }
      });
      setData(res.data.data || []);
    } catch { setData([]); }
    setLoading(false);
  };

  // ===== Limpar filtros =====
  const limparFiltros = () => {
    setFiltros(initialFiltros);
    setData([]);
    setFilterError('');
    setCurrentPage(1); // ✅ RESET da página ao limpar
    setPrTmMasterSearchValue("");
    setNumeroPOSearchValue("");
    setDescricaoPTBSearchValue("");
    setDescricaoUSSearchValue("");
    setIdSearchValue("");
    setSpnSearchValue("");
    // Fechar todos os dropdowns
    setShowPrTmMasterDropdown(false);
    setShowNumeroPODropdown(false);
    setShowDescricaoPTBDropdown(false);
    setShowDescricaoUSDropdown(false);
    setShowIdDropdown(false);
    setShowSpnDropdown(false);
  };

  // ===== Outros handlers =====
  const handleLanguageChange = (newLanguage: string) => { setLanguage(newLanguage); };

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
      <label className="field-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          value={searchValue}
          onChange={onChange}
          onFocus={() => setShowDropdown(true)}
          placeholder="Digite para buscar ou selecionar..."
        />
        {showDropdown && (
          <div className="search-dropdown">
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
              <>
                {filteredOptions.slice(0, 15).map((option, index) => (
                  <div
                    key={`${option}-${index}`}
                    className="search-option"
                    onClick={() => {
                      onSelect(option);
                      setShowDropdown(false);
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ===== Helper para renderizar dropdown simples =====
  const renderSelect = (
    name: keyof Filtros,
    label: string
  ) => (
    <div className="form-group" key={name}>
      <label className="field-label">{label}</label>
      <select
        className="form-input"
        value={filtros[name] as string}
        onChange={e => setFiltros(f => ({ ...f, [name]: e.target.value }))}
      >
        <option value="">{t('all')}</option>
        {dropdowns[name]?.map(opt =>
          <option key={opt} value={opt}>{opt}</option>
        )}
      </select>
    </div>
  );

  const formatCurrency = (value: number | null | undefined): string => {
    if (!value) return '-';
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString(language === 'pt-br' ? 'pt-BR' : 'en-US');
    } catch {
      return dateString;
    }
  };

  // ===== Pagination logic =====
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

  // ============ Render =============
  if (!user) return <div className="loading-screen">Carregando...</div>;
  const isAdmin = user.user_type === 'ADMIN';

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
        </div>
        <div className="page-actions">
          <div className="language-selector">
            <button type="button" className={`language-btn ${language === 'pt-br' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('pt-br')}>PT</button>
            <button type="button" className={`language-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en')}>EN</button>
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
        <h2>{t('purchaseRequisitions')}</h2>
        <h2 className="section-title">{t('searchFilters')}</h2>
        <form onSubmit={buscar}>
          <div className="filter-grid">
            {renderDropdownWithSearch("PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER", t('prTmMaster'), prTmMasterSearchValue, filteredPrTmMasterOptions, handlePrTmMasterChange, selectPrTmMasterOption, showPrTmMasterDropdown, setShowPrTmMasterDropdown)}
            {renderDropdownWithSearch("NUMERO_PO", t('numeroPO'), numeroPOSearchValue, filteredNumeroPOOptions, handleNumeroPOChange, selectNumeroPOOption, showNumeroPODropdown, setShowNumeroPODropdown)}
            {renderDropdownWithSearch("DESCRICAO_ITEM_PTB", t('descricaoItemPTB'), descricaoPTBSearchValue, filteredDescricaoPTBOptions, handleDescricaoPTBChange, selectDescricaoPTBOption, showDescricaoPTBDropdown, setShowDescricaoPTBDropdown)}
            {renderDropdownWithSearch("DESCRICAO_ITEM_US", t('descricaoItemUS'), descricaoUSSearchValue, filteredDescricaoUSOptions, handleDescricaoUSChange, selectDescricaoUSOption, showDescricaoUSDropdown, setShowDescricaoUSDropdown)}
            {renderDropdownWithSearch("ID", t('idItem'), idSearchValue, filteredIdOptions, handleIdChange, selectIdOption, showIdDropdown, setShowIdDropdown)}
            {renderDropdownWithSearch("SPN", t('spn'), spnSearchValue, filteredSpnOptions, handleSpnChange, selectSpnOption, showSpnDropdown, setShowSpnDropdown)}

            {renderSelect("STATUS_PR", t('statusPR'))}
            {renderSelect("STATUS_APROVACAO_PO", t('statusAprovacaoPO'))}

            <div className="form-group">
              <label className="field-label">{t('startDate')}</label>
              <input
                type="date"
                className="form-input"
                value={filtros.data_inicio}
                onChange={e => setFiltros(f => ({ ...f, data_inicio: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="field-label">{t('endDate')}</label>
              <input
                type="date"
                className="form-input"
                value={filtros.data_fim}
                onChange={e => setFiltros(f => ({ ...f, data_fim: e.target.value }))}
              />
            </div>
          </div>

          <div className="buttons-container" style={{ marginTop: 12 }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t('searching') : t('search')}
              {loading && <span className="loading-spinner"></span>}
            </button>
            <button type="button" className="btn-secondary" onClick={limparFiltros}>
              {t('clear')}
            </button>
          </div>

          {filterError && (
            <div className="filter-error">
              {filterError}
            </div>
          )}
        </form>


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


              <div className="results-controls-top">
                <div className="entries-selector-requisitions">Show<select
                    className="form-input"
                    value={itemsPerPage}
                    onChange={(e) => {
                      const nextValue = Number(e.target.value) || 10;
                      setItemsPerPage(nextValue);
                      setCurrentPage(1);
                    }}
                    style={{ width: 70, height: 32, padding: '4px 8px' }}
                  >
                    <option value={10}>10</option>
                    <option value={12}>12</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span style={{ fontSize: 13, color: '#073776' }}>entries</span>
                </div>

                {/* Busca por número de registro */}
                <div className="filter-input-search">
                  <div className="form-group" style={{ maxWidth: 260, width: '100%' }}>
                    <label className="field-label"> ®️ Search</label>
                    <input
                      type="number"
                      className="form-input"
                      min={1}
                      max={data.length}
                      placeholder={`1 - ${data.length}`}
                      onBlur={(e) => {
                        const num = Number((e.target as HTMLInputElement).value);
                        if (Number.isFinite(num) && num >= 1 && num <= data.length) {
                          goToPage(Math.ceil(num / itemsPerPage));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const num = Number((e.target as HTMLInputElement).value);
                          if (Number.isFinite(num) && num >= 1 && num <= data.length) {
                            goToPage(Math.ceil(num / itemsPerPage));
                          }
                        }
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    Total encontrado: <strong>{data.length}</strong>
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

              {/* Loading durante troca de página */}
              {loading ? (
                <div className="pagination-loading">
                  <div className="loading-spinner-large"></div>
                  <p>Carregando página {currentPage}...</p>
                </div>
              ) : (
                <>
                  {viewMode === 'cards' ? (
                    <div className="results-grid" style={{ gridTemplateColumns: '1fr' }}>
                      {currentItems.map((row, index) => (
                        <div key={`${row.PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER}-${index}`} className="result-item">
                          <div className="result-header">
                            <div className="result-id">
                              <div className="detail-label">PR TM MASTER</div>
                              <div className="detail-value">#{row.PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER}</div>
                            </div>
                            <div className="result-status">
                              <div className="status-section">
                                <div className="status-mini-title">STATUS APROVAÇÃO</div>
                                <span className="status-badge" style={{ backgroundColor: '#3b82f6' }}>
                                  {row.STATUS_APROVACAO_PO || row.STATUS_PR}
                                </span>
                              </div>
                              {row.PRIORIDADE_COMPRA && (
                                <div className="status-section">
                                  <div className="status-mini-title">PRIORIDADE DE COMPRA</div>
                                  <span className="priority-badge" style={{ backgroundColor: '#f59e0b' }}>
                                    {row.PRIORIDADE_COMPRA}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <details className="result-details-collapsible">
                            <summary className="details-summary">{t('viewDetails')}</summary>
                            <div className="result-details">
                              {/* Seção PR */}
                              <div className="detail-section">
                                <h4 className="section-subtitle">DADOS PR</h4>
                                <div className="detail-item">
                                  <div className="detail-label">{t('unidadeOperacional')}</div>
                                  <div className="detail-value">{row.UNIDADE_OPERACIONAL_PR || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('prOracle')}</div>
                                  <div className="detail-value">{row.PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('numeroLinhaPR')}</div>
                                  <div className="detail-value">{row.NUMERO_LINHA_PR || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('department')}</div>
                                  <div className="detail-value">{row.DEPARTMENT || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('dataNecessariaPR')}</div>
                                  <div className="detail-value">{formatDate(row.DATA_NECESSARIA_PR)}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('codigoItem')}</div>
                                  <div className="detail-value">{row.CODIGO_ITEM_PR || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">SPN</div>
                                  <div className="detail-value">{row.SPN || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">ID</div>
                                  <div className="detail-value">{row.ID || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('descricaoItemPTB')}</div>
                                  <div className="detail-value">{row.DESCRICAO_ITEM_PTB || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('descricaoItemUS')}</div>
                                  <div className="detail-value">{row.DESCRICAO_ITEM_US || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('unidadeMedida')}</div>
                                  <div className="detail-value">{row.UNIDADE_DE_MEDIDA_PR || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('quantidadePR')}</div>
                                  <div className="detail-value">{row.QUANTIDADE_PR || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('quantidadeAtendida')}</div>
                                  <div className="detail-value">{row.QUANTIDADE_ATENDIDA_PR || "-"}</div>
                                </div>
                              </div>

                              {/* Seção PO */}
                              <div className="detail-section">
                                <h4 className="section-subtitle">DADOS PO</h4>
                                <div className="detail-item">
                                  <div className="detail-label">{t('numeroPO')}</div>
                                  <div className="detail-value">{row.NUMERO_PO || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('compradorPO')}</div>
                                  <div className="detail-value">{row.COMPRADOR_PO || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('fornecedor')}</div>
                                  <div className="detail-value">{row.NOME_FORNECEDOR_PO || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('statusAprovacao')}</div>
                                  <div className="detail-value">{row.STATUS_APROVACAO_PO || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('quantidadePO')}</div>
                                  <div className="detail-value">{row.QUANTIDADE_PO || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('moeda')}</div>
                                  <div className="detail-value">{row.MOEDA_PO || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('valorUnitario')}</div>
                                  <div className="detail-value">{formatCurrency(row.VALOR_UNITARIO_PO)}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('totalLinha')}</div>
                                  <div className="detail-value">{formatCurrency(row.TOTAL_LINHA_PO)}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('dataCriacaoPO')}</div>
                                  <div className="detail-value">{formatDate(row.DATA_CRIACAO_PO)}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('dataPrometida')}</div>
                                  <div className="detail-value">{formatDate(row.DATA_PROMETIDA_ORIGINAL_PO_2)}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('quantidadeRecebida')}</div>
                                  <div className="detail-value">{row.QUANTIDADE_RECEBIDA_PO || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('quantidadeAberto')}</div>
                                  <div className="detail-value">{row.QUANTIDADE_EM_ABERTO_PO || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">{t('statusFechamento')}</div>
                                  <div className="detail-value">{row.STATUS_FECHAMENTO_LINHA_PO || "-"}</div>
                                </div>
                              </div>
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="results-table">
                        <thead>
                          <tr>
                            <th style={{ width: '120px' }}>PR TM MASTER</th>
                            <th style={{ width: '80px' }}>{t('unidadeOperacional')}</th>
                            <th style={{ width: '120px' }}>{t('prOracle')}</th>
                            <th style={{ width: '70px' }}>{t('numeroLinhaPR')}</th>
                            <th style={{ width: '100px' }}>{t('department')}</th>
                            <th style={{ width: '80px' }}>{t('prioridade')}</th>
                            <th style={{ width: '90px' }}>{t('dataNecessariaPR')}</th>
                            <th style={{ width: '100px' }}>{t('codigoItem')}</th>
                            <th style={{ width: '100px' }}>SPN</th>
                            <th style={{ width: '80px' }}>ID</th>
                            <th style={{ width: '180px' }}>{t('descricaoItemPTB')}</th>
                            <th style={{ width: '180px' }}>{t('descricaoItemUS')}</th>
                            <th style={{ width: '80px' }}>{t('unidadeMedida')}</th>
                            <th style={{ width: '90px' }}>{t('quantidadePR')}</th>
                            <th style={{ width: '90px' }}>{t('quantidadeAtendida')}</th>
                            <th style={{ width: '100px' }}>{t('statusPrLabel')}</th>
                            <th style={{ width: '90px' }}>{t('dataCriacaoPR')}</th>
                            <th style={{ width: '100px' }}>{t('numeroPO')}</th>
                            <th style={{ width: '100px' }}>{t('compradorPO')}</th>
                            <th style={{ width: '120px' }}>{t('fornecedor')}</th>
                            <th style={{ width: '100px' }}>{t('statusAprovacao')}</th>
                            <th style={{ width: '90px' }}>{t('quantidadePO')}</th>
                            <th style={{ width: '60px' }}>{t('moeda')}</th>
                            <th style={{ width: '100px' }}>{t('valorUnitario')}</th>
                            <th style={{ width: '100px' }}>{t('totalLinha')}</th>
                            <th style={{ width: '90px' }}>{t('dataCriacaoPO')}</th>
                            <th style={{ width: '90px' }}>{t('dataPrometida')}</th>
                            <th style={{ width: '90px' }}>{t('quantidadeRecebida')}</th>
                            <th style={{ width: '90px' }}>{t('quantidadeAberto')}</th>
                            <th style={{ width: '100px' }}>{t('statusFechamento')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.map((row, index) => (
                            <tr key={`${row.PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER}-${index}`}>
                              <td className="pr-column" style={{ width: '120px' }}>{row.PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER}</td>
                              <td style={{ width: '80px' }} title={row.UNIDADE_OPERACIONAL_PR}>{row.UNIDADE_OPERACIONAL_PR || '-'}</td>
                              <td style={{ width: '120px' }} title={row.PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE}>{row.PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE || '-'}</td>
                              <td className="number-column" style={{ width: '70px' }}>{row.NUMERO_LINHA_PR}</td>
                              <td style={{ width: '100px' }} title={row.DEPARTMENT}>{row.DEPARTMENT || '-'}</td>
                              <td style={{ width: '80px' }}>
                                <span className="priority-badge" style={{ backgroundColor: '#f59e0b', padding: '2px 6px', borderRadius: '8px', color: 'white', fontSize: '11px' }}>
                                  {row.PRIORIDADE_COMPRA || '-'}
                                </span>
                              </td>
                              <td className="date-column" style={{ width: '90px' }}>{formatDate(row.DATA_NECESSARIA_PR)}</td>
                              <td style={{ width: '100px' }} title={row.CODIGO_ITEM_PR}>{row.CODIGO_ITEM_PR || '-'}</td>
                              <td className="spn-column" style={{ width: '100px' }}>{row.SPN}</td>
                              <td style={{ width: '80px' }}>{row.ID || '-'}</td>
                              <td className="description-column" style={{ width: '180px' }} title={row.DESCRICAO_ITEM_PTB}>
                                {row.DESCRICAO_ITEM_PTB}
                              </td>
                              <td className="description-column" style={{ width: '180px' }} title={row.DESCRICAO_ITEM_US}>
                                {row.DESCRICAO_ITEM_US || '-'}
                              </td>
                              <td style={{ width: '80px' }}>{row.UNIDADE_DE_MEDIDA_PR || '-'}</td>
                              <td className="quantity-column" style={{ width: '90px' }}>{row.QUANTIDADE_PR}</td>
                              <td className="quantity-column" style={{ width: '90px' }}>{row.QUANTIDADE_ATENDIDA_PR || '-'}</td>
                              <td style={{ width: '100px' }}>
                                <span className="status-badge" style={{ backgroundColor: '#3b82f6', padding: '2px 6px', borderRadius: '8px', color: 'white', fontSize: '11px' }}>
                                  {row.STATUS_PR}
                                </span>
                              </td>
                              <td className="date-column" style={{ width: '90px' }}>{formatDate(row.DATA_CRIACAO_PR)}</td>
                              <td className="po-column" style={{ width: '100px' }}>{row.NUMERO_PO || '-'}</td>
                              <td style={{ width: '100px' }} title={row.COMPRADOR_PO}>{row.COMPRADOR_PO || '-'}</td>
                              <td style={{ width: '120px' }} title={row.NOME_FORNECEDOR_PO}>{row.NOME_FORNECEDOR_PO || '-'}</td>
                              <td style={{ width: '100px' }}>
                                <span className="status-badge" style={{ backgroundColor: '#10b981', padding: '2px 6px', borderRadius: '8px', color: 'white', fontSize: '11px' }}>
                                  {row.STATUS_APROVACAO_PO || '-'}
                                </span>
                              </td>
                              <td className="quantity-column" style={{ width: '90px' }}>{row.QUANTIDADE_PO || '-'}</td>
                              <td style={{ width: '60px' }}>{row.MOEDA_PO || '-'}</td>
                              <td className="value-column" style={{ width: '100px' }}>{formatCurrency(row.VALOR_UNITARIO_PO)}</td>
                              <td className="value-column" style={{ width: '100px' }}>{formatCurrency(row.TOTAL_LINHA_PO)}</td>
                              <td className="date-column" style={{ width: '90px' }}>{formatDate(row.DATA_CRIACAO_PO)}</td>
                              <td className="date-column" style={{ width: '90px' }}>{formatDate(row.DATA_PROMETIDA_ORIGINAL_PO_2)}</td>
                              <td className="quantity-column" style={{ width: '90px' }}>{row.QUANTIDADE_RECEBIDA_PO || '-'}</td>
                              <td className="quantity-column" style={{ width: '90px' }}>{row.QUANTIDADE_EM_ABERTO_PO || '-'}</td>
                              <td style={{ width: '100px' }}>
                                <span className="status-badge" style={{ backgroundColor: '#6b7280', padding: '2px 6px', borderRadius: '8px', color: 'white', fontSize: '11px' }}>
                                  {row.STATUS_FECHAMENTO_LINHA_PO || '-'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ✅ ADICIONAR Controles de paginação no rodapé */}
                  {totalPages > 1 && (
                    <div className="pagination-container" style={{ marginTop: '20px', justifyContent: 'space-between' }}>
                      <button
                        className="pagination-btn"
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                        style={{ 
                          opacity: currentPage === 1 ? 0.5 : 1, 
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer' 
                        }}
                      >
                        « Primeira
                      </button>

                      <button
                        className="pagination-btn"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        style={{ 
                          opacity: currentPage === 1 ? 0.5 : 1, 
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer' 
                        }}
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
                        style={{ 
                          opacity: currentPage === totalPages ? 0.5 : 1, 
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' 
                        }}
                      >
                        Próximo →
                      </button>

                      <button
                        className="pagination-btn"
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                        style={{ 
                          opacity: currentPage === totalPages ? 0.5 : 1, 
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' 
                        }}
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
            </>
          )}
        </section>
      </section>
      <style>{`

      .results-controls-top {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          margin-bottom: 16px;
        }

        .entries-selector-requisitions {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #073776;
          width: 100%;
          padding-top: 110px;
              }
        .page-container {
          padding: 20px 24px;
          background: #f5f7fb;
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .page-title h1, .page-title h2 {
          margin: 0;
          font-weight: 700;
          color: #1f2937;
        }

        .filter-section {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          padding: 20px;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 8px 0 16px;
        }

        .form-input {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: #fff;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .field-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 6px;
          display: inline-block;
        }

        .buttons-container {
          display: flex;
          gap: 8px;
          height: 65px;
        }

        .btn-primary, .btn-secondary {
          border-radius: 8px;
          padding: 10px 14px;
          font-weight: 600;
        }

        .btn-primary {
          background: linear-gradient(90deg, #073776 0%, #4285f4 100%);
          border: 1px solid #2563eb;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .btn-secondary {
          background: #f9fafb;
          color: #374151;
          border: 1px solid #e5e7eb;
        }

        .btn-secondary:hover {
          background: #f3f4f6;
        }

        .results-section {
          background: #ffffff;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .result-item {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 14px;
          background: #fff;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .result-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
        }

        .detail-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .detail-value {
          font-size: 13px;
          color: #111827;
          font-weight: 600;
        }

        .details-summary {
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: #2563eb;
          padding: 3px;
          height: 34px;
        }

        .details-summary:hover {
          text-decoration: underline;
        }

        .pagination-container {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 15px;
          padding: 11px 12px;
          margin-top: 11px;
          height: auto;
          display: flex;
          justify-content: center;
          align-content: space-around;
          align-items: baseline;
          flex-wrap: wrap;
        }

        .pagination-btn {
          border-radius: 8px;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background-color: #f3f4f6;
        }

        .pagination-btn:not(:disabled):hover {
          background-color: #f3f4f6;
          border-color: #2563eb;
        }

        .pagination-number {
          border: 1px solid #e5e7eb;
          background: #fff;
          padding: 6px 10px;
          border-radius: 6px;
          font-weight: 600;
        }

        .pagination-number.active {
          background: #2563eb;
          color: #fff;
          border-color: #2563eb;
        }

        .language-selector .language-btn {
          border-radius: 6px;
          padding: 6px 10px;
          border: 1px solid #e5e7eb;
          background: #fff;
          font-weight: 600;
        }

        .language-selector .language-btn.active {
          background: linear-gradient(90deg, #073776 0%, #4285f4 100%);
        }
      `}</style>

      <style>{`
        .filter-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: start;
          height: 371px;
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
          align-items: stretch;;
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

        .status-badge, .priority-badge {
          padding: 4px 8px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
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
        .pr-column {
          font-weight: 600;
          color: #1f2937;
        }

        .number-column, .quantity-column {
          text-align: right;
          font-weight: 500;
        }

        .value-column {
          text-align: right;
          font-weight: 600;
          color: #059669;
        }

        .date-column {
          text-align: center;
          font-size: 12px;
        }

        .description-column {
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .spn-column, .po-column {
          font-family: 'Courier New', monospace;
          font-size: 12px;
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
}