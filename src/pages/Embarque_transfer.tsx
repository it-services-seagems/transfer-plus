import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAlert, AlertProvider } from "../components/AlertProvider";
import "../styles/main.css";

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
  conferencia_quantidade_conferida?: string;
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
        'shipmentImage': 'IMAGEM DO EMBARQUE',
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

    setForm({
      ...transferData,
      conferencia_quantidade_conferida: transferData.conferencia_quantidade_conferida ? String(transferData.conferencia_quantidade_conferida) : "",
      embarque_quantidade_conferida: transferData.embarque_quantidade_conferida ? String(transferData.embarque_quantidade_conferida) : "",
      observacao: "",
      status_final: "",
      lom: transferData.lom != null ? String(transferData.lom) : "",
      responsavel_conf: userResponsible,
    });
    

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
    const { name, value } = e.target;
    setErrorMsg(null);

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

    setForm(prev => ({ ...prev, [name]: value }));
  };

  // ===== Handle submit =====
  const handleSubmit = async () => {
    setErrorMsg(null);
    const errors: string[] = [];

    if (!form.id) errors.push(t('idRequired'));
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

      // Payload minimalista - envia SOMENTE o necessário
      const payload: any = {
        id: form.id,
        status_final: form.status_final,
        observacao: form.observacao || "",
        responsavel_conf: form.responsavel_conf || "",
        lom: form.lom && form.lom.trim() !== "" ? form.lom : null
      };

      // Apenas adiciona data_inicio_quarentena se status for Quarentena
      if (form.status_final === "Quarentena") {
        // Define data atual no formato esperado pelo SQL Server (ISO 8601)
        const now = new Date();
        payload.data_inicio_quarentena = now.toISOString().split('T')[0]; // YYYY-MM-DD
      }

      const response = await fetch("http://10.15.3.30:9280/api/embarque/confirmar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'x-user-name': user?.username || '',
          'x-user-type': user?.user_type || ''
        },
        body: JSON.stringify(payload),
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
              🇧🇷 PT
            </button>
            <button
              type="button"
              className={`language-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en')}
            >
              🇺🇸 EN
            </button>
          </div>
          <button
            className="btn-secondary"
            onClick={() => navigate("/embarque")}
            style={{ marginLeft: "12px" }}
          >
            ⬅ {t('backToShipment')}
          </button>
        </div>
      </div>

      <div className="filter-section">
        <h2 className="section-title">🚢 {t('shipmentTransfer')}</h2>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 className="section-title">📅 {t('origin')}</h3>
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
            <h3 className="section-title">⚓ {t('destination')}</h3>
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

        <h3 className="section-title" style={{ marginTop: 24 }}>📋 {t('details')}</h3>

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
              <label className="field-label">📝 {t('observation')}</label>
              <input name="observacao" className="form-input" value={form.observacao} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="field-label">📑 {t('lom')}</label>
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
              <input
                readOnly
                className="form-input"
                value={formatDateTime(form.data_inicio_quarentena)}
              />
            </div>
          </div>
        )}

        <div className="form-group" style={{ marginTop: 24 }}>
          <label>� {t('shipmentImage')}</label>
          {imageBlobUrl ? (
            <img
              src={imageBlobUrl}
              alt="Imagem do embarque"
              style={{ maxWidth: "100%", marginTop: 8, borderRadius: 8 }}
            />
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

        {/* Mensagem de erro/log agora no FINAL da tela */}
        {errorMsg && (
          <div style={{
            color: "#fff",
            background: "#e53935",
            padding: "10px 18px",
            borderRadius: 8,
            marginTop: 28,
            fontWeight: 500
          }}>
            {errorMsg.split("\n").map((m, idx) => <div key={idx}>{m}</div>)}
          </div>
        )}

        <div style={{ marginTop: "24px" }}>
          <button className="btn-primary" onClick={handleSubmit}>
            ✅ {t('finalize')}
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