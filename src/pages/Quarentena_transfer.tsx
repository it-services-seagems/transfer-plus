import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ChangeEvent } from "react";
import "../styles/main.css";
import { useAlert, AlertProvider } from "../components/AlertProvider";

// ===== Interfaces =====
interface User {
  username: string;
  email: string;
  user_type: 'ADMIN' | 'DESEMBARQUE' | 'CONFERENTE' | 'EMBARQUE';
  success: boolean;
}

interface FormDataState {
  id: number;
  FromVessel_NavioOrigem: string;
  ToVessel_NavioDestino: string;
  FromDepartment_DepartamentoOrigem: string;
  ToDepartment_DepartamentoDestino: string;
  PRNumberTMMaster_NumeroPRTMMaster: string;
  OraclePRNumber_NumeroPROracle: string;
  SPN: string;
  ItemDescription_DescricaoItem: string;
  OriginAllocatedPosition_PosicaoAlocadaOrigem: string;
  data_inicio_quarentena: string;
  data_fim_quarentena: string;
  conferencia_quantidade_conferida?: number | string;
  desembarque_quantidade_conferida?: number | string;
  observacao: string;
  responsavel_conf: string;
  TotalAmount_USD_ValorTotal_USD?: string;
  status_final: string;
}

const QuarentenaTransfer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormDataState>({} as FormDataState);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [language, setLanguage] = useState('pt-br');
  const showAlert = useAlert();

  // ===== Tradução =====
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'pt-br': {
        // Títulos
        'quarantine': 'QUARENTENA',
        'origin': 'ORIGEM',
        'destination': 'DESTINO',
        'details': 'DETALHES',

        // Campos
        'originVessel': 'NAVIO DE ORIGEM',
        'originDepartment': 'DEPARTAMENTO DE ORIGEM',
        'originPosition': 'POSIÇÃO FÍSICA DE ORIGEM',
        'destinationVessel': 'NAVIO DE DESTINO',
        'destinationDepartment': 'DEPARTAMENTO DE DESTINO',
        'prTmMaster': 'PR TM MASTER (REQUISIÇÃO DE COMPRA NO TM MASTER)',
        'prOracle': 'PR ORACLE (REQUISIÇÃO DE COMPRA NO ORACLE)',
        'spn': 'SPN (SPARE PART NUMBER NO TM MASTER)',
        'itemDescription': 'DESCRIÇÃO DO ITEM',
        'quarantineStart': 'INÍCIO QUARENTENA',
        'landedQuantity': 'QUANTIDADE DESEMBARCADA',
        'conferredQuantity': 'QUANTIDADE CONFERIDA',
        'quarantineEnd': 'FIM QUARENTENA',
        'responsible': 'RESPONSÁVEL',
        'observation': 'OBSERVAÇÃO',
        'finalStatus': 'STATUS FINAL',

        // Placeholders
        'destinationDeptPlaceholder': 'Informe o departamento de destino',
        'conferredQtyPlaceholder': 'QUANTIDADE CONFERIDA',

        // Ações
        'submitConference': 'SUBMETER CONFERÊNCIA',
        'backToConference': 'Voltar para Conferência',

        // Status
        'select': 'Selecione',
        'prIncomplete': 'PR Incompleta',
        'awaitingReturn': 'Aguardando Retorno',
        'sentToShipment': 'Enviado para Embarque',

        // Mensagens
        'selectFinalStatus': 'Selecione o status final.',
        'fillEndDate': 'Preencha a data de fim da quarentena.',
        'quarantineUpdated': ' Quarentena atualizada com sucesso!',
        'submitError': 'Erro ao submeter: '
      },
      'en': {
        // Títulos
        'quarantine': 'QUARANTINE',
        'origin': 'ORIGIN',
        'destination': 'DESTINATION',
        'details': 'DETAILS',

        // Campos
        'originVessel': 'ORIGIN VESSEL',
        'originDepartment': 'ORIGIN DEPARTMENT',
        'originPosition': 'ORIGIN PHYSICAL POSITION',
        'destinationVessel': 'DESTINATION VESSEL',
        'destinationDepartment': 'DESTINATION DEPARTMENT',
        'prTmMaster': 'PR TM MASTER (PURCHASE REQUEST IN TM MASTER)',
        'prOracle': 'PR ORACLE (PURCHASE REQUEST IN ORACLE)',
        'spn': 'SPN (SPARE PART NUMBER IN TM MASTER)',
        'itemDescription': 'ITEM DESCRIPTION',
        'quarantineStart': 'QUARANTINE START',
        'landedQuantity': 'LANDED QUANTITY',
        'conferredQuantity': 'CONFERRED QUANTITY',
        'quarantineEnd': 'QUARANTINE END',
        'responsible': 'RESPONSIBLE',
        'observation': 'OBSERVATION',
        'finalStatus': 'FINAL STATUS',

        // Placeholders
        'destinationDeptPlaceholder': 'Enter destination department',
        'conferredQtyPlaceholder': 'CONFERRED QUANTITY',

        // Ações
        'submitConference': 'SUBMIT CONFERENCE',
        'backToConference': 'Back to Conference',

        // Status
        'select': 'Select',
        'prIncomplete': 'PR Incomplete',
        'awaitingReturn': 'Awaiting Return',
        'sentToShipment': 'Sent to Shipment',

        // Mensagens
        'selectFinalStatus': 'Select final status.',
        'fillEndDate': 'Fill in quarantine end date.',
        'quarantineUpdated': '✅ Quarantine updated successfully!',
        'submitError': 'Submit error: '
      }
    };

    return translations[language]?.[key] || key;
  };

  const inconsistentes = ["Indefinido", "N/A", "NULL", "NaN", "Sem Departamento"];
  const isDestinoEditavel =
    !form.ToDepartment_DepartamentoDestino ||
    inconsistentes.includes(String(form.ToDepartment_DepartamentoDestino).trim());

  // ===== Carregar usuário =====
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    }
  }, []);

  useEffect(() => {
    const transferData = location.state as FormDataState;

    if (!transferData) {
      navigate("/quarentena");
      return;
    }

    const userStorage = localStorage.getItem("user");
    let username = "Usuário logado";
    if (userStorage) {
      try {
        const parsed = JSON.parse(userStorage);
        if (parsed.username) username = parsed.username;
      } catch {
        username = "Usuário logado";
      }
    }

    setForm({
      ...transferData,
      responsavel_conf: username,
      status_final: "",
      data_fim_quarentena: transferData.data_fim_quarentena || "",
      observacao: transferData.observacao || "",
    });
  }, [location, navigate]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    // Retorna formato ISO completo com hora: YYYY-MM-DDTHH:MM:SS
    return date.toISOString().slice(0, 19);
  };

  // Formatar datetime para exibição brasileira: DD/MM/YYYY HH:MM
  const formatDateTime = (dateTimeStr: string | undefined) => {

    if (!dateTimeStr || dateTimeStr === "null" || dateTimeStr === "undefined") {
      return "";
    }

    try {
      // Remove espaços extras e converte para formato ISO
      const cleanStr = String(dateTimeStr).trim().replace(' ', 'T');

      const date = new Date(cleanStr);

      if (isNaN(date.getTime())) {
        return String(dateTimeStr);
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      const formatted = `${day}/${month}/${year} ${hours}:${minutes}`;
      return formatted;
    } catch (error) {
      console.error("🕐 formatDateTime ERRO:", error);
      return String(dateTimeStr);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === "conferencia_quantidade_conferida" || name === "desembarque_quantidade_conferida") {
      setForm(prev => ({
        ...prev,
        [name]: value.replace(",", "."),
      }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDepartamentoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      ToDepartment_DepartamentoDestino: value,
    }));
  };

  // ===== Change language =====
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!form.status_final) {
      setErrorMsg(t('selectFinalStatus'));
      return;
    }
    if (!form.data_fim_quarentena) {
      setErrorMsg(t('fillEndDate'));
      return;
    }

    // Sempre envia datas no formato aceito pelo SQL Server
    const payload = {
      ...form,
      data_inicio_quarentena: formatDate(form.data_inicio_quarentena),
      data_fim_quarentena: formatDate(form.data_fim_quarentena),
      conferencia_quantidade_conferida: form.conferencia_quantidade_conferida ?? "",
      TotalAmount_USD_ValorTotal_USD: form.TotalAmount_USD_ValorTotal_USD ?? "",
    };

    try {
      const response = await fetch("http://10.15.3.30:9280/api/quarentena/atualizar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-name": user?.username || '',
          "x-user-type": user?.user_type || ''
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (result.status !== "success") throw new Error(result.message);

      showAlert(t('quarantineUpdated'), 'success');
      navigate("/quarentena");
    } catch (err: any) {
      console.error("❌ Erro completo:", err);
      setErrorMsg(`${t('submitError')}${err.message}`);
    }
  };

  if (!user) {
    return <div className="loading-screen">🔄 Carregando...</div>;
  }

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
            onClick={() => navigate("/conferencia")}
            style={{ marginLeft: "12px" }}
          >
            ⬅ {t('backToConference')}
          </button>
        </div>
      </div>

      <div className="filter-section">
        <h2 className="section-title">🧪 {t('quarantine')}</h2>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <h3 className="section-title">🚢 {t('origin')}</h3>
            <div className="form-group">
              <label className="field-label">{t('originVessel')}</label>
              <input readOnly className="form-input" value={form.FromVessel_NavioOrigem ?? ""} />
            </div>
            <div className="form-group">
              <label className="field-label">{t('originDepartment')}</label>
              <input readOnly className="form-input" value={form.FromDepartment_DepartamentoOrigem ?? ""} />
            </div>
            <div className="form-group">
              <label className="field-label">{t('originPosition')}</label>
              <input readOnly className="form-input" value={form.OriginAllocatedPosition_PosicaoAlocadaOrigem ?? ""} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h3 className="section-title">⚓ {t('destination')}</h3>
            <div className="form-group">
              <label className="field-label">{t('destinationVessel')}</label>
              <input readOnly className="form-input" value={form.ToVessel_NavioDestino ?? ""} />
            </div>
            <div className="form-group">
              <label className="field-label">{t('destinationDepartment')}</label>
              <input
                type="text"
                name="ToDepartment_DepartamentoDestino"
                className="form-input"
                value={form.ToDepartment_DepartamentoDestino || ""}
                onChange={handleDepartamentoChange}
                readOnly={!isDestinoEditavel}
                placeholder={isDestinoEditavel ? t('destinationDeptPlaceholder') : ""}
              />
            </div>
            <div className="form-group">
              <label className="field-label">{t('prTmMaster')}</label>
              <input readOnly className="form-input" value={form.PRNumberTMMaster_NumeroPRTMMaster ?? ""} />
            </div>
            <div className="form-group">
              <label className="field-label">{t('prOracle')}</label>
              <input readOnly className="form-input" value={form.OraclePRNumber_NumeroPROracle ?? ""} />
            </div>
          </div>
        </div>

        <h3 className="section-title" style={{ marginTop: "24px" }}>📋 {t('details')}</h3>

        <div className="details-layout">
          {/* Linha 1: Descrição do Item */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t('itemDescription')}</label>
              <input readOnly className="form-input" value={form.ItemDescription_DescricaoItem || ""} />
            </div>
          </div>

          {/* Linha 2: SPN / Início Quarentena */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t('spn')}</label>
              <input readOnly className="form-input" value={form.SPN || ""} />
            </div>
            <div className="form-group">
              <label className="field-label">{t('quarantineStart')}</label>
              <input
                readOnly
                className="form-input"
                value={formatDateTime(form.data_inicio_quarentena).split(' ')[0]}
                placeholder="Data não disponível"
                style={{ color: form.data_inicio_quarentena ? '#000' : '#999' }}
              />
            </div>
          </div>

          {/* Linha 3: Quantidade Desembarcada / Quantidade Conferida */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t('landedQuantity')}</label>
              <input readOnly className="form-input" value={form.desembarque_quantidade_conferida ?? ""} />
            </div>
            <div className="form-group">
              <label className="field-label">{t('conferredQuantity')}</label>
              <input
                name="conferencia_quantidade_conferida"
                className="form-input"
                value={form.conferencia_quantidade_conferida ?? ""}
                onChange={handleChange}
                type="number"
                min="0"
                step="any"
                placeholder={t('conferredQtyPlaceholder')}
                required
              />
            </div>
          </div>

          {/* Linha 4: Fim Quarentena / Responsável */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t('quarantineEnd')} <span style={{ color: "red" }}>*</span></label>
              <input
                type="date"
                name="data_fim_quarentena"
                className="form-input"
                value={form.data_fim_quarentena ? form.data_fim_quarentena.slice(0, 10) : ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="field-label">{t('responsible')}</label>
              <input readOnly className="form-input" value={form.responsavel_conf || ""} />
            </div>
          </div>

          {/* Linha 5: Observação / Status Final */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">📝 {t('observation')}</label>
              <input name="observacao" className="form-input" value={form.observacao || ""} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="field-label">{t('finalStatus')}</label>
              <select name="status_final" className="form-input" value={form.status_final || ""} onChange={handleChange}>
                <option value="">{t('select')}</option>
                <option value="PR INCOMPLETA">{t('prIncomplete')}</option>
                <option value="Aguardando Retorno">{t('awaitingReturn')}</option>
                <option value="Enviado para Embarque">{t('sentToShipment')}</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "24px" }}>
          <button className="btn-primary" onClick={handleSubmit}>
            ✅ {t('submitConference')}
          </button>
        </div>

        {errorMsg && (
          <div style={{
            color: "#fff",
            background: "#e63946",
            padding: "16px 24px",
            borderRadius: "8px",
            marginTop: 16,
            fontWeight: "bold"
          }}>
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};

// Wrapper do componente com AlertProvider
function QuarentenaTransferWithProvider() {
  return (
    <AlertProvider>
      <QuarentenaTransfer />
    </AlertProvider>
  );
}

export default QuarentenaTransferWithProvider;