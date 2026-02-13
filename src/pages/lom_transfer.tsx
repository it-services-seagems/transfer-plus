import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/main.css";

interface UserStorage {
  username: string;
  email?: string;
  user_type: "ADMIN" | "DESEMBARQUE" | "CONFERENTE" | "EMBARQUE";
  success?: boolean;
}

interface FormDataState {
  id: number;

  FromVessel_NavioOrigem: string;
  ToVessel_NavioDestino: string;

  FromDepartment_DepartamentoOrigem?: string | null;
  ToDepartment_DepartamentoDestino?: string | null;

  PRNumberTMMaster_NumeroPRTMMaster: string;
  OraclePRNumber_NumeroPROracle: string;

  SPN: string;
  ItemDescription_DescricaoItem: string;

  OriginAllocatedPosition_PosicaoAlocadaOrigem?: string | null;
  QuantityToBeTransferred_QuantidadeATransferir?: string | number | null;

  // Campos LOM
  lom?: string | null;
  observacao_lom?: string | null;

  // Quantidades (se vierem da lista)
  conferencia_quantidade_conferida?: number | null;
  desembarque_quantidade_conferida?: number | null;

  // Responsável que submete
  responsavel_conf?: string;

  // (opcional) pode ter vindo da navegação anterior
  username?: string;
}

