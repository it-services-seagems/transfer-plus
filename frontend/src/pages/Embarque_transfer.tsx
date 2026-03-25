import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAlert, AlertProvider } from "../components/AlertProvider";
import "../styles/main.css";
import CardIcon from "../components/CardIcons";
import PageHeader from '../components/PageHeader';

// ===== Interfaces =====
interface User {
  username: string;
  email: string;
  user_type: 'ADMIN' | 'DESEMBARQUE' | 'CONFERENTE' | 'EMBARQUE';
  success: boolean;
}

interface FormDataState {
  id: string | number;  // Pode ser string (do banco) ou number
  FromVessel_NavioOrigem: string;
  ToVessel_NavioDestino: string;
  FromDepartment_DepartamentoOrigem: string;
  ToDepartment_DepartamentoDestino: string;
  PRNumberTMMaster_NumeroPRTMMaster: string;
  OraclePRNumber_NumeroPROracle: string;
  SPN: string;
  ItemDescription_DescricaoItem: string;
  OriginAllocatedPosition_PosicaoAlocadaOrigem: string;
  QuantityToBeTransferred_QuantidadeATransferir: string;
  QuantityToBeTransferred?: string;
  conferencia_quantidade_conferida?: string;
  conferencia_quantidade?: string | number | null;
  Desembarque_quantidade_conferida?: string;
  desembarque_quantidade?: string | number | null;
  embarque_quantidade_conferida?: string;
  observacao: string;
  responsavel_conf: string;
  status_final: string;
  lom?: string;
  data_inicio_quarentena?: string;
}

