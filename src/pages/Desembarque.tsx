import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/main.css";
import { useNavigate } from "react-router-dom";
import { useAlert, AlertProvider } from "../components/AlertProvider";

// ===== Interfaces =====
interface User {
  username: string;
  email: string;
  user_type: 'ADMIN' | 'DESEMBARQUE' | 'CONFERENTE' | 'EMBARQUE';
  success: boolean;
}
interface FileOption {
  value: string;
  display: string;
}
interface Filtros {
  arquivo_referencia: string;
  FromVessel_NavioOrigem: string;
  ToVessel_NavioDestino: string;
  FromDepartment_DepartamentoOrigem: string;
  ToDepartment_DepartamentoDestino: string;
  SPN: string;
  ItemDescription_Descricao: string;
  OriginAllocatedPosition: string;
  PRNumberTMMaster_Nome: string;
  OraclePRNumber_Numero: string;
  transfer_status: string;
}
interface Registro {
  id: number;
  FromVessel_NavioOrigem: string;
  ToVessel_NavioDestino: string;
  FromDepartment_DepartamentoOrigem: string;
  ToDepartment_DepartamentoDestino: string;
  SPN: string;
  ItemDescription_Descricao: string;
  OriginAllocatedPosition: string;
  PRNumberTMMaster_Nome: string;
  OraclePRNumber_Numero: string;
  QuantityToBeTransferred?: string;
  TotalAmount_USD_Valor?: string;
  UnitValue_USD_ValorUnitario_USD?: string;
  transfer_status: string;
  arquivo_referencia?: string;
  created?: string;
}
interface UploadStatus {
  total_registros_importados: number;
  ultima_importacao: string;
  status: string;
}
interface NovoRegistroForm {
  FromVessel_NavioOrigem: string;
  ToVessel_NavioDestino: string;
  FromDepartment_DepartamentoOrigem: string;
  ToDepartment_DepartamentoDestino: string;
  SPN: string;
  ItemDescription_DescricaoItem: string;
  OriginAllocatedPosition_PosicaoAlocadaOrigem: string;
  PRNumberTMMaster_NumeroPRTMMaster: string;
  OraclePRNumber_NumeroPROracle: string;
  QuantityToBeTransferred_QuantidadeATransferir: string;
  TotalAmount_USD_ValorTotal_USD: string;
  transfer_status: string;
}

// ====== Constantes iniciais ======
const initialFiltros: Filtros = {
  arquivo_referencia: "",
  FromVessel_NavioOrigem: "",
  ToVessel_NavioDestino: "",
  FromDepartment_DepartamentoOrigem: "",
  ToDepartment_DepartamentoDestino: "",
  SPN: "",
  ItemDescription_Descricao: "",
  OriginAllocatedPosition: "",
  PRNumberTMMaster_Nome: "",
  OraclePRNumber_Numero: "",
  transfer_status: "",
};

const camposForm: { name: keyof NovoRegistroForm; label: string; type: string; isDropdown?: boolean }[] = [
  { name: "FromVessel_NavioOrigem", label: "NAVIO DE ORIGEM", type: "text", isDropdown: true },
  { name: "ToVessel_NavioDestino", label: "NAVIO DE DESTINO", type: "text", isDropdown: true },
  { name: "FromDepartment_DepartamentoOrigem", label: "DEPARTAMENTO ORIGEM", type: "text", isDropdown: true },
  { name: "ToDepartment_DepartamentoDestino", label: "DEPARTAMENTO DESTINO", type: "text", isDropdown: true },
  { name: "SPN", label: "SPN (SPARE PART NUMBER NO TM MASTER)", type: "text" },
  { name: "ItemDescription_DescricaoItem", label: "DESCRIÇÃO DO ITEM", type: "text" },
  { name: "OriginAllocatedPosition_PosicaoAlocadaOrigem", label: "POSIÇÃO ALOCADA", type: "text" },
  { name: "PRNumberTMMaster_NumeroPRTMMaster", label: "PR TM MASTER (REQUISIÇÃO DE COMPRA NO TM MASTER)", type: "text" },
  { name: "OraclePRNumber_NumeroPROracle", label: "PR ORACLE (REQUISIÇÃO DE COMPRA NO ORACLE)", type: "number" },
  { name: "QuantityToBeTransferred_QuantidadeATransferir", label: "QUANTIDADE TRANSFERIDA", type: "number" },
  { name: "TotalAmount_USD_ValorTotal_USD", label: "VALOR TOTAL (USD)", type: "number" },
];

axios.defaults.baseURL = 'http://10.15.3.30:9280';