const LomTransfer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserStorage | null>(null);
  const [form, setForm] = useState<FormDataState>({} as FormDataState);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [language, setLanguage] = useState<"pt-br" | "en">("pt-br");

  // ============== Tradução ==============
  const t = useMemo(() => {
    const translations: Record<"pt-br" | "en", Record<string, string>> = {
      "pt-br": {
        updateLom: "ATUALIZAR LOM",
        origin: "ORIGEM",
        destination: "DESTINO",
        details: "DETALHES",

        originVessel: "NAVIO DE ORIGEM",
        originDepartment: "DEPARTAMENTO DE ORIGEM",
        originPosition: "POSIÇÃO FÍSICA DE ORIGEM",

        destinationVessel: "NAVIO DE DESTINO",
        destinationDepartment: "DEPARTAMENTO DE DESTINO",

        prTmMaster: "PR TM MASTER (REQUISIÇÃO DE COMPRA NO TM MASTER)",
        prOracle: "PR ORACLE (REQUISIÇÃO DE COMPRA NO ORACLE)",

        spn: "SPN (SPARE PART NUMBER NO TM MASTER)",
        itemDescription: "DESCRIÇÃO DO ITEM",
        item: "ITEM",
        lom: "LOM",
        lomObservation: "OBSERVAÇÃO LOM",
        responsible: "RESPONSÁVEL",
        requestedQuantity: "QUANTIDADE SOLICITADA PARA TRANSFERÊNCIA",
        qtyCheckedConf: "QTDE CONFERÊNCIA",
        qtyCheckedUnload: "QTDE DESEMBARQUE",

        lomCodePlaceholder: "Informe o código LOM",
        lomObservationPlaceholder: "Observação LOM",

        update: "Atualizar LOM",
        sending: "Enviando...",
        cancel: "Cancelar",
        backToConference: "Voltar para Conferência",

        lomRequired: "O campo LOM é obrigatório.",
        responsibleRequired: "O campo Responsável é obrigatório.",
        requestError: "Erro na requisição: ",
        updateError: "Erro ao atualizar LOM.",
        submitError: "Erro ao submeter: ",
        unknownError: "Erro desconhecido",
        successUpdate: "✅ Registro atualizado com sucesso!",
      },
      en: {
        updateLom: "UPDATE LOM",
        origin: "ORIGIN",
        destination: "DESTINATION",
        details: "DETAILS",

        originVessel: "ORIGIN VESSEL",
        originDepartment: "ORIGIN DEPARTMENT",
        originPosition: "ORIGIN PHYSICAL POSITION",

        destinationVessel: "DESTINATION VESSEL",
        destinationDepartment: "DESTINATION DEPARTMENT",

        prTmMaster: "PR TM MASTER (PURCHASE REQUEST IN TM MASTER)",
        prOracle: "PR ORACLE (PURCHASE REQUEST IN ORACLE)",

        spn: "SPN (SPARE PART NUMBER IN TM MASTER)",
        itemDescription: "ITEM DESCRIPTION",
        item: "ITEM",
        lom: "LOM",
        lomObservation: "LOM OBSERVATION",
        responsible: "RESPONSIBLE",
        requestedQuantity: "REQUESTED QUANTITY FOR TRANSFER",
        qtyCheckedConf: "QTY CONFERENCE",
        qtyCheckedUnload: "QTY UNLOADED",

        lomCodePlaceholder: "Enter LOM code",
        lomObservationPlaceholder: "LOM Observation",

        update: "Update LOM",
        sending: "Sending...",
        cancel: "Cancel",
        backToConference: "Back to Conference",

        lomRequired: "LOM field is required.",
        responsibleRequired: "Responsible field is required.",
        requestError: "Request error: ",
        updateError: "Error updating LOM.",
        submitError: "Submit error: ",
        unknownError: "Unknown error",
        successUpdate: "✅ Record updated successfully!",
      },
    };
    return (key: string) => translations[language][key] || key;
  }, [language]);

  // ============== Init: usuário + state da navegação ==============
  useEffect(() => {
    const userStorage = localStorage.getItem("user");
    let parsedUser: UserStorage | null = null;
    if (userStorage) {
      try {
        parsedUser = JSON.parse(userStorage) as UserStorage;
      } catch {
        parsedUser = null;
      }
    }
    setUser(parsedUser);

    const transferData = location.state as FormDataState | undefined;
    if (!transferData) {
      navigate("/lom");
      return;
    }

    const responsavel =
      parsedUser?.username || transferData.username || "Usuário Logado";

    setForm({
      ...transferData,
      lom: transferData.lom ?? "",
      observacao_lom: transferData.observacao_lom ?? "",
      responsavel_conf: responsavel,
    });
  }, [location, navigate]);

  // ============== Handlers ==============
  const handleLanguageChange = (newLanguage: "pt-br" | "en") => {
    setLanguage(newLanguage);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setErro(null);

    if (!form?.lom || !form.lom.trim()) {
      setErro(t("lomRequired"));
      return;
    }
    if (!form?.responsavel_conf || !form.responsavel_conf.trim()) {
      setErro(t("responsibleRequired"));
      return;
    }

    try {
      setLoading(true);

      const payload = {
        id: form.id,
        lom: form.lom,
        observacao_lom: form.observacao_lom ?? "",
        responsavel_conf: form.responsavel_conf,
      };

      const res = await axios.post(
        "http://10.15.3.30:9280/api/lom/atualizar",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            // autenticação por header (AD via backend)
            "x-user-name": user?.username || form.username || "",
            "x-user-type": user?.user_type || "EMBARQUE",
          },
        }
      );

      if (res.data?.status !== "success") {
        setErro(res.data?.message || t("updateError"));
        setLoading(false);
        return;
      }

      alert(t("successUpdate"));
      navigate("/lom");
    } catch (err: any) {
      setErro(t("submitError") + (err?.message || t("unknownError")));
    } finally {
      setLoading(false);
    }
  };

  // ============== Render ==============
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
        </div>
        <div className="page-actions">
          <div className="language-selector">
            <button
              type="button"
              className={`language-btn ${language === "pt-br" ? "active" : ""}`}
              onClick={() => handleLanguageChange("pt-br")}
            >
              🇧🇷 PT
            </button>
            <button
              type="button"
              className={`language-btn ${language === "en" ? "active" : ""}`}
              onClick={() => handleLanguageChange("en")}
            >
              🇺🇸 EN
            </button>
          </div>
          <button
            className="btn-secondary"
            onClick={() => navigate("/conferencia")}
            style={{ marginLeft: "12px" }}
          >
            ⬅ {t("backToConference")}
          </button>
        </div>
      </div>

      {/* Blocos de Origem/Destino */}
      <div className="filter-section">
        <h2 className="section-title">📄 {t("updateLom")}</h2>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {/* ORIGEM */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 className="section-title">🚢 {t("origin")}</h3>

            <div className="form-group">
              <label className="field-label">{t("originVessel")}</label>
              <input
                readOnly
                className="form-input"
                value={form.FromVessel_NavioOrigem || ""}
              />
            </div>

            <div className="form-group">
              <label className="field-label">{t("originDepartment")}</label>
              <input
                readOnly
                className="form-input"
                value={form.FromDepartment_DepartamentoOrigem || ""}
              />
            </div>

            <div className="form-group">
              <label className="field-label">{t("originPosition")}</label>
              <input
                readOnly
                className="form-input"
                value={form.OriginAllocatedPosition_PosicaoAlocadaOrigem || ""}
              />
            </div>
          </div>

          {/* DESTINO */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 className="section-title">⚓ {t("destination")}</h3>

            <div className="form-group">
              <label className="field-label">{t("destinationVessel")}</label>
              <input
                readOnly
                className="form-input"
                value={form.ToVessel_NavioDestino || ""}
              />
            </div>

            <div className="form-group">
              <label className="field-label">{t("destinationDepartment")}</label>
              <input
                readOnly
                className="form-input"
                value={form.ToDepartment_DepartamentoDestino || ""}
              />
            </div>

            <div className="form-group">
              <label className="field-label">{t("prTmMaster")}</label>
              <input
                readOnly
                className="form-input"
                value={form.PRNumberTMMaster_NumeroPRTMMaster || ""}
              />
            </div>

            <div className="form-group">
              <label className="field-label">{t("prOracle")}</label>
              <input
                readOnly
                className="form-input"
                value={form.OraclePRNumber_NumeroPROracle || ""}
              />
            </div>
          </div>
        </div>

        {/* Detalhes / Edição de LOM */}
        <h3 className="section-title" style={{ marginTop: 24 }}>
          📋 {t("details")}
        </h3>

        <div className="details-layout">
          {/* Linha 1: Descrição do Item */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t("itemDescription")}</label>
              <input readOnly className="form-input" value={form.ItemDescription_DescricaoItem || ""} />
            </div>
          </div>

          {/* Linha 2: SPN / Quantidade Solicitada */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t("spn")}</label>
              <input readOnly className="form-input" value={form.SPN || ""} />
            </div>
            <div className="form-group">
              <label className="field-label">{t("requestedQuantity")}</label>
              <input readOnly className="form-input" value={form.QuantityToBeTransferred_QuantidadeATransferir ?? ""} />
            </div>
          </div>

          {/* Linha 3: Qtde Conferência / Qtde Desembarque */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t("qtyCheckedConf")}</label>
              <input readOnly className="form-input" value={form.conferencia_quantidade_conferida ?? ""} />
            </div>
            <div className="form-group">
              <label className="field-label">{t("qtyCheckedUnload")}</label>
              <input readOnly className="form-input" value={form.desembarque_quantidade_conferida ?? ""} />
            </div>
          </div>

          {/* Linha 4: LOM / Observação LOM */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t("lom")}</label>
              <input
                name="lom"
                className="form-input"
                value={form.lom || ""}
                onChange={handleChange}
                placeholder={t("lomCodePlaceholder")}
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label className="field-label">{t("lomObservation")}</label>
              <input
                name="observacao_lom"
                className="form-input"
                value={form.observacao_lom || ""}
                onChange={handleChange}
                placeholder={t("lomObservationPlaceholder")}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Linha 5: Responsável (centralizado) */}
          <div className="detail-row">
            <div className="form-group">
              <label className="field-label">{t("responsible")}</label>
              <input
                readOnly
                className="form-input"
                value={form.responsavel_conf || ""}
              />
            </div>
            <div className="form-group">
              {/* Campo vazio para manter o layout de duas colunas */}
            </div>
          </div>
        </div>

        {/* Mensagens */}
        {erro && (
          <div className="alert warning" style={{ marginTop: 12 }}>
            {erro}
          </div>
        )}

        {/* Ações */}
        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          <button className="btn-secondary" onClick={() => navigate("/lom")} disabled={loading}>
            ↩️ {t("cancel")}
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? t("sending") : `✅ ${t("update")}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LomTransfer;