const EmbarqueTransfer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const showAlert = useAlert();
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState('pt-br');
  const [form, setForm] = useState<FormDataState>({} as FormDataState);
  const [imageBlobUrl, setImageBlobUrl] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [showItemImageModal, setShowItemImageModal] = useState<boolean>(false);
  const [showShipmentImageModal, setShowShipmentImageModal] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploadStatus, setFileUploadStatus] = useState<'success' | 'error' | null>(null);
  const [fileUploadMessage, setFileUploadMessage] = useState<string>("");
  const [showFileMessage, setShowFileMessage] = useState<boolean>(true);
   

  // ===== Tradução =====
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'pt-br': {
        // Títulos
        'shipmentTransfer': 'EMBARQUE ➜ FINALIZAR',
        'origin': 'ORIGEM',
        'destination': 'DESTINO',
        'details': 'DETALHES',

        // Campos
        'vessel': 'NAVIO',
        'department': 'DEPARTAMENTO',
        'physicalOriginPosition': 'POSIÇÃO FÍSICA DE ORIGEM',
        'prTmMaster': 'PR TM MASTER (REQUISIÇÃO DE COMPRA NO TM MASTER)',
        'spn': 'SPN (SPARE PART NUMBER NO TM MASTER)',
        'description': 'Descrição',
        'requestedQuantity': 'QUANTIDADE SOLICITADA PARA TRANSFERÊNCIA',
        'conferredQuantity': 'QUANTIDADE CONFERIDA',
        'embarkedQuantity': 'QUANTIDADE EMBARCADA',
        'responsible': 'RESPONSÁVEL',
        'finalStatus': 'STATUS FINAL',
        'observation': 'OBSERVAÇÃO',
        'lom': 'LOM',
        'itemImage': '⚠️ Anexe a foto do item recebido a bordo para finalizar.',
        'shipmentImage': 'Imagem da etapa de Conferência',
        'quarantineStartDate': 'DATA INÍCIO QUARENTENA',

        // Status
        'select': 'Selecione',
        'shipmentFinalized': 'Embarque Finalizado',
        'prIncomplete': 'PR Incompleta',
        'divergentMaterial': 'Material Divergente',
        'awaitingReturn': 'Aguardando Retorno',
        'quarantine': 'Quarentena',

        // Placeholders
        'noValue': 'Sem valor',
        'enterQuantity': 'Informe a quantidade',
        'threeLetters': '3 letras',

        // Ações
        'finalize': 'FINALIZAR',
        'backToShipment': 'Voltar para Embarque',

        // Mensagens
        'idRequired': 'ID obrigatório',
        'invalidShipmentQuantity': 'Quantidade conferida no embarque inválida',
        'invalidConferenceQuantity': 'Quantidade conferida (conferência) inválida',
        'finalStatusRequired': 'Status final é obrigatório',
        'departmentThreeLetters': 'Departamento de Destino deve ter 3 letras.',
        'shipmentSaved': 'Embarque salvo com sucesso!',
        'submitError': 'Erro ao submeter:',
        'unknownError': 'erro desconhecido'
      },
      'en': {
        // Títulos
        'shipmentTransfer': 'SHIPMENT ➜ FINALIZE',
        'origin': 'ORIGIN',
        'destination': 'DESTINATION',
        'details': 'DETAILS',

        // Campos
        'vessel': 'VESSEL',
        'department': 'DEPARTMENT',
        'physicalOriginPosition': 'PHYSICAL ORIGIN POSITION',
        'prTmMaster': 'PR TM MASTER (PURCHASE REQUEST IN TM MASTER)',
        'spn': 'SPN (SPARE PART NUMBER IN TM MASTER)',
        'description': 'Description',
        'requestedQuantity': 'REQUESTED QUANTITY FOR TRANSFER',
        'conferredQuantity': 'CONFERRED QUANTITY',
        'embarkedQuantity': 'EMBARKED QUANTITY',
        'responsible': 'RESPONSIBLE',
        'finalStatus': 'FINAL STATUS',
        'observation': 'OBSERVATION',
        'lom': 'LOM',
        'itemImage': 'ITEM IMAGE',
        'shipmentImage': 'SHIPMENT IMAGE',
        'quarantineStartDate': 'QUARANTINE START DATE',

        // Status
        'select': 'Select',
        'shipmentFinalized': 'Shipment Finalized',
        'prIncomplete': 'PR Incomplete',
        'divergentMaterial': 'Divergent Material',
        'awaitingReturn': 'Awaiting Return',
        'quarantine': 'Quarantine',

        // Placeholders
        'noValue': 'No value',
        'enterQuantity': 'Enter quantity',
        'threeLetters': '3 letters',

        // Ações
        'finalize': 'FINALIZE',
        'backToShipment': 'Back to Shipment',

        // Mensagens
        'idRequired': 'ID required',
        'invalidShipmentQuantity': 'Invalid shipment quantity',
        'invalidConferenceQuantity': 'Invalid conference quantity',
        'finalStatusRequired': 'Final status is required',
        'departmentThreeLetters': 'Destination Department must have 3 letters.',
        'shipmentSaved': 'Shipment saved successfully!',
        'submitError': 'Submit error:',
        'unknownError': 'unknown error'
      }
    };

    return translations[language]?.[key] || key;
  };

  // ===== Formatar datetime para exibição brasileira: DD/MM/YYYY HH:MM =====
  const formatDateTime = (dateTimeStr: string | undefined) => {
    if (!dateTimeStr) return "-";
    try {
      const date = new Date(dateTimeStr.replace(' ', 'T'));
      if (isNaN(date.getTime())) return dateTimeStr;

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return dateTimeStr;
    }
  };

  // ===== Função para carregar imagem com autenticação =====
  const loadImageWithAuth = async (imageId: string | number) => {
    
    // Validação mais rigorosa do imageId
    if (!imageId || imageId === '' || imageId === 'undefined' || imageId === 'null') {
      return;
    }
    
    if (!user?.username || !user.user_type) {
      return;
    }

    try {
      const response = await fetch(`http://10.15.3.30:9280/api/embarque/imagem/${encodeURIComponent(imageId)}`, {
        method: 'GET',
        headers: {
          'x-user-name': user.username,
          'x-user-type': user.user_type
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setImageBlobUrl(blobUrl);
      } else {
        const errorText = await response.text();
        setImageBlobUrl("");
      }
    } catch (error) {
      console.error('❌ DEBUG [loadImageWithAuth] - Erro na requisição:', error);
      setImageBlobUrl("");
    }
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

  useEffect(() => {
    const transferData = location.state as FormDataState;

    if (!transferData) {
      navigate("/embarque");
      return;
    }
    
    if (!transferData.id) {
    }

    let userResponsible = "Usuário logado";
    if (user?.username) {
      userResponsible = user.username;
    } else {
      try {
        const userStorage = localStorage.getItem("user");
        if (userStorage) {
          const userParsed = JSON.parse(userStorage);
          if (userParsed.username) userResponsible = userParsed.username;
        }
      } catch { }
    }

    // Compatibilidade: extrai quantidades de vários possíveis nomes de campo retornados pela API
    const requestedQty =
      transferData.QuantityToBeTransferred_QuantidadeATransferir ??
      transferData.QuantityToBeTransferred ??
      transferData.QuantityToBeTransferred_QuantidadeATransferir ??
      "";

    // A API /api/embarque retorna os campos como 'conferencia_quantidade' e 'desembarque_quantidade'
    // Compatibilidade com aliases antigos (conferencia_quantidade_conferida, Desembarque_quantidade_conferida)
    const conferenceQty =
      transferData.conferencia_quantidade_conferida ||
      (transferData as any).conf_QuantidadeConferencia ||
      transferData.conferencia_quantidade ||
      transferData.Desembarque_quantidade_conferida ||
      transferData.desembarque_quantidade ||
      "";

    setForm({
      ...transferData,
      QuantityToBeTransferred_QuantidadeATransferir: requestedQty ? String(requestedQty) : "",
      conferencia_quantidade_conferida: conferenceQty ? String(conferenceQty) : "",
      // Embarque quantidade deve vir vazia para o usuário preencher no fluxo de embarque
      embarque_quantidade_conferida: "",
      observacao: "",
      status_final: "",
      lom: transferData.lom != null ? String(transferData.lom) : "",
      responsavel_conf: userResponsible,
    });

    // Só busca via API se realmente não tiver as quantidades (checando todos os possíveis nomes de campo)
    const hasRequestedQty = !!(requestedQty);
    const hasConferenceQty = !!(conferenceQty);
    const needsFetchQuantity = !hasRequestedQty || !hasConferenceQty;

    if (transferData.id && needsFetchQuantity) {
      (async () => {
        try {
          // Preferir consulta por SPN ou PRNumber (endpoints retornam QuantityToBeTransferred e conferencia_quantidade)
          const params: string[] = [];
          if (transferData.SPN) params.push(`SPN=${encodeURIComponent(String(transferData.SPN))}`);
          if (transferData.PRNumberTMMaster_NumeroPRTMMaster) params.push(`PRNumberTMMaster_NumeroPRTMMaster=${encodeURIComponent(String(transferData.PRNumberTMMaster_NumeroPRTMMaster))}`);

          if (params.length > 0) {
            // Usar /api/embarque (o mesmo endpoint da lista) que retorna conferencia_quantidade e desembarque_quantidade
            const url = `http://10.15.3.30:9280/api/embarque?${params.join("&")}`;
            const authHeaders: Record<string, string> = { 'Accept': 'application/json' };
            if (user?.username) authHeaders['x-user-name'] = user.username;
            if (user?.user_type) authHeaders['x-user-type'] = user.user_type;
            const resp = await fetch(url, { headers: authHeaders });
            if (resp.ok) {
              const json = await resp.json();
              const rows = json?.data || [];
              if (rows && rows.length > 0) {
                const row = rows[0];
                // A API retorna: conferencia_quantidade (valor conferido) e desembarque_quantidade (qty original)
                const fetchedConf =
                  (row.conferencia_quantidade != null && row.conferencia_quantidade !== "" ? String(row.conferencia_quantidade) : null) ??
                  (row.conferencia_quantidade_conferida != null && row.conferencia_quantidade_conferida !== "" ? String(row.conferencia_quantidade_conferida) : null) ??
                  (row.desembarque_quantidade != null && row.desembarque_quantidade !== "" ? String(row.desembarque_quantidade) : null) ??
                  (row.Desembarque_quantidade_conferida != null && row.Desembarque_quantidade_conferida !== "" ? String(row.Desembarque_quantidade_conferida) : null);
                const fetchedRequested =
                  row.QuantityToBeTransferred ?? row.QuantityToBeTransferred_QuantidadeATransferir ?? null;
                setForm(prev => ({
                  ...prev,
                  QuantityToBeTransferred_QuantidadeATransferir: fetchedRequested != null ? String(fetchedRequested) : prev.QuantityToBeTransferred_QuantidadeATransferir,
                  conferencia_quantidade_conferida: fetchedConf ?? prev.conferencia_quantidade_conferida,
                  // Do NOT pre-fill embarque_quantidade_conferida; user must supply it here
                }));
                return;
              }
            }
          }

          // Fallback: tentar buscar apenas metadata (nome do arquivo) — mantém comportamento antigo
          try {
            const resp2 = await fetch(`http://10.15.3.30:9280/api/embarque/metadata/${encodeURIComponent(transferData.id)}`);
            if (!resp2.ok) return;
            const json2 = await resp2.json();
            const md = json2?.data || json2;
            if (!md) return;
            // metadata endpoint não traz quantidades, então não há muitos campos para setar here
          } catch (err2) {
            console.error('Erro ao buscar metadata do embarque (fallback):', err2);
          }
        } catch (err) {
          console.error('Erro ao buscar dados via consulta do embarque:', err);
        }
      })();
    }
    

    if (user?.username && transferData.id) {
    } else {
    }

    setErrorMsg(null);
  }, [location, navigate, user]);

  // ===== Carregar imagem quando usuário estiver disponível =====
  useEffect(() => {

    if (user && form.id) {
      loadImageWithAuth(form.id);
    } else {
    }
  }, [user, form.id]);

  // ===== Cleanup blob URL quando componente desmontar =====
  useEffect(() => {
    return () => {
      if (imageBlobUrl) {
        URL.revokeObjectURL(imageBlobUrl);
      }
    };
  }, [imageBlobUrl]);

  // ===== Change language =====
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  // ===== Handle changes =====
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setErrorMsg(null);

    if (type === "file") {
      const fileInput = e.target as HTMLInputElement;
      const file = fileInput.files?.[0];
      if (file) {
        // Validações
        const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        
        // Validar formato
        if (!ALLOWED_FORMATS.includes(file.type)) {
          setFileUploadStatus('error');
          setFileUploadMessage('❌ Formato inválido! Aceites: JPG, PNG, WEBP');
          setImagePreview("");
          fileInput.value = '';
          return;
        }
        
        // Validar tamanho
        if (file.size > MAX_SIZE) {
          setFileUploadStatus('error');
          setFileUploadMessage('❌ Arquivo muito grande! Máximo 5MB');
          setImagePreview("");
          fileInput.value = '';
          return;
        }
        
        // Se passou em todas as validações
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
        
        setFileUploadStatus('success');
        setFileUploadMessage(`✅ Imagem anexada com sucesso!`);
        setShowFileMessage(true);
      }
      return;
    }

    if (name === "ToDepartment_DepartamentoDestino") {
      // Aceita apenas letras e máximo 3 caracteres
      const letras = value.replace(/[^A-Za-z]/g, "").substring(0, 3);
      setForm(prev => ({ ...prev, [name]: letras }));
      return;
    }

    // Validação: somente números decimais com 2 casas em embarque_quantidade_conferida
    if (name === "embarque_quantidade_conferida") {
      const decimal = value.replace(/[^0-9.,]/g, "").replace(",", ".");
      setForm(prev => ({ ...prev, [name]: decimal }));
      return;
    }

    // Se o campo de status_final for alterado, preencher/limpar data_inicio_quarentena
    if (name === "status_final") {
      if (value === "Quarentena") {
        // Formato compatível com input[type="datetime-local"]: YYYY-MM-DDTHH:MM
        const nowLocal = new Date().toISOString().slice(0, 16);
        setForm(prev => ({ ...prev, status_final: value, data_inicio_quarentena: nowLocal }));
        return;
      } else {
        // Ao mudar para outro status, limpar o campo de data
        setForm(prev => ({ ...prev, status_final: value, data_inicio_quarentena: "" }));
        return;
      }
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  // ===== Handle submit =====
  const handleSubmit = async () => {
    setErrorMsg(null);
    const errors: string[] = [];

    if (!form.id) errors.push(t('idRequired'));
    if (!imagePreview) errors.push('❌ É obrigatório anexar uma foto do item para finalizar o embarque.');
    if (!form.embarque_quantidade_conferida || isNaN(Number(form.embarque_quantidade_conferida))) {
      errors.push(t('invalidShipmentQuantity'));
    }
    if (form.conferencia_quantidade_conferida && isNaN(Number(form.conferencia_quantidade_conferida))) {
      errors.push(t('invalidConferenceQuantity'));
    }
    if (!form.status_final) errors.push(t('finalStatusRequired'));
    if (!form.ToDepartment_DepartamentoDestino || form.ToDepartment_DepartamentoDestino.length !== 3) {
      errors.push(t('departmentThreeLetters'));
    }

    if (errors.length > 0) {
      setErrorMsg(errors.join("\n"));
      return;
    }

    try {
      // Normalização numérica
      const embarqueQtd = Number(form.embarque_quantidade_conferida?.replace(",", "."));
      const conferenciaQtd =
        form.conferencia_quantidade_conferida && form.conferencia_quantidade_conferida.trim() !== ""
          ? Number(form.conferencia_quantidade_conferida)
          : 0;

      // Criar FormData para enviar imagem junto com os dados
      const formData = new FormData();
      formData.append('id', String(form.id));
      formData.append('status_final', form.status_final);
      formData.append('observacao', form.observacao || "");
      formData.append('responsavel_conf', form.responsavel_conf || "");
      formData.append('embarque_quantidade_conferida', String(embarqueQtd));
      formData.append('ToDepartment_DepartamentoDestino', form.ToDepartment_DepartamentoDestino || "");
      
      if (form.lom && form.lom.trim() !== "") {
        formData.append('lom', form.lom);
      }
      
      // Adicionar imagem
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      // Apenas adiciona data_inicio_quarentena se status for Quarentena
      if (form.status_final === "Quarentena") {
        const now = new Date();
        formData.append('data_inicio_quarentena', now.toISOString().split('T')[0]);
      }

      const response = await fetch("http://10.15.3.30:9280/api/embarque/confirmar", {
        method: "POST",
        headers: {
          'x-user-name': user?.username || '',
          'x-user-type': user?.user_type || ''
        },
        body: formData,
      });

      let result: any = {};
      try {
        result = await response.json();
      } catch {
        result = { status: "error", message: "Resposta inválida do servidor." };
      }

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Falha ao gravar embarque.");
      }

      showAlert(t('shipmentSaved'), "success");
      // Aguardar 1 segundo antes de navegar para o usuário ver o alerta
      setTimeout(() => {
        navigate("/embarque");
      }, 1000);
    } catch (err: any) {
      setErrorMsg("❌ " + t('submitError') + " " + (err.message || t('unknownError')));
    }
  };

  if (!user) {
    return <div className="loading-screen">🔄 Carregando...</div>;
  }

  const isAdmin = user.user_type === 'ADMIN';

  return (
    <div className="page-container">
      <PageHeader
        language={language}
        onLanguageChange={handleLanguageChange}
        buttons={[
          { label: t('backToShipment'), onClick: () => navigate('/embarque'), className: 'btn-secondary' }
        ]}
      />

      <div className="filter-section">
        <h2 className="section-title">
          <CardIcon type="embarque" className="section-icon" />
          {t('shipmentTransfer')}
        </h2>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 className="section-title"> {t('origin')}</h3>
            <div className="form-group">
              <label className="field-label">{t('vessel')}</label>
              <input readOnly className="form-input" value={form.FromVessel_NavioOrigem || ""} />
            </div>
            <div className="form-group">
              <label className="field-label">{t('department')}</label>
              <input readOnly className="form-input" value={form.FromDepartment_DepartamentoOrigem || ""} />
            </div>
            <div className="form-group">
              <label className="field-label">{t('physicalOriginPosition')}</label>
              <input readOnly className="form-input" value={form.OriginAllocatedPosition_PosicaoAlocadaOrigem || ""} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 className="section-title"> {t('destination')}</h3>
            <div className="form-group">
              <label className="field-label">{t('vessel')}</label>
              <input readOnly className="form-input" value={form.ToVessel_NavioDestino || ""} />
            </div>
            <div className="form-group">
              <label className="field-label">{t('department')}</label>
              <input
                name="ToDepartment_DepartamentoDestino"
                className="form-input"
                value={form.ToDepartment_DepartamentoDestino || ""}
                onChange={handleChange}
                maxLength={3}
                placeholder={t('threeLetters')}
                pattern="[A-Za-z]{3}"
                title="Apenas letras, até 3 caracteres"
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label className="field-label">{t('prTmMaster')}</label>
              <input readOnly className="form-input" value={form.PRNumberTMMaster_NumeroPRTMMaster || ""} />
            </div>
          </div>
        </div>

        <h3 className="section-title" style={{ marginTop: 24 }}>{t('details')}</h3>

        <div className="details-layout">
          {/* Linha 1: Descrição do Item */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t('description')}</label>
              <input readOnly className="form-input" value={form.ItemDescription_DescricaoItem || ""} />
            </div>
          </div>

          {/* Linha 2: SPN / Quantidade Solicitada */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t('spn')}</label>
              <input readOnly className="form-input" value={form.SPN || ""} />
            </div>
            <div className="form-group">
              <label className="field-label">{t('requestedQuantity')}</label>
              <input readOnly className="form-input" value={form.QuantityToBeTransferred_QuantidadeATransferir || ""} />
            </div>
          </div>

          {/* Linha 3: Quantidade Conferida / Quantidade Embarcada */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t('conferredQuantity')}</label>
              <input
                name="conferencia_quantidade_conferida"
                className="form-input"
                value={form.conferencia_quantidade_conferida ?? ""}
                readOnly
                placeholder={t('noValue')}
              />
            </div>
            <div className="form-group">
              <label className="field-label">{t('embarkedQuantity')}</label>
              <input
                name="embarque_quantidade_conferida"
                className="form-input"
                value={form.embarque_quantidade_conferida ?? ""}
                onChange={handleChange}
                placeholder={t('enterQuantity')}
              />
            </div>
          </div>

          {/* Linha 4: Observação / LOM */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t('observation')}</label>
              <input name="observacao" className="form-input" value={form.observacao} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="field-label">{t('lom')}</label>
              <input
                name="lom"
                className="form-input"
                value={form.lom || ""}
                onChange={handleChange}
                placeholder={t('noValue')}
              />
            </div>
          </div>

          {/* Linha 5: Status Final / Responsável */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t('finalStatus')}</label>
              <select
                name="status_final"
                className="form-input"
                value={form.status_final}
                onChange={handleChange}
              >
                <option value="">{t('select')}</option>
                <option value="Embarque Finalizado">{t('shipmentFinalized')}</option>
                <option value="PR INCOMPLETA">{t('prIncomplete')}</option>
                <option value="Material Divergente">{t('divergentMaterial')}</option>
                <option value="Aguardando Retorno">{t('awaitingReturn')}</option>
                <option value="Quarentena">{t('quarantine')}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="field-label">{t('responsible')}</label>
              <input readOnly className="form-input" value={form.responsavel_conf || ""} />
            </div>
          </div>
        </div>

        {form.status_final === "Quarentena" && (
          <div style={{ display: "flex", gap: "16px", marginTop: "16px", flexWrap: "wrap" }}>
            <div className="form-group">
              <label>{t('quarantineStartDate')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  ref={dateInputRef}
                  type="datetime-local"
                  name="data_inicio_quarentena"
                  className="form-input"
                  value={form.data_inicio_quarentena || ""}
                  onChange={handleChange}
                />
                
              </div>
            </div>
          </div>
        )}

        {/* Aviso separado: aparece quando não há preview de imagem */}
        {!imagePreview && (
          <div style={{
            marginTop: 24,
            padding: '8px 12px',
            fontSize: '12px',
            color: '#DC2626',
            width: 'fit-content',
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ marginTop: 4 }}>Selecione a foto do item para continuar
</div>
          </div>
        )}

        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="custom-file-upload">
            <input 
              type="file" 
              name="image" 
              accept="image/jpeg,image/png,image/webp" 
              onChange={handleChange}
            />
            <span> Anexar foto</span>
          </label>
          <div className="file-info" style={{
            display: fileUploadStatus === 'success' && imagePreview ? 'none' : 'block',
            fontSize: '12px',
            fontWeight: 400,
            color: '#6B7280',
            marginTop: '6px'
          }}>Formatos aceites: JPG, PNG, WEBP (máx. 5MB)</div>
          {fileUploadMessage && showFileMessage && (
            <div style={{
              marginTop: '15px',
              padding: '8px 12px',
              fontSize: '13px',
              width: '360px',
              fontWeight: 500,
              borderRadius: '6px',
              color: fileUploadStatus === 'success' ? '#16A34A' : '#DC2626',
              backgroundColor: fileUploadStatus === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${fileUploadStatus === 'success' ? '#d1fae5' : '#fee2e2'}`,
              animation: 'slideIn 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <span>{fileUploadMessage}</span>
              <button
                onClick={() => setShowFileMessage(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: 'inherit',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '20px',
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                ✕
              </button>
            </div>
          )}
          {imagePreview && (
            <div style={{
              marginTop: 1,
              maxWidth: 360,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}>
              <img 
                src={imagePreview} 
                alt="Preview" 
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  transition: 'transform 0.3s ease',
                  cursor: 'pointer'
                }}
                onClick={() => setShowItemImageModal(true)}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />
            </div>
          )}
        </div>

        {/* Modal de Imagem em Tela Cheia - Item */}
        {showItemImageModal && imagePreview && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              cursor: 'pointer'
            }}
            onClick={() => setShowItemImageModal(false)}
          >
            <div 
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                cursor: 'default'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imagePreview}
                alt="Full Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: 8
                }}
              />
              <button
                onClick={() => setShowItemImageModal(false)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 48,
                  height: 48,
                  fontSize: 24,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="form-group" style={{ marginTop: 24 }}>
                
          <label style={{ display: 'block', fontWeight: 600, color: '#111827', fontSize: '15px', }}>{t('shipmentImage')}</label>
          {imageBlobUrl ? (
            <div style={{
              marginTop: 16,
              maxWidth: 360,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}>
              <img
                src={imageBlobUrl}
                alt="Imagem do embarque"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  transition: 'transform 0.3s ease',
                  cursor: 'pointer'
                }}
                onClick={() => setShowShipmentImageModal(true)}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />
            </div>
          ) : (
            <div style={{
              padding: "20px",
              textAlign: "center",
              color: "#666",
              backgroundColor: "#f5f5f5",
              borderRadius: 8,
              marginTop: 8
            }}>
              📷 Imagem não disponível
              <br />
              <button
                type="button"
                onClick={() => form.id && loadImageWithAuth(form.id)}
                style={{
                  marginTop: "10px",
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                🔄 Tentar Recarregar
              </button>
            </div>
          )}
        </div>

        {/* Modal para imagem de embarque */}
        {showShipmentImageModal && imageBlobUrl && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              cursor: 'pointer'
            }}
            onClick={() => setShowShipmentImageModal(false)}
          >
            <div 
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                cursor: 'default'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imageBlobUrl}
                alt="Full Shipment Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: 8
                }}
              />
              <button
                onClick={() => setShowShipmentImageModal(false)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 48,
                  height: 48,
                  fontSize: 24,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Mensagem de erro/log */}
        {errorMsg && (
          <div style={{
            color: "#fff",
            background: "#e53935",
            padding: "10px 18px",
            borderRadius: 8,
            marginTop: 28,
            fontWeight: 500
          }}>
            {errorMsg.split("\n").map((m: string, idx: number) => <div key={idx}>{m}</div>)}
          </div>
        )}

        <div style={{ marginTop: "24px" }}>
          <button 
            className="btn-primary" 
            onClick={handleSubmit}
            disabled={!imagePreview}
            style={{
              opacity: imagePreview ? 1 : 0.5,
              cursor: imagePreview ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease'
            }}
            title={!imagePreview ? 'Selecione uma foto para finalizar' : ''}
          >
            {t('finalize')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Wrapper do componente com AlertProvider
function EmbarqueTransferWithProvider() {
  return (
    <AlertProvider>
      <EmbarqueTransfer />
    </AlertProvider>
  );
}

export default EmbarqueTransferWithProvider;