function DesembarqueInner() {
  // Formata valores numéricos para duas casas decimais sem zeros à esquerda
  const formatCurrencyMask = (val: any) => {
    if (val === null || val === undefined || val === '') return '-';
    // tenta normalizar vírgula para ponto e converter
    const n = Number(String(val).replace(',', '.'));
    if (!isFinite(n)) return '-';
    // Formata com 2 casas decimais, sem zeros à esquerda desnecessários
    return n.toFixed(2);
  };
  // Normaliza string numérica (aceita vírgula ou ponto) e retorna Number com 2 casas decimais
  const parseDecimalToNumber = (val: any): number | null => {
    if (val === null || val === undefined || String(val).trim() === '') return null;
    // aceita número já (number)
    if (typeof val === 'number' && isFinite(val)) {
      return Number(Number(val).toFixed(2));
    }
    // normaliza vírgula para ponto e remove espaços
    const norm = String(val).replace(/\s+/g, '').replace(',', '.');
    // remover quaisquer caracteres não numéricos exceto - and .
    const cleaned = norm.replace(/[^0-9.\-]/g, '');
    const n = Number(cleaned);
    if (!isFinite(n)) return null;
    return Number(n.toFixed(2));
  };

  const [user, setUser] = useState<User | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(initialFiltros);
  const [files, setFiles] = useState<FileOption[]>([]);
  const [filesLimit, setFilesLimit] = useState(10);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [data, setData] = useState<Registro[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('pt-br');
  const [dropdowns, setDropdowns] = useState<Partial<Record<keyof Filtros, string[]>>>({});

  const [spnSearchValue, setSpnSearchValue] = useState("");
  const [descricaoSearchValue, setDescricaoSearchValue] = useState("");
  const [prTmSearchValue, setPrTmSearchValue] = useState("");
  const [prOracleSearchValue, setPrOracleSearchValue] = useState("");
  const [filteredSpnOptions, setFilteredSpnOptions] = useState<string[]>([]);
  const [filteredDescricaoOptions, setFilteredDescricaoOptions] = useState<string[]>([]);
  const [filteredPrTmOptions, setFilteredPrTmOptions] = useState<string[]>([]);
  const [filteredPrOracleOptions, setFilteredPrOracleOptions] = useState<string[]>([]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadMessageType, setUploadMessageType] = useState<'success' | 'error' | ''>('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [duplicatesFileName, setDuplicatesFileName] = useState<string | null>(null);

  // Drag & Drop states
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const [showInsertModal, setShowInsertModal] = useState(false);
  const [novoRegistro, setNovoRegistro] = useState<NovoRegistroForm>({
    FromVessel_NavioOrigem: "",
    ToVessel_NavioDestino: "",
    FromDepartment_DepartamentoOrigem: "",
    ToDepartment_DepartamentoDestino: "",
    SPN: "",
    ItemDescription_DescricaoItem: "",
    OriginAllocatedPosition_PosicaoAlocadaOrigem: "",
    PRNumberTMMaster_NumeroPRTMMaster: "",
    OraclePRNumber_NumeroPROracle: "",
    QuantityToBeTransferred_QuantidadeATransferir: "",
    TotalAmount_USD_ValorTotal_USD: "",
    transfer_status: "",
  });
  const [novoRegistroError, setNovoRegistroError] = useState<string>("");

  // Estados para dropdowns do modal de inserção
  const [modalDropdowns, setModalDropdowns] = useState<{
    vessels: string[];
    departments: string[];
  }>({
    vessels: [],
    departments: [],
  });

  const navigate = useNavigate();
  const showAlert = useAlert();

  // ===== Tradução
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'pt-br': {
        // Filtros e Busca
        'searchFilters': 'Filtros de Busca',
        'referenceFile': 'ARQUIVO DE REFERÊNCIA',
        'selectFile': 'Selecione',
        'search': 'Buscar',
        'clear': 'Limpar',
        'searching': 'Buscando...',
        'selectFileAlert': 'Por favor, selecione um arquivo de referência para realizar a busca.',
        'selectReferenceFile': 'Selecione um Arquivo de Referência',
        'selectFileMessage': 'Para visualizar os registros, primeiro selecione um arquivo de referência.',

        // Labels dos Filtros
        'originVessel': 'NAVIO ORIGEM (A TRANSFERIR)',
        'destinationVessel': 'NAVIO DESTINO (A RECEBER)',
        'originDept': 'DEPARTAMENTO ORIGEM (A ENVIAR)',
        'destinationDept': 'DEPARTAMENTO DESTINO (A RECEBER)',
        'itemDescription': 'DESCRIÇÃO DO ITEM',
        'allocatedPosition': 'POSIÇÃO ALOCADA',
        'prOracle': 'PR ORACLE (REQUISIÇÃO DE COMPRA NO ORACLE)',
        'transferStatus': 'STATUS TRANSFERÊNCIA',
        'requestedQuantity': 'QUANTIDADE SOLICITADA PARA TRANSFERÊNCIA',
        'unitValue': 'VALOR UNITÁRIO (USD)',
        'totalValue': 'VALOR TOTAL (USD)',
        'all': 'Todos',

        // Resultados
        'searchResults': 'Resultados da Busca',
        'recordsFound': 'registro(s) encontrado(s)',
        'selectedReferenceFile': 'Arquivo de referência selecionado',
        'noRecordsFound': 'Nenhum registro encontrado para o arquivo selecionado.',
        'tryDifferentFile': 'Tente selecionar um arquivo diferente ou ajustar os filtros.',

        // Arquivos
        'availableFiles': 'Arquivos disponíveis no sistema:',
        'filesAvailable': 'arquivo(s) disponível(eis) no sistema',
        'noAvailableFiles': 'Nenhum arquivo disponível no sistema.',

        // Upload
        'uploadExcel': 'Upload Excel',
        'uploadTitle': 'Upload de Arquivo Excel',
        'uploadInstructions': 'Arraste um arquivo Excel aqui ou clique para selecionar',
        'uploadButton': 'Fazer Upload',

        // Ações
        'cancel': 'Cancelar',
        'close': 'Fechar',
        'transfer': 'CONFERIR',
        'backToMenu': 'Voltar ao Menu'
      },
      'en': {
        'backToMenu': 'Back to Menu',
        // Filtros e Busca
        'searchFilters': 'Search Filters',
        'referenceFile': 'REFERENCE FILE',
        'selectFile': 'Select',
        'search': 'Search',
        'clear': 'Clear',
        'searching': 'Searching...',
        'selectFileAlert': 'Please select a reference file to perform the search.',
        'selectReferenceFile': 'Select a Reference File',
        'selectFileMessage': 'To view records, first select a reference file.',

        // Labels dos Filtros
        'originVessel': 'ORIGIN VESSEL (TO BE TRANSFERRED)',
        'destinationVessel': 'DESTINATION VESSEL (TO BE RECEIVED)',
        'originDept': 'ORIGIN DEPARTMENT (TO BE SENT)',
        'destinationDept': 'DESTINATION DEPARTMENT (TO BE RECEIVED)',
        'itemDescription': 'ITEM DESCRIPTION',
        'allocatedPosition': 'ALLOCATED POSITION',
        'prOracle': 'PR ORACLE (PURCHASE REQUEST IN ORACLE)',
        'transferStatus': 'TRANSFER STATUS',
        'requestedQuantity': 'REQUESTED QUANTITY FOR TRANSFER',
        'unitValue': 'UNIT VALUE (USD)',
        'totalValue': 'TOTAL VALUE (USD)',
        'all': 'All',

        // Resultados
        'searchResults': 'Search Results',
        'recordsFound': 'record(s) found',
        'selectedReferenceFile': 'Selected reference file',
        'noRecordsFound': 'No records found for the selected file.',
        'tryDifferentFile': 'Try selecting a different file or adjusting the filters.',

        // Arquivos
        'availableFiles': 'Available files in the system:',
        'filesAvailable': 'file(s) available in the system',
        'noAvailableFiles': 'No files available in the system.',

        // Upload
        'uploadExcel': 'Upload Excel',
        'uploadTitle': 'Excel File Upload',
        'uploadInstructions': 'Drag an Excel file here or click to select',
        'uploadButton': 'Upload',

        // Ações
        'cancel': 'Cancel',
        'close': 'Close',
        'transfer': 'PROCESS'
      }

    };

    return translations[language]?.[key] || key;
  };

  // ===== Filtros inteligentes =====
  const filterOptions = (searchValue: string, options: string[]): string[] => {
    if (!searchValue.trim()) return options;

    // Filtrar apenas valores válidos antes de aplicar o filtro
    const validOptions = options.filter(option =>
      option && typeof option === 'string' && option.trim() !== ''
    );

    return validOptions.filter(option =>
      option.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  useEffect(() => {
    // Garantir que dropdowns.SPN seja um array válido
    const spnOptions = Array.isArray(dropdowns.SPN) ? dropdowns.SPN : [];
    setFilteredSpnOptions(filterOptions(spnSearchValue, spnOptions));
  }, [spnSearchValue, dropdowns.SPN]);

  useEffect(() => {
    // Garantir que dropdowns.ItemDescription_Descricao seja um array válido  
    const descricaoOptions = Array.isArray(dropdowns.ItemDescription_Descricao) ? dropdowns.ItemDescription_Descricao : [];
    setFilteredDescricaoOptions(filterOptions(descricaoSearchValue, descricaoOptions));
  }, [descricaoSearchValue, dropdowns.ItemDescription_Descricao]);

  useEffect(() => {
    // Garantir que dropdowns.PRNumberTMMaster_Nome seja um array válido
    const prTmOptions = Array.isArray(dropdowns.PRNumberTMMaster_Nome) ? dropdowns.PRNumberTMMaster_Nome : [];
    setFilteredPrTmOptions(filterOptions(prTmSearchValue, prTmOptions));
  }, [prTmSearchValue, dropdowns.PRNumberTMMaster_Nome]);

  useEffect(() => {
    // Garantir que dropdowns.OraclePRNumber_Numero seja um array válido
    const prOracleOptions = Array.isArray(dropdowns.OraclePRNumber_Numero) ? dropdowns.OraclePRNumber_Numero : [];
    setFilteredPrOracleOptions(filterOptions(prOracleSearchValue, prOracleOptions));
  }, [prOracleSearchValue, dropdowns.OraclePRNumber_Numero]);

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

  const handlePrOracleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrOracleSearchValue(value);
    setFiltros(f => ({ ...f, OraclePRNumber_NumeroPROracle: value }));
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

  const selectPrOracleOption = (option: string) => {
    setPrOracleSearchValue(option);
    setFiltros(f => ({ ...f, OraclePRNumber_NumeroPROracle: option }));
  };


  // ===== Prevenir comportamento padrão do navegador para drag & drop globalmente =====
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleBodyDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleBodyDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleBodyDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Adicionar event listeners globais
    document.addEventListener('dragenter', handleBodyDragEnter);
    document.addEventListener('dragover', handleBodyDragOver);
    document.addEventListener('drop', handleBodyDrop);

    return () => {
      document.removeEventListener('dragenter', handleBodyDragEnter);
      document.removeEventListener('dragover', handleBodyDragOver);
      document.removeEventListener('drop', handleBodyDrop);
    };
  }, []);

  // ===== Usuário & inicialização =====
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { 
        const userData = JSON.parse(userStr);
        console.log('👤 Dados do usuário no localStorage:', userData);
        
        // Verificar grupos e corrigir user_type se necessário
        if (userData.user_type !== 'ADMIN' && userData.groups && Array.isArray(userData.groups)) {
          if (userData.groups.includes('SHQ-TRANSFERPLUS_CONFERENTE')) {
            userData.user_type = 'CONFERENTE';
            console.log('✅ user_type corrigido para CONFERENTE baseado nos grupos');
          } else if (userData.groups.includes('SHQ-TRANSFERPLUS_DESEMBARQUE')) {
            userData.user_type = 'DESEMBARQUE';
            console.log('✅ user_type corrigido para DESEMBARQUE baseado nos grupos');
          } else if (userData.groups.includes('SHQ-TRANSFERPLUS_EMBARQUE')) {
            userData.user_type = 'EMBARQUE';
            console.log('✅ user_type corrigido para EMBARQUE baseado nos grupos');
          }
          // Atualizar localStorage com o tipo correto
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        console.log('🔑 Tipo de usuário:', userData.user_type);
        setUser(userData);
      } catch { }
    }
  }, []);
  useEffect(() => { if (user) { fetchAvailableFiles(); fetchUploadStatus(); fetchDropdowns(); } }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [data, itemsPerPage]);

  // ===== Dropdowns Dinâmicos (Novo método)
  const fetchDropdowns = async () => {
    try {
      const res = await axios.get("/api/desembarque/filtros", {
        headers: { 'x-user-name': user?.username, 'x-user-type': user?.user_type }
      });
      if (res.data?.filtros) setDropdowns(res.data.filtros);
    } catch { setDropdowns({}); }
  };

  // ===== Carregar dropdowns para o modal de inserção =====
  const fetchModalDropdowns = async () => {
    try {
      const [vesselsRes, departmentsRes] = await Promise.all([
        axios.get("/api/vessels", {
          headers: { 'x-user-name': user?.username, 'x-user-type': user?.user_type }
        }),
        axios.get("/api/departments", {
          headers: { 'x-user-name': user?.username, 'x-user-type': user?.user_type }
        })
      ]);

      setModalDropdowns({
        vessels: vesselsRes.data?.data || [],
        departments: departmentsRes.data?.data || [],
      });
    } catch (error) {
      console.error('Erro ao carregar dropdowns do modal:', error);
      setModalDropdowns({
        vessels: [],
        departments: [],
      });
    }
  };

  // ===== Arquivos
  const fetchAvailableFiles = async () => {
    try {
      const res = await axios.get("/api/desembarque/files", {
        headers: { 'x-user-name': user?.username, 'x-user-type': user?.user_type }
      });
      const rawFiles = res.data.files || [];
      const rawDates = res.data.dates || [];
      const formattedFiles: FileOption[] = [
        ...rawFiles.map((entry: any) => ({ value: entry.value, display: entry.display })),
        ...rawDates.map((entry: any) => ({ value: `PRNumberTMMaster_NumeroPRTMMaster:${entry.value}`, display: `PR: ${entry.display}` }))
      ];
      setFiles(formattedFiles);
    } catch { setFiles([]); }
  };

  // ===== Upload Status
  const fetchUploadStatus = async (arquivo_referencia?: string) => {
    try {
      const params: any = {};
      if (arquivo_referencia) params.arquivo_referencia = arquivo_referencia;
      const res = await axios.get("/api/desembarque/status", {
        params,
        headers: { 'x-user-name': user?.username, 'x-user-type': user?.user_type }
      });
      if (res.data.status === "success" && res.data.data) {
        setUploadStatus({
          total_registros_importados: res.data.data.total_registros,
          ultima_importacao: res.data.data.ultima_importacao || '',
          status: 'success',
        });
      }
    } catch { }
  };

  // ===== Buscar dados =====
  const buscar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Se não houver arquivo de referência, retornar silenciosamente (não mostrar erro)
    if (!filtros.arquivo_referencia) {
      return;
    }
    setLoading(true);
    try {
      let params = Object.fromEntries(Object.entries(filtros).filter(([_, v]) => v));
      if (filtros.arquivo_referencia.startsWith('PRNumberTMMaster_NumeroPRTMMaster:')) {
        // Extrai a data do valor
        const createdDate = filtros.arquivo_referencia.replace('PRNumberTMMaster_NumeroPRTMMaster:', '').trim();
        // Remove arquivo_referencia do filtro
        delete params.arquivo_referencia;
        params['PRNumberTMMaster_NumeroPRTMMaster'] = createdDate;
      }
      const res = await axios.get("/api/desembarque", {
        params,
        headers: { 'x-user-name': user?.username, 'x-user-type': user?.user_type }
      });
      setData(res.data.data || []);
      // Atualizar o status de upload para o arquivo selecionado (mostra total importado)
      if (params.arquivo_referencia) {
        await fetchUploadStatus(params.arquivo_referencia as string);
      }
    } catch { setData([]); }
    setLoading(false);
  };

  // ===== Drag & Drop Functions =====
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter - 1 === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleFileValidationAndSelection(file);
    }
  };

  // ===== Validação e seleção de arquivo (usado tanto para drag & drop quanto para click) =====
  const handleFileValidationAndSelection = (file: File) => {
    const validExtensions = ['.xlsx', '.xlsb', '.xls'];
    const fileName = file.name.toLowerCase();

    if (!validExtensions.some(ext => fileName.endsWith(ext))) {
      setUploadMessage(`Arquivo deve ter uma das extensões: ${validExtensions.join(', ')}`);
      setUploadMessageType('error');
      setSelectedFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadMessage('Arquivo muito grande. Máximo 50MB permitido.');
      setUploadMessageType('error');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadMessage('');
    setUploadMessageType('');
  };

  // ===== Upload Excel =====
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileValidationAndSelection(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('Selecione um arquivo primeiro');
      setUploadMessageType('error');
      return;
    }
    setUploading(true);
    setUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('arquivo_excel', selectedFile);
      const res = await axios.post("/api/desembarque/upload", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-user-name': user?.username,
          'x-user-type': user?.user_type
        }
      });

      if (res.data.status === 'success') {
        setUploadMessage(`✅ ${res.data.message}`);
        setUploadMessageType('success');
        setSelectedFile(null);
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        await fetchUploadStatus();
        await fetchAvailableFiles();

        // If backend returned a duplicates file, keep modal open and show download button
        if (res.data.duplicates_file) {
          setDuplicatesFileName(res.data.duplicates_file);
        } else {
          // fechar modal automaticamente quando não houver duplicados
          setTimeout(() => {
            setShowUploadModal(false);
            setUploadMessage('');
            setUploadMessageType('');
          }, 2000);
        }
      } else {
        setUploadMessage(`❌ ${res.data.message}`);
        setUploadMessageType('error');
      }
    } catch (err: any) {
      setUploadMessage(`❌ Erro no upload: ${err.response?.data?.message || err.message}`);
      setUploadMessageType('error');
    }
    setUploading(false);
  };

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const goToPage = (page: number) => setCurrentPage(Math.min(totalPages, Math.max(1, page)));

  // ===== Outros handlers =====
  const limparFiltros = () => {
    setFiltros(initialFiltros);
    setData([]);
    setSpnSearchValue("");
    setDescricaoSearchValue("");
    setPrTmSearchValue("");
    setPrOracleSearchValue("");
  };
  const handleLanguageChange = (newLanguage: string) => { setLanguage(newLanguage); };
  
  const toggleShowAllFiles = () => {
    setShowAllFiles(prev => !prev);
  };
  
  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setUploadMessage('');
    setUploadMessageType('');
    setIsDragging(false);
    setDragCounter(0);
    setDuplicatesFileName(null);
  };

  // ============ Modal de Inserção Individual ============
  const openInsertModal = async () => {
    setNovoRegistro({
      FromVessel_NavioOrigem: "",
      ToVessel_NavioDestino: "",
      FromDepartment_DepartamentoOrigem: "",
      ToDepartment_DepartamentoDestino: "",
      SPN: "",
      ItemDescription_DescricaoItem: "",
      OriginAllocatedPosition_PosicaoAlocadaOrigem: "",
      PRNumberTMMaster_NumeroPRTMMaster: "",
      OraclePRNumber_NumeroPROracle: "",
      QuantityToBeTransferred_QuantidadeATransferir: "",
      TotalAmount_USD_ValorTotal_USD: "",
      transfer_status: "Aguardando desembarque",
    });
    setNovoRegistroError("");
    setShowInsertModal(true);
    await fetchModalDropdowns();
  };

  const closeInsertModal = () => {
    setShowInsertModal(false);
    setNovoRegistroError("");
  };

  const alertIsertStatus = () => {
  };

  const handleNovoRegistroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    // TRAVA: Oracle PR deve aceitar apenas dígitos inteiros
    if (name === 'OraclePRNumber_NumeroPROracle') {
      const digits = value.replace(/\D/g, '');
      setNovoRegistro((prev) => ({ ...prev, [name]: digits }));
      return;
    }

    // Máscara automática para campo de valor total
    if (name === 'TotalAmount_USD_ValorTotal_USD') {
      const digitsOnly = value.replace(/\D/g, '');
      if (!digitsOnly) {
        setNovoRegistro((prev) => ({ ...prev, [name]: '' }));
        return;
      }
      let num = digitsOnly;
      if (num.length === 1) num = '00' + num;
      if (num.length === 2) num = '0' + num;
      const intPart = num.slice(0, -2);
      const decPart = num.slice(-2);
      const intPartClean = intPart.replace(/^0+/, '') || '0';
      const masked = `${intPartClean}.${decPart}`;
      setNovoRegistro((prev) => ({ ...prev, [name]: masked }));
      return;
    }

    setNovoRegistro((prev) => ({ ...prev, [name]: value }));
  };

  // Ao perder foco, formatar os valores numéricos com 2 casas (mascarar/travar)
  const handleNumericBlur = (fieldName: keyof NovoRegistroForm) => {
    const raw = novoRegistro[fieldName] as any;
    const parsed = parseDecimalToNumber(raw);
    if (parsed === null) {
      // limpa valor inválido
      setNovoRegistro(prev => ({ ...prev, [fieldName]: '' }));
    } else {
      // manter como string formatada (ex: 0000.00 ou 12.34)
      setNovoRegistro(prev => ({ ...prev, [fieldName]: parsed.toFixed(2) }));
    }
  };

  const handleInsertSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setNovoRegistroError("");

    for (const campo of camposForm) {
      if (!novoRegistro[campo.name] || (typeof novoRegistro[campo.name] === "string" && !novoRegistro[campo.name].trim())) {
        setNovoRegistroError(`Campo obrigatório: ${campo.label}`);
        return;
      }
    }

    // validar e converter valores decimais para Number (duas casas decimais)
    const totalValueNum = parseDecimalToNumber(novoRegistro.TotalAmount_USD_ValorTotal_USD);

    if (totalValueNum === null) {
      setNovoRegistroError('Valor Total inválido. Use apenas números e separador "." ou ","');
      return;
    }

    const MAX_DECIMAL_19_2 = Number('9'.repeat(17));
    if (Math.abs(totalValueNum) > MAX_DECIMAL_19_2) {
      setNovoRegistroError('Valor Total excede o limite permitido para DECIMAL(19,2).');
      return;
    }

    // Oracle PR deve ser inteiro (campo tipo number). Validar
    const oraclePRRaw = novoRegistro.OraclePRNumber_NumeroPROracle;
    if (!/^[0-9]+$/.test(String(oraclePRRaw))) {
      setNovoRegistroError('PR Oracle inválido. Deve ser um número inteiro.');
      return;
    }
    const oraclePRInt = parseInt(String(oraclePRRaw), 10);

    // SPN deve ser inteiro
    const spnRaw = novoRegistro.SPN;
    if (!/^[0-9]+$/.test(String(spnRaw))) {
      setNovoRegistroError('SPN inválido. Deve ser um número inteiro.');
      return;
    }
    const spnInt = parseInt(String(spnRaw), 10);

    // Quantidade deve ser inteiro
    const qtyRaw = novoRegistro.QuantityToBeTransferred_QuantidadeATransferir;
    if (!/^[0-9]+$/.test(String(qtyRaw))) {
      setNovoRegistroError('Quantidade inválida. Deve ser um número inteiro.');
      return;
    }
    const qtyInt = parseInt(String(qtyRaw), 10);

    // Calcular valor unitário automaticamente
    const unitValue = qtyInt > 0 ? totalValueNum / qtyInt : 0;

    // Mapear para novos nomes de campos da tabela SQL
    const payload = {
      IdBusinessIntelligence: "", // Pode ser gerado automaticamente ou deixado vazio
      FromVessel_NavioOrigem: novoRegistro.FromVessel_NavioOrigem,
      ToVessel_NavioDestino: novoRegistro.ToVessel_NavioDestino,
      FromDepartment_DepartamentoOrigem: novoRegistro.FromDepartment_DepartamentoOrigem,
      ToDepartment_DepartamentoDestino: novoRegistro.ToDepartment_DepartamentoDestino,
      SPN: spnInt,
      ItemDescription_Descricao: novoRegistro.ItemDescription_DescricaoItem,
      OriginAllocatedPosition: novoRegistro.OriginAllocatedPosition_PosicaoAlocadaOrigem,
      OraclePRNumber_Numero: oraclePRInt,
      PRNumberTMMaster_Nome: novoRegistro.PRNumberTMMaster_NumeroPRTMMaster,
      QuantityToBeTransferred: qtyInt,
      TotalAmount_USD_Valor: Number(totalValueNum.toFixed(2)),
      UnitValue_USD_ValorUnitario_USD: Number(unitValue.toFixed(2)),
      transfer_status: novoRegistro.transfer_status || "Aguardando desembarque",
      Created: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    // após criar payload, tentar inserir
    await insertRecord(payload);
  };

  // estado para controlar quando está salvando (desabilita botão e altera label)
  const [saving, setSaving] = useState(false);

  // função para inserir registro no backend
  const insertRecord = async (payload: any) => {
    try {
      const res = await axios.post("/api/desembarque/inserir", payload, {
        headers: { "x-user-name": user?.username, "x-user-type": user?.user_type }
      });

      if (res.data.status === "success") {
        setShowInsertModal(false);
        setNovoRegistroError("");
        // Alerta de sucesso no topo da página
        showAlert("Registro criado com sucesso!", "success");
        // Recarregar dados automaticamente após inserir
        if (filtros.arquivo_referencia) {
          await buscar();
        } else {
          // Se não houver arquivo selecionado, recarregar a lista de arquivos disponíveis
          await fetchAvailableFiles();
        }
        return { success: true };
      } else {
        const errorMsg = res.data.message || "Erro desconhecido ao inserir registro.";
        setNovoRegistroError(errorMsg);
        showAlert(`❌ ${errorMsg}`, "error");
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Erro ao inserir registro.";
      setNovoRegistroError(errorMsg);
      showAlert(`❌ ${errorMsg}`, "error");
      throw err;
    }
  };

  // handler para o clique no botão SALVAR — mostra feedback imediato (desabilita botão)
  const handleSaveClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // prevenir submit duplo
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setNovoRegistroError("");
    try {
      // chama a mesma rotina de submit (sem evento)
      await handleInsertSubmit();
    } catch (err: any) {
      // erro já foi tratado em insertRecord, apenas garantir que saving seja resetado
      console.error('Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  };

  // ============ Render =============
  if (!user) return <div className="loading-screen">🔄 Carregando...</div>;
  
  // Apenas ADMIN e DESEMBARQUE podem acessar esta página
  const allowedTypes = ['ADMIN', 'DESEMBARQUE'];
  if (!allowedTypes.includes(user.user_type)) {
    return (
      <div className="loading-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <h2>🚫 Acesso Negado</h2>
        <p>Você não tem permissão para acessar a página de Desembarque.</p>
        <button className="btn-primary" onClick={() => navigate('/menu')}>🏠 Voltar ao Menu</button>
      </div>
    );
  }
  
  const isAdmin = user.user_type === 'ADMIN';
  const selectedReferenceFile = files.find(f => f.value === filtros.arquivo_referencia);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <h1>🚢 Desembarque</h1>
          {isAdmin && <span className="admin-badge">Administrator</span>}
        </div>
        <div className="page-actions">

          <div className="language-selector">
            <button type="button" className={`language-btn ${language === 'pt-br' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('pt-br')}>🇧🇷 PT</button>
            <button type="button" className={`language-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en')}>🇺🇸 EN</button>
          </div>
          {isAdmin && (
            <button className="btn-upload" onClick={() => setShowUploadModal(true)} title={t('uploadExcel')}>
              📤 {t('uploadExcel')}
            </button>
          )}
          <button
            className="btn-secondary"
            onClick={() => navigate('/menu')}
            title={t('backToMenu')}
          >

            🏠 {t('backToMenu')}
          </button>
        </div>
      </div>

      {isAdmin && uploadStatus && (
        <div className="upload-status-bar">
          <span>📊 {typeof uploadStatus.total_registros_importados === 'number'
            ? uploadStatus.total_registros_importados.toLocaleString()
            : '0'} registros importados</span>
          <span>🕐 Última importação: {uploadStatus.ultima_importacao}</span>
        </div>
      )}

      {/* Container para os 3 botões principais */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '18px',
        marginTop: '4%',
        flexWrap: 'nowrap',
        width: '100%'
      }}>
        {/* Botão esquerdo */}
        <div>
          {isAdmin && (
            <button className="btn-primary" onClick={openInsertModal}>
              ➕ ADICIONAR REGISTRO
            </button>
          )}
        </div>

        {/* Botões direita */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button type="submit" className="btn-primary" disabled={loading} onClick={(e) => buscar(e)}>
            {loading ? `🔄 ${t('searching')}` : `🔍 ${t('search')}`}
            {loading && <span className="loading-spinner"></span>}
          </button>
          <button type="button" className="btn-secondary" onClick={limparFiltros}>
            🗑️ {t('clear')}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <section className="filter-section">
        <h2 className="section-title">🔍 {t('searchFilters')}</h2>
        <form onSubmit={buscar}>
          {/* Arquivo de Referência - linha própria */}
          <div className="filter-reference-date">
            <div className="form-group">
              <label className="field-label required">📄 {t('referenceFile')} *</label>
              <select name="arquivo_referencia" className="form-input" required value={filtros.arquivo_referencia}
                onChange={e => setFiltros(f => ({ ...f, arquivo_referencia: e.target.value }))}>
                <option value="">{t('selectFile')}</option>
                {files.length > 0
                  ? (showAllFiles ? files : files.slice(0, filesLimit)).map(file => (
                    <option key={file.value} value={file.value}>{file.display}</option>
                  ))
                  : <option value="">Nenhum arquivo ou data disponível</option>
                }
              </select>
              <div className="dropdown-info-container">
                <div className="dropdown-info">
                  {files.length > 0
                    ? <>📊 Exibindo {showAllFiles ? files.length : Math.min(filesLimit, files.length)} de {files.length} opções</>
                    : <>Nenhum arquivo ou data disponível.</>
                  }
                </div>
                {files.length > filesLimit && (
                  <button
                    type="button" 
                    className="btn-show-more"
                    onClick={toggleShowAllFiles}
                  >
                    {showAllFiles ? '🔼 Mostrar menos' : '👁️ Ver todos os arquivos'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filtros organizados - grid principal */}
          <div className="filter-grid">
            {/* Primeira linha */}
            <div className="form-group">
              <div className="label-wrapper">
                <label className="field-label">🚢 {t('originVessel')}</label>
              </div>
              <select className="form-input" value={filtros.FromVessel_NavioOrigem}
                onChange={e => setFiltros(f => ({ ...f, FromVessel_NavioOrigem: e.target.value }))}>
                <option value="">{t('all')}</option>
                {(dropdowns.FromVessel_NavioOrigem || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <div className="label-wrapper">
                <label className="field-label">🏢 {t('originDept')}</label>
              </div>
              <select className="form-input" value={filtros.FromDepartment_DepartamentoOrigem}
                onChange={e => setFiltros(f => ({ ...f, FromDepartment_DepartamentoOrigem: e.target.value }))}>
                <option value="">{t('all')}</option>
                {(dropdowns.FromDepartment_DepartamentoOrigem || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {/* Segunda linha */}
            <div className="form-group">
              <div className="label-wrapper">
                <label className="field-label">🎯 {t('destinationVessel')}</label>
              </div>
              <select className="form-input" value={filtros.ToVessel_NavioDestino}
                onChange={e => setFiltros(f => ({ ...f, ToVessel_NavioDestino: e.target.value }))}>
                <option value="">{t('all')}</option>
                {(dropdowns.ToVessel_NavioDestino || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <div className="label-wrapper">
                <label className="field-label">🏢 {t('destinationDept')}</label>
              </div>
              <select className="form-input" value={filtros.ToDepartment_DepartamentoDestino}
                onChange={e => setFiltros(f => ({ ...f, ToDepartment_DepartamentoDestino: e.target.value }))}>
                <option value="">{t('all')}</option>
                {(dropdowns.ToDepartment_DepartamentoDestino || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {/* Terceira linha */}
            <div className="form-group">
              <div className="label-wrapper">
                <label className="field-label">🔢 SPN (SPARE PART NUMBER NO TM MASTER)</label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  value={spnSearchValue}
                  onChange={handleSpnChange}
                  placeholder="Digite para buscar..."
                />
                {spnSearchValue && filteredSpnOptions.length > 0 && (
                  <div className="search-dropdown">
                    {filteredSpnOptions.slice(0, 10).map((option, index) => (
                      <div
                        key={`${option}-${index}`}
                        className="search-option"
                        onClick={() => selectSpnOption(option)}
                      >
                        {String(option)}
                      </div>
                    ))}
                    {filteredSpnOptions.length > 10 && (
                      <div className="search-more">
                        +{filteredSpnOptions.length - 10} mais opções...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <div className="label-wrapper">
                <label className="field-label">📦 {t('itemDescription')}</label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  value={descricaoSearchValue}
                  onChange={handleDescricaoChange}
                  placeholder="Digite para buscar..."
                />
                {descricaoSearchValue && filteredDescricaoOptions.length > 0 && (
                  <div className="search-dropdown">
                    {filteredDescricaoOptions.slice(0, 10).map((option, index) => (
                      <div
                        key={`${option}-${index}`}
                        className="search-option"
                        onClick={() => selectDescricaoOption(option)}
                      >
                        {String(option)}
                      </div>
                    ))}
                    {filteredDescricaoOptions.length > 10 && (
                      <div className="search-more">
                        +{filteredDescricaoOptions.length - 10} mais opções...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quarta linha */}
            <div className="form-group">
              <div className="label-wrapper">
                <label className="field-label">📋 PR TM MASTER (REQUISIÇÃO DE COMPRA NO TM MASTER)</label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  value={prTmSearchValue}
                  onChange={handlePrTmChange}
                  placeholder="Digite para buscar..."
                />
                {prTmSearchValue && filteredPrTmOptions.length > 0 && (
                  <div className="search-dropdown">
                    {filteredPrTmOptions.slice(0, 10).map((option, index) => (
                      <div
                        key={`${option}-${index}`}
                        className="search-option"
                        onClick={() => selectPrTmOption(option)}
                      >
                        {String(option)}
                      </div>
                    ))}
                    {filteredPrTmOptions.length > 10 && (
                      <div className="search-more">
                        +{filteredPrTmOptions.length - 10} mais opções...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <div className="label-wrapper">
                <label className="field-label">📍 {t('allocatedPosition')}</label>
              </div>
              <select className="form-input" value={filtros.OriginAllocatedPosition}
                onChange={e => setFiltros(f => ({ ...f, OriginAllocatedPosition: e.target.value }))}>
                <option value="">{t('all')}</option>
                {(dropdowns.OriginAllocatedPosition || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {/* Quinta linha */}
            <div className="form-group">
              <div className="label-wrapper">
                <label className="field-label">🔷 {t('prOracle')}</label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  value={prOracleSearchValue}
                  onChange={handlePrOracleChange}
                  placeholder="Digite para buscar..."
                />
                {prOracleSearchValue && filteredPrOracleOptions.length > 0 && (
                  <div className="search-dropdown">
                    {filteredPrOracleOptions.slice(0, 10).map((option, index) => (
                      <div
                        key={`${option}-${index}`}
                        className="search-option"
                        onClick={() => selectPrOracleOption(option)}
                      >
                        {String(option)}
                      </div>
                    ))}
                    {filteredPrOracleOptions.length > 10 && (
                      <div className="search-more">
                        +{filteredPrOracleOptions.length - 10} mais opções...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* STATUS centralizado */}
            <div className="form-group status-field">
              <div className="label-wrapper">
                <label className="field-label">{t('transferStatus')}</label>
              </div>
              <select className="form-input" value={filtros.transfer_status}
                onChange={e => setFiltros(f => ({ ...f, transfer_status: e.target.value }))}>
                <option value="">{t('all')}</option>
                {(dropdowns.transfer_status || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </form>

        {/* Resultados */}
        <section className={`results-section ${loading ? 'loading' : ''}`}>
          <h2 className="section-title">
            📊 {t('searchResults')}
            {filtros.arquivo_referencia && (
              <span className="results-count">
                (<strong>{data.length}</strong> {t('recordsFound')})
              </span>
            )}
          </h2>
          {filtros.arquivo_referencia ? (
            <React.Fragment>
              <div className="date-info">
                <strong>� PR TM MASTER:</strong> {filtros.PRNumberTMMaster_Nome || selectedReferenceFile?.display}
              </div>
              <div className="results-controls">
                <div className="entries-selector">Show<select
                    className="form-input"
                    value={itemsPerPage}
                    onChange={(e) => {
                      const nextValue = Number(e.target.value);
                      if (!Number.isFinite(nextValue) || nextValue <= 0) return;
                      setItemsPerPage(nextValue);
                      setCurrentPage(1);
                    }}
                    style={{ width: 70, height: 32, padding: "4px 8px" }}
                  >
                    <option value={10}>10</option>
                    <option value={12}>12</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span style={{ fontSize: 13, color: "#073776" }}>entries</span>
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
                <div className="pagination-container" style={{ marginBottom: '20px', justifyContent: 'space-between' }}>
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
                    ⏮ Anterior
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
                    Próximo ⏭
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

              {/* Loading durante troca de página */}
              {loading ? (
                <div className="pagination-loading">
                  <div className="loading-spinner-large"></div>
                  <p>Carregando página {currentPage}...</p>
                </div>
              ) : (
                <div className="results-grid">
                  {paginatedData.length > 0 ? (
                    paginatedData.map(row => (
                      <div key={row.id} className="result-item">
                        <div className="result-header">
                          <div className="result-id">
                            <div className="detail-label">ID</div>
                            <div className="detail-value">#{row.id}</div>
                          </div>
                          <button type="button" className="transfer-btn"
                            onClick={() => navigate("/Desembarque_transfer", {
                              state: {
                                ...row,
                                username: user.username,
                              }
                            })}
                          >
                            📤 {t("transfer")}
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
                            <div className="detail-label">🏢 {t('originDept')}</div>
                            <div className="detail-value">{row.FromDepartment_DepartamentoOrigem}</div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-label">🏢 {t('destinationDept')}</div>
                            <div className="detail-value">{row.ToDepartment_DepartamentoDestino}</div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-label">📦 {t('itemDescription')}</div>
                            <div className="detail-value">{row.ItemDescription_Descricao}</div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-label">🔢 SPN (SPARE PART NUMBER NO TM MASTER)</div>
                            <div className="detail-value">{row.SPN}</div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-label">📍 {t('allocatedPosition')}</div>
                            <div className="detail-value">{row.OriginAllocatedPosition}</div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-label">📋 PR TM MASTER (REQUISIÇÃO DE COMPRA NO TM MASTER)</div>
                            <div className="detail-value">{row.PRNumberTMMaster_Nome}</div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-label">🔷 {t('prOracle')}</div>
                            <div className="detail-value">{row.OraclePRNumber_Numero}</div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-label">.{t('transferStatus')}</div>
                            <div className="detail-value">{row.transfer_status || 'Aguardando desembarque'}</div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-label">💵 {t('unitValue')}</div>
                            <div className="detail-value">{formatCurrencyMask(row.UnitValue_USD_ValorUnitario_USD)}</div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-label">💲 {t('totalValue')}</div>
                            <div className="detail-value">
                              {formatCurrencyMask(row.TotalAmount_USD_Valor)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-results">
                      <p>📭 {t('noRecordsFound')}</p>
                      <p>{t('tryDifferentFile')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Paginação no rodapé */}
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
                    ⏮ Anterior
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
                    Próximo ⏭
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
            </React.Fragment>
          ) : (
            <div className="no-search">
              <h3>📄 {t('selectReferenceFile')}</h3>
              <p>{t('selectFileMessage')}</p>
              {files.length > 0 ? (
                <p><strong>📊 {t('availableFiles')}</strong> {files.length} {t('filesAvailable')}</p>
              ) : (
                <p style={{ color: '#ff6b6b' }}>⚠️ {t('noAvailableFiles')}</p>
              )}
            </div>
          )}
        </section>
      </section>

      {/* ===== MODAL DE INSERÇÃO INDIVIDUAL ===== */}
      {showInsertModal && (
        <div className="modal-overlay" onClick={closeInsertModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ minWidth: 440, maxWidth: 560 }}>
            <div className="modal-header">
              <h3>➕ ADICIONAR REGISTRO INDIVIDUAL</h3>
            </div>
            <form className="modal-body" onSubmit={handleInsertSubmit}>
              {camposForm.map(campo => (
                <div className="form-group" key={campo.name}>
                  <label className="field-label">{campo.label}</label>
                  {campo.isDropdown ? (
                    <select
                      name={campo.name}
                      className="form-input"
                      value={novoRegistro[campo.name]}
                      onChange={handleNovoRegistroChange}
                      required
                    >
                      <option value="" disabled>SELECIONE</option>
                      {campo.name === 'FromVessel_NavioOrigem' || campo.name === 'ToVessel_NavioDestino' ? (
                        modalDropdowns.vessels.map(vessel => (
                          <option key={vessel} value={vessel}>{vessel}</option>
                        ))
                      ) : campo.name === 'FromDepartment_DepartamentoOrigem' || campo.name === 'ToDepartment_DepartamentoDestino' ? (
                        modalDropdowns.departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))
                      ) : null}
                    </select>
                  ) : (
                    // Inputs com reforço para campos numéricos
                    <input
                      type={campo.type}
                      name={campo.name}
                      inputMode={campo.type === 'number' ? 'numeric' : undefined}
                      pattern={campo.type === 'number' ? '[0-9]*' : undefined}
                      step={campo.name === 'TotalAmount_USD_ValorTotal_USD' ? '0.01' : undefined}
                      className="form-input"
                      value={novoRegistro[campo.name]}
                      onChange={handleNovoRegistroChange}
                      onBlur={campo.name === 'TotalAmount_USD_ValorTotal_USD' ? () => handleNumericBlur(campo.name as any) : undefined}
                      required
                      style={{ textTransform: 'uppercase' }}
                    />
                  )}
                </div>
              ))}
              <div className="form-group">
                <label className="field-label">DATA DE CRIAÇÃO</label>
                <input
                  type="text"
                  className="form-input"
                  value={new Date().toLocaleString("pt-BR")}
                  readOnly
                  disabled
                />
              </div>
              {novoRegistroError && (
                <div style={{ color: "#e63946", margin: "12px 0", fontWeight: "bold" }}>
                  {novoRegistroError}
                </div>
              )}
              <div style={{ display: "flex", gap: 16, marginTop: 18, justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={closeInsertModal}>
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  onClick={handleSaveClick}
                  disabled={saving}
                >
                  {saving ? '🔄 Salvando...' : 'SALVAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL DE UPLOAD ===== */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={closeUploadModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📤 {t('uploadTitle')}</h3>
              <button className="modal-close" onClick={closeUploadModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="upload-area">
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xlsb,.xls"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                <div
                  className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
                  onClick={() => !uploading && document.getElementById('file-input')?.click()}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  style={{
                    border: isDragging ? '2px dashed #007bff' : '2px dashed #ccc',
                    backgroundColor: isDragging ? '#f0f8ff' : '#f9f9f9',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    padding: '40px 20px',
                    textAlign: 'center',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="upload-icon">📁</div>
                  <p style={{
                    color: isDragging ? '#007bff' : '#666',
                    fontWeight: isDragging ? 'bold' : 'normal'
                  }}>
                    {isDragging
                      ? 'Solte o arquivo aqui!'
                      : t('uploadInstructions')
                    }
                  </p>
                  <p className="file-types">Formatos: .xlsx, .xlsb, .xls | Max: 50MB</p>
                </div>

                {selectedFile && (
                  <div className="selected-file">
                    <div className="file-info">
                      <span className="file-name">📄 {selectedFile.name}</span>
                      <span className="file-size">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  </div>
                )}

                {uploadMessage && (
                  <div className={`upload-message ${uploadMessageType}`}>{uploadMessage}</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeUploadModal} disabled={uploading}>
                {t('cancel')}
              </button>
              {duplicatesFileName ? (
                <>
                  <a
                    className="btn-tertiary"
                    href={`/api/desembarque/duplicates/${duplicatesFileName}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      // after clicking download, clear the duplicates name so modal can be closed
                      setTimeout(() => setDuplicatesFileName(null), 1000);
                    }}
                    style={{ marginRight: '8px' }}
                  >
                    ⬇️ Baixar Duplicados
                  </a>
                  <button className="btn-primary" onClick={() => { setShowUploadModal(false); setUploadMessage(''); setUploadMessageType(''); }}>
                    {t('close')}
                  </button>
                </>
              ) : (
                <button className="btn-primary" onClick={insertRecord} disabled={!selectedFile || uploading}>
                  {uploading ? '🔄 Processando...' : `📤 ${t('uploadButton')}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
    
        .results-controls {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          margin-bottom: 16px;
        }

        .entries-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #073776;
          width: 100%;
          padding-top: 110px;
        }

        .filter-input-search {
          display: flex; 
          gap: 12px;      
          flex-direction: column;
          align-items: flex-end;
          margin-bottom: 20px;
        }

        .pagination-number.active {
          background: #2563eb;
          color: #fff;
          border-color: #2563eb;
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

        .filter-reference-date {
          margin-bottom: 24px;
        }

        .filter-reference-date .form-group {
          max-width: 100%;
        }

        .dropdown-info-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn-show-more {
          padding: 6px 14px;
          background: linear-gradient(90deg, #073776 0%, #4285f4 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }

        .btn-show-more:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
        }

        .btn-show-more:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          align-items: start;
        }

        .filter-grid .form-group {
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .filter-grid .label-wrapper {
          min-height: 44px;
          height: 44px;
          display: flex;
          align-items: flex-start;
          margin-bottom: 6px;
        }

        .filter-grid .field-label {
          font-weight: 600;
          font-size: 13px;
          line-height: 1.4;
          margin: 0;
          padding: 0;
          display: block;
        }

        .filter-grid .form-input,
        .filter-grid input.form-input,
        .filter-grid select.form-input {
          width: 100%;
          height: 40px;
          padding: 8px 12px;
          font-size: 14px;
          box-sizing: border-box;
          margin: 0;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .status-field {
          max-width: 400px;
          width: 100%;
        }
        
        .btn-tertiary {
          display: inline-block;
          padding: 8px 12px;
          background: #f5f5f5;
          border: 1px solid #ccc;
          color: #333;
          border-radius: 6px;
          text-decoration: none;
        }
        .btn-tertiary:hover { background: #eee; }

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

        @media (max-width: 768px) {
          .filter-grid {
            grid-template-columns: 1fr;
          }
          
          .status-field {
            grid-column: 1;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default function Desembarque() {
  return (
    <AlertProvider>
      <DesembarqueInner />
    </AlertProvider>
  );
}
