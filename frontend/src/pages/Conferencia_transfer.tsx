import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAlert, AlertProvider } from "../components/AlertProvider";
import "../styles/main.css";
import CardIcon from "../components/CardIcons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardCheck, faTruckLoading } from '@fortawesome/free-solid-svg-icons';
import PageHeader from '../components/PageHeader';

// ===== Axios separado para upload (sem interceptors) =====
const uploadAxios = axios.create({
  baseURL: 'http://10.15.3.30:9280',
  transformRequest: [(data) => {
    // Se for FormData, retorna sem transformar
    if (data instanceof FormData) {
      return data;
    }
    // Caso contrário, aplica transformação padrão
    return JSON.stringify(data);
  }],
});

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
  desembarque_quantidade_conferida: string;
  desembarque_quantidade?: string;
  conferencia_quantidade_conferida: string;
  observacao: string;
  lom?: string;
  responsavel_conf: string;
  status_final: string;
  data_inicio_quarentena?: string;
  data_fim_quarentena?: string;
  TotalAmount_USD_ValorTotal_USD?: string;
  username?: string;
  image: File | null;
}

const ConferenciaTransfer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const showAlert = useAlert();
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState('pt-br');
  const [form, setForm] = useState<FormDataState>({} as FormDataState);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [fileUploadMessage, setFileUploadMessage] = useState<string>("");
  const [fileUploadStatus, setFileUploadStatus] = useState<'success' | 'error' | null>(null);
  const [showFileMessage, setShowFileMessage] = useState<boolean>(true);

  const inconsistentes = ["Indefinido", "N/A", "NULL", "NaN", "Sem Departamento"];
  const isDestinoEditavel =
    !form.ToDepartment_DepartamentoDestino ||
    inconsistentes.includes(String(form.ToDepartment_DepartamentoDestino).trim());

  // ===== Tradução =====
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'pt-br': {
        // Títulos
        'conferenceTransfer': 'CONFERÊNCIA ➜ EMBARQUE',
        'origin': 'ORIGEM',
        'destination': 'DESTINO',
        'details': 'DETALHES',

        // Campos
        'vessel': 'NAVIO',
        'department': 'DEPARTAMENTO',
        'physicalOriginPosition': 'POSIÇÃO FÍSICA DE ORIGEM',
        'prTmMaster': 'PR TM MASTER (REQUISIÇÃO DE COMPRA NO TM MASTER)',
        'prOracle': 'PR ORACLE (REQUISIÇÃO DE COMPRA NO ORACLE)',
        'spn': 'SPN (SPARE PART NUMBER NO TM MASTER)',
        'itemDescription': 'DESCRIÇÃO DO ITEM',
        'requestedQuantity': 'QUANTIDADE SOLICITADA PARA TRANSFERÊNCIA',
        'disembarkmentQuantity': 'QUANTIDADE DESEMBARQUE',
        'conferenceQuantity': 'QUANTIDADE CONFERÊNCIA',
        'responsible': 'RESPONSÁVEL',
        'finalStatus': 'STATUS FINAL',
        'observation': 'OBSERVAÇÃO',
        'lom': 'LOM',
        'itemImage': ' IMAGEM DO ITEM',
        'quarantineStartDate': 'DATA INÍCIO QUARENTENA',

        // Status
        'select': 'Selecione',
        'prIncomplete': 'PR INCOMPLETA',
        'divergentMaterial': 'Material Divergente',
        'sentToShipment': 'Enviado para Embarque',
        'awaitingShipment': 'Aguardando Embarque',
        'awaitingReturn': 'Aguardando Retorno',
        'quarantine': 'Quarentena',
        'damage': 'Avaria',

        // Ações
        'submitConference': 'Finalizar Conferência',
        'backToConference': 'Voltar para Conferência',

        // Mensagens
        'fieldErrors': 'Corrija:',
        'idRequired': 'ID é obrigatório.',
        'invalidConferenceQuantity': 'Quantidade conferida na conferência inválida.',
        'finalStatusRequired': 'Status final obrigatório.',
        'imageRequired': 'Imagem obrigatória.',
        'departmentThreeLetters': 'Departamento de Destino deve ter 3 letras.',
        'shipmentSuccess': 'Enviado para EMBARQUE com sucesso!',
        'lomSuccess': 'Enviado para LOM com sucesso!',
        'quarantineSuccess': 'Enviado para QUARENTENA com sucesso!',
        'conferenceSuccess': 'Conferência realizada com sucesso!',
        'errorSavingConference': 'Erro ao gravar conferência:',
        'unexpectedError': 'Erro inesperado:',
        'charactersPlaceholder': '3 CARACTERES'
      },
      'en': {
        // Títulos
        'conferenceTransfer': 'CONFERENCE ➜ SHIPMENT',
        'origin': 'ORIGIN',
        'destination': 'DESTINATION',
        'details': 'DETAILS',

        // Campos
        'vessel': 'VESSEL',
        'department': 'DEPARTMENT',
        'physicalOriginPosition': 'PHYSICAL ORIGIN POSITION',
        'prTmMaster': 'PR TM MASTER (PURCHASE REQUEST IN TM MASTER)',
        'prOracle': 'PR ORACLE (PURCHASE REQUEST IN ORACLE)',
        'spn': 'SPN (SPARE PART NUMBER IN TM MASTER)',
        'itemDescription': 'ITEM DESCRIPTION',
        'requestedQuantity': 'REQUESTED QUANTITY FOR TRANSFER',
        'disembarkmentQuantity': 'DISEMBARKMENT QUANTITY',
        'conferenceQuantity': 'CONFERENCE QUANTITY',
        'responsible': 'RESPONSIBLE',
        'finalStatus': 'FINAL STATUS',
        'observation': 'OBSERVATION',
        'lom': 'LOM',
        'itemImage': ' 🖼️ ITEM IMAGE',
        'quarantineStartDate': 'QUARANTINE START DATE',

        // Status
        'select': 'Select',
        'prIncomplete': 'PR INCOMPLETE',
        'divergentMaterial': 'Divergent Material',
        'sentToShipment': 'Sent to Shipment',
        'awaitingShipment': 'Awaiting Shipment',
        'awaitingReturn': 'Awaiting Return',
        'quarantine': 'Quarantine',
        'damage': 'Damage',

        // Ações
        'submitConference': 'SUBMIT CONFERENCE',
        'backToConference': 'Back to Conference',

        // Mensagens
        'fieldErrors': 'Please correct:',
        'idRequired': 'ID is required.',
        'invalidConferenceQuantity': 'Invalid conference quantity.',
        'finalStatusRequired': 'Final status required.',
        'imageRequired': 'Image required.',
        'departmentThreeLetters': 'Destination Department must have 3 letters.',
        'shipmentSuccess': 'Successfully sent to SHIPMENT!',
        'lomSuccess': 'Successfully sent to Pending LOM!',
        'quarantineSuccess': 'Successfully sent to QUARANTINE!',
        'conferenceSuccess': 'Conference completed successfully! Material will not proceed to shipment!',
        'errorSavingConference': 'Error saving conference:',
        'unexpectedError': 'Unexpected error:',
        'charactersPlaceholder': '3 CHARACTERS'
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

  useEffect(() => {
    const transferData = location.state as FormDataState;
    if (!transferData) {
      navigate("/conferencia");
      return;
    }
    // Helper: formato compatível com datetime-local (YYYY-MM-DDTHH:MM)
    const formatDateTimeLocal = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const min = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    };

    const defaultDate = transferData.data_inicio_quarentena || formatDateTimeLocal(new Date());

    setForm({
      ...transferData,
      // Só pré-popula a data quando o status inicial indicar 'Quarentena'
      data_inicio_quarentena: transferData.status_final === "Quarentena" ? defaultDate : undefined,
      desembarque_quantidade_conferida: transferData.desembarque_quantidade || transferData.desembarque_quantidade_conferida || "",
      conferencia_quantidade_conferida: "",
      observacao: "",
      lom: "",
      // Garantir que sempre haja uma opção selecionada: padrão para 'Aguardando Embarque'
      status_final: transferData.status_final || "Aguardando Embarque",
      responsavel_conf: transferData.username || user?.username || "Usuário logado",
      image: null,
    });
  }, [location, navigate, user]);

  // Quando o status mudar para Quarentena, garantir pré-seleção da data atual se estiver vazia
  useEffect(() => {
    // Garantir pré-seleção da data somente quando o status for "Quarentena"
    if (form.status_final === "Quarentena" && !form.data_inicio_quarentena) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const d = new Date();
      const defaultDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setForm((prev) => ({ ...prev, data_inicio_quarentena: defaultDate }));
    }
  }, [form.status_final]);

  // ===== Change language =====
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  // ===== Handle changes =====
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

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
          setForm((prev) => ({ ...prev, image: null }));
          fileInput.value = '';
          return;
        }
        
        // Validar tamanho
        if (file.size > MAX_SIZE) {
          setFileUploadStatus('error');
          setFileUploadMessage('❌ Arquivo muito grande! Máximo 5MB');
          setImagePreview("");
          setForm((prev) => ({ ...prev, image: null }));
          fileInput.value = '';
          return;
        }
        
        // Se passou em todas as validações
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        setForm((prev) => ({
          ...prev,
          image: file,
        }));
        
        setFileUploadStatus('success');
        setFileUploadMessage('Imagem selecionada com sucesso ✅');
        setShowFileMessage(true);
      }
      return;
    }

    // Normalizar valor do datetime-local para formato compatível (YYYY-MM-DDTHH:MM)
    if (name === "data_inicio_quarentena") {
      let v = value;
      try {
        // Remover milissegundos, timezone e segundos extras
        if (v.includes('.')) v = v.split('.')[0];
        if (v.includes('+')) v = v.split('+')[0];
        v = v.replace('Z', '');
        // Garantir separator 'T'
        if (v.includes(' ')) v = v.replace(' ', 'T');
        // Truncar para "YYYY-MM-DDTHH:MM" (16 chars)
        if (v.length > 16) v = v.substring(0, 16);
      } catch (e) {
        // fallback: usar raw value
        v = value;
      }

      setForm((prev) => ({
        ...prev,
        [name]: v,
      }));
      return;
    }

    // Departamento Destino: só letras, máx 3 e sempre maiúsculo
    if (name === "ToDepartment_DepartamentoDestino") {
      const letras = value.replace(/[^A-Za-z]/g, "").substring(0, 3).toUpperCase();
      setForm((prev) => ({
        ...prev,
        [name]: letras,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ===== Handle submit =====
  const handleSubmit = async () => {
    const errors: string[] = [];

    if (!form.id) errors.push(t('idRequired'));
    if (!form.conferencia_quantidade_conferida || isNaN(Number(form.conferencia_quantidade_conferida))) {
      errors.push(t('invalidConferenceQuantity'));
    }
    if (!form.status_final) errors.push(t('finalStatusRequired'));
    if (!form.image) errors.push(t('imageRequired'));
    if (!form.ToDepartment_DepartamentoDestino || form.ToDepartment_DepartamentoDestino.length !== 3) {
      errors.push(t('departmentThreeLetters'));
    }

    if (errors.length > 0) {
      showAlert("⚠️ " + t('fieldErrors') + "\n\n- " + errors.join("\n- "), "error");
      return;
    }

    try {
      const { image, ...dados } = form;
      const payload: Record<string, any> = { ...dados };

      if (form.status_final === "Quarentena" && form.data_inicio_quarentena) {
        try {
          const raw = form.data_inicio_quarentena;
          // If string contains timezone (Z or +offset), convert to local naive string
          if (/Z$|[+\-]\d{2}:?\d{2}/.test(raw)) {
            const dt = new Date(raw);
            const pad = (n: number) => String(n).padStart(2, '0');
            payload.data_inicio_quarentena = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;
          } else {
            payload.data_inicio_quarentena = raw.length === 16 ? `${raw}:00` : raw;
          }
        } catch (e) {
          payload.data_inicio_quarentena = form.data_inicio_quarentena;
        }
      } else {
        delete payload.data_inicio_quarentena;
      }

      const resp = await axios.post("http://10.15.3.30:9280/api/conferencia/confirmar", payload, {
        headers: {
          'x-user-name': user?.username,
          'x-user-type': user?.user_type,
        }
      });

      if (resp.data?.status !== "success") {
        const msg = resp.data?.message || "Erro desconhecido na requisição!";
        showAlert(`❌ ${t('errorSavingConference')}\n${msg}`, "error");
        return;
      }

      // 2. Upload da imagem usando axios separado (sem interceptors)
      const renamed = new File([image!], `${form.id}.jpg`, { type: image!.type });
      const formData = new FormData();
      formData.append("id_embarque", form.id.toString());
      formData.append("arquivo", renamed);

      const uploadResponse = await uploadAxios.post(
        "/api/conferencia/upload",
        formData,
        {
          headers: {
            'X-User-Name': user?.username || '',
            'X-User-Type': user?.user_type || '',
          },
        }
      );

      if (uploadResponse.data?.status !== "success") {
        throw new Error(uploadResponse.data?.message || "Erro no upload");
      }

      // ALERTAS conforme status_final e lom
      if (form.status_final === "Quarentena") {
        showAlert(t('quarantineSuccess'), "success");
      } else if (!form.lom || form.lom.trim() === "") {
        showAlert(t('lomSuccess'), "success");
      } else if (form.status_final === "Enviado para Embarque") {
        showAlert(t('shipmentSuccess'), "success");
      } else {
        showAlert(t('conferenceSuccess'), "success");
      }
      // Aguardar 2 segundos antes de navegar para o usuário ver o alerta
      setTimeout(() => {
        navigate("/conferencia");
      }, 2000);

    } catch (err: any) {
      console.error("❌ Erro completo:", err);
      showAlert("❌ " + t('unexpectedError') + " " + (err.response?.data?.message || err.message || JSON.stringify(err)), "error");
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
          { label: t('backToConference'), onClick: () => navigate('/conferencia'), className: 'btn-secondary' }
        ]}
      />

      <div className="filter-section">
        <h2 className="section-title">
          <span className="section-icon"><FontAwesomeIcon icon={faClipboardCheck} /></span>
          {" "}{t('conferenceTransfer')}
          <span className="section-icon section-icon-right"><FontAwesomeIcon icon={faTruckLoading} /></span>
        </h2>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 className="section-title">{t('origin')}</h3>
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
            <h3 className="section-title">{t('destination')}</h3>
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
                placeholder={t('charactersPlaceholder')}
                pattern="[A-Z]{3}"
                title="Apenas letras MAIÚSCULAS, até 3 caracteres"
                autoComplete="off"
                required
              />
            </div>
            <div className="form-group">
              <label className="field-label">{t('prTmMaster')}</label>
              <input readOnly className="form-input" value={form.PRNumberTMMaster_NumeroPRTMMaster || ""} />
            </div>
            <div className="form-group">
              <label className="field-label">{t('prOracle')}</label>
              <input readOnly className="form-input" value={form.OraclePRNumber_NumeroPROracle || ""} />
            </div>
          </div>
        </div>

        <h3 className="section-title" style={{ marginTop: "24px" }}>{t('details')}</h3>

        <div className="details-layout">
          {/* Linha 1: Descrição do Item */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t('itemDescription')}</label>
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

          {/* Linha 3: Quantidade Desembarque / Observação */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t('disembarkmentQuantity')}</label>
              <input readOnly className="form-input" value={form.desembarque_quantidade_conferida || ""} />
            </div>
            <div className="form-group">
              <label className="field-label"> {t('observation')}</label>
              <input name="observacao" className="form-input" value={form.observacao || ""} onChange={handleChange} />
            </div>
          </div>

          {/* Linha 4: LOM / Status Final */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label"> {t('lom')}</label>
              <input name="lom" className="form-input" value={form.lom || ""} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="field-label">{t('finalStatus')}</label>
              <select name="status_final" className="form-input" value={form.status_final} onChange={handleChange}>
                <option value="PR INCOMPLETA">{t('prIncomplete')}</option>
                <option value="Material Divergente">{t('divergentMaterial')}</option>
                <option value="Enviado para Embarque">{t('sentToShipment')}</option>
                <option value="Aguardando Embarque">{t('awaitingShipment')}</option>
                <option value="Aguardando Retorno">{t('awaitingReturn')}</option>
                <option value="Quarentena">{t('quarantine')}</option>
                <option value="Avaria">{t('damage')}</option>
              </select>
            </div>
          </div>

          {/* Linha 5: Quantidade Conferência / Responsável */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t('conferenceQuantity')}</label>
              <input
                name="conferencia_quantidade_conferida"
                className="form-input"
                value={form.conferencia_quantidade_conferida || ""}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="field-label">{t('responsible')}</label>
              <input readOnly className="form-input" value={form.responsavel_conf || ""} />
            </div>
          </div>
        </div>

        {form.status_final === "Quarentena" ? (
          <div style={{ display: "flex", gap: "16px", marginTop: "16px", flexWrap: "wrap" }}>
            <div className="form-group">
              <label>{t('quarantineStartDate')}</label>
              <input
                type="datetime-local"
                name="data_inicio_quarentena"
                className="form-input"
                value={form.data_inicio_quarentena || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        ) : null}

        <div className="form-group" style={{ marginTop: 24 }}>
          <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontWeight: 600,
                fontSize: '15px',
                color: '#111827'
              }}
            >
              {t('itemImage')}
          </label>

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
                onClick={() => setShowImageModal(true)}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />
            </div>
          )}
        </div>

        {/* Modal de Imagem em Tela Cheia */}
        {showImageModal && imagePreview && (
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
            onClick={() => setShowImageModal(false)}
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
                onClick={() => setShowImageModal(false)}
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

        <div style={{ marginTop: "24px" }}>
          <button className="btn-primary" onClick={handleSubmit}>
          {t('submitConference')}
          </button>
        </div>
      </div>

      <style>{`
        .section-icon {
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #073776;
          margin-right: 8px;
          vertical-align: middle;
        }

        .section-icon svg {
          width: 100%;
          height: 100%;
          stroke: currentColor;
        }
        .section-icon-right {
          margin-left: 8px;
          margin-right: 0;
        }
      `}</style>
    </div>
  );
};

// Wrapper do componente com AlertProvider
function ConferenciaTransferWithProvider() {
  return (
    <AlertProvider>
      <ConferenciaTransfer />
    </AlertProvider>
  );
}

export default ConferenciaTransferWithProvider;