import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "../styles/main.css";
import { useNavigate } from "react-router-dom";

// ===== Interfaces =====
interface User {
  username: string;
  email: string;
  user_type: "ADMIN" | "DESEMBARQUE" | "CONFERENTE" | "EMBARQUE";
  success: boolean;
}

interface LomItem {
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
  lom?: string | null;
  observacao_lom?: string | null;
  conferencia_quantidade_conferida?: number | null;
  desembarque_quantidade_conferida?: number | null;
}

interface Filtros {
  FromVessel_NavioOrigem: string;
  ToVessel_NavioDestino: string;
  PRNumberTMMaster_NumeroPRTMMaster: string;
  OraclePRNumber_NumeroPROracle: string;
  ItemDescription_DescricaoItem: string;
  SPN: string;
}

// ====== Constantes iniciais ======
const initialFiltros: Filtros = {
  FromVessel_NavioOrigem: "",
  ToVessel_NavioDestino: "",
  PRNumberTMMaster_NumeroPRTMMaster: "",
  OraclePRNumber_NumeroPROracle: "",
  ItemDescription_DescricaoItem: "",
  SPN: "",
};

// Configure a baseURL apenas uma vez neste módulo
axios.defaults.baseURL = "http://10.15.3.30:9280";

const Lom: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(initialFiltros);
  const [resultados, setResultados] = useState<LomItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [language, setLanguage] = useState<"pt-br" | "en">("pt-br");
  const [erro, setErro] = useState<string>("");

  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  // ===== Tradução =====
  const t = useMemo(() => {
    const translations: Record<string, Record<string, string>> = {
      "pt-br": {
        // Títulos e Navegação
        lomPending: "LOM PENDENTE",
        conference: "CONFERÊNCIA",
        quarantine: "Quarentena",
        filters: "FILTROS",
        results: "Resultados",

        // Filtros
        origin: "ORIGEM",
        destination: "DESTINO",
        prTmMaster: "PR TM MASTER (REQUISIÇÃO DE COMPRA NO TM MASTER)",
        prOracle: "PR ORACLE (REQUISIÇÃO DE COMPRA NO ORACLE)",
        itemDescription: "DESCRIÇÃO DO ITEM",

        // Ações
        search: "Buscar",
        clear: "Limpar",
        searching: "Buscando...",
        update: "ATUALIZAR",

        // Resultados
        noItems: "Nenhum item encontrado.",

        // Labels dos campos
        originLabel: "ORIGEM",
        destinationLabel: "DESTINO",
        item: "ITEM",
        originDepartment: "DEPARTAMENTO ORIGEM",
        physicalOriginPosition: "POSIÇÃO FÍSICA DE ORIGEM",
        requestedQuantity: "QUANTIDADE SOLICITADA PARA TRANSFERÊNCIA",

        // Extras
        qtyCheckedConf: "QTDE CONFERÊNCIA",
        qtyCheckedUnload: "QTDE DESEMBARQUE",
        admin: "Administrator",
        'backToMenu': 'Voltar ao Menu'
      },
      en: {
        'backToMenu': 'Back to Menu',
        // Titles and Navigation
        lomPending: "PENDING LOM",
        conference: "CONFERENCE",
        quarantine: "Quarantine",
        filters: "FILTERS",
        results: "Results",

        // Filters
        origin: "ORIGIN",
        destination: "DESTINATION",
        prTmMaster: "PR TM MASTER (PURCHASE REQUEST IN TM MASTER)",
        prOracle: "PR ORACLE (PURCHASE REQUEST IN ORACLE)",
        itemDescription: "ITEM DESCRIPTION",

        // Actions
        search: "Search",
        clear: "Clear",
        searching: "Searching...",
        update: "UPDATE",

        // Results
        noItems: "No items found.",

        // Field labels
        originLabel: "ORIGIN",
        destinationLabel: "DESTINATION",
        item: "ITEM",
        originDepartment: "ORIGIN DEPARTMENT",
        physicalOriginPosition: "PHYSICAL ORIGIN POSITION",
        requestedQuantity: "REQUESTED QUANTITY FOR TRANSFER",

        // Extras
        qtyCheckedConf: "QTY CONFERENCE",
        qtyCheckedUnload: "QTY UNLOADED",
        admin: "Administrator",
      },
    };

    return (key: string) => translations[language]?.[key] || key;
  }, [language]);

  // ===== Montagem / desmontagem =====
  useEffect(() => {
    isMountedRef.current = true;
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed: User = JSON.parse(userStr);
        setUser(parsed);
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ===== Buscar dados iniciais quando o usuário estiver disponível =====
  useEffect(() => {
    if (user) {
      buscar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ===== Normaliza params (trim) =====
  const normalizedParams = useMemo(() => {
    const entries = Object.entries(filtros)
      .map<[keyof Filtros, string]>(([k, v]) => [k as keyof Filtros, (v ?? "").trim()])
      .filter(([, v]) => v !== "");
    return Object.fromEntries(entries) as Partial<Filtros>;
  }, [filtros]);

  // ===== Buscar dados =====
  const buscar = async () => {
    if (!user) return;
    setLoading(true);
    setErro("");

    try {
      const res = await axios.get("/api/lom", {
        params: normalizedParams,
        headers: {
          "x-user-name": user.username,
          "x-user-type": user.user_type,
        },
      });

      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      if (isMountedRef.current) {
        setResultados(data);
      }
    } catch (err: any) {
      console.error("❌ Erro ao buscar LOM:", err);
      if (isMountedRef.current) {
        setResultados([]);
        setErro(
          err?.response?.data?.message ||
          "Falha ao buscar dados. Tente novamente."
        );
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  // ===== Limpar filtros =====
  const limpar = () => {
    setFiltros(initialFiltros);
    setResultados([]);
    setErro("");
  };

  // ===== Change language =====
  const handleLanguageChange = (newLanguage: "pt-br" | "en") => {
    setLanguage(newLanguage);
  };

  if (!user) {
    return <div className="loading-screen">🔄 Carregando...</div>;
  }

  const isAdmin = user.user_type === "ADMIN";

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>📑 {t("lomPending")}</h1>
          {isAdmin && <span className="admin-badge">{t("admin")}</span>}
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

          <div style={{ display: "flex", gap: "12px", marginLeft: "12px" }}>
            <button className="btn-secondary" onClick={() => navigate("/conferencia")}>
              🧾 {t("conference")}
            </button>
            <button className="btn-warning" onClick={() => navigate("/quarentena")}>
              🧬 {t("quarantine")}
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
        <h2 className="section-title">🔍 {t("filters")}</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            buscar();
          }}
        >
          <div className="filter-grid">
            <div className="form-group">
              <label className="field-label">🚢 {t("origin")}</label>
              <input
                type="text"
                name="FromVessel_NavioOrigem"
                className="form-input"
                value={filtros.FromVessel_NavioOrigem}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, FromVessel_NavioOrigem: e.target.value }))
                }
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="field-label">🎯 {t("destination")}</label>
              <input
                type="text"
                name="ToVessel_NavioDestino"
                className="form-input"
                value={filtros.ToVessel_NavioDestino}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, ToVessel_NavioDestino: e.target.value }))
                }
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="field-label">📋 {t("prTmMaster")}</label>
              <input
                type="text"
                name="PRNumberTMMaster_NumeroPRTMMaster"
                className="form-input"
                value={filtros.PRNumberTMMaster_NumeroPRTMMaster}
                onChange={(e) =>
                  setFiltros((f) => ({
                    ...f,
                    PRNumberTMMaster_NumeroPRTMMaster: e.target.value,
                  }))
                }
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="field-label">📋 {t("prOracle")}</label>
              <input
                type="text"
                name="OraclePRNumber_NumeroPROracle"
                className="form-input"
                value={filtros.OraclePRNumber_NumeroPROracle}
                onChange={(e) =>
                  setFiltros((f) => ({
                    ...f,
                    OraclePRNumber_NumeroPROracle: e.target.value,
                  }))
                }
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="field-label">📦 {t("itemDescription")}</label>
              <input
                type="text"
                name="ItemDescription_DescricaoItem"
                className="form-input"
                value={filtros.ItemDescription_DescricaoItem}
                onChange={(e) =>
                  setFiltros((f) => ({
                    ...f,
                    ItemDescription_DescricaoItem: e.target.value,
                  }))
                }
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="field-label">
                🔢 SPN (SPARE PART NUMBER NO TM MASTER)
              </label>
              <input
                type="text"
                name="SPN"
                className="form-input"
                value={filtros.SPN}
                onChange={(e) => setFiltros((f) => ({ ...f, SPN: e.target.value }))}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="buttons-container">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? `🔄 ${t("searching")}` : `🔍 ${t("search")}`}
              {loading && <span className="loading-spinner" />}
            </button>
            <button type="button" className="btn-secondary" onClick={limpar} disabled={loading}>
              🗑️ {t("clear")}
            </button>
          </div>

          {erro && (
            <div className="alert warning" style={{ marginTop: 12 }}>
              {erro}
            </div>
          )}
        </form>
      </section>

      {/* Resultados */}
      <section className="results-section">
        <h2 className="section-title">
          📊 {t("results")} ({resultados.length})
        </h2>

        <div className="results-grid">
          {resultados.length === 0 ? (
            <div className="no-results">📭 {t("noItems")}</div>
          ) : (
            resultados.map((row) => (
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
                      navigate("/lom_transfer", {
                        state: {
                          ...row,
                          username: user.username,
                        },
                      })
                    }
                  >
                    🛠️ {t("update")}
                  </button>
                </div>

                <div className="result-details">
                  <div className="detail-item">
                    <div className="detail-label">🚢 {t("originLabel")}</div>
                    <div className="detail-value">{row.FromVessel_NavioOrigem}</div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">🎯 {t("destinationLabel")}</div>
                    <div className="detail-value">{row.ToVessel_NavioDestino}</div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">📋 {t("prTmMaster")}</div>
                    <div className="detail-value">
                      {row.PRNumberTMMaster_NumeroPRTMMaster}
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">📋 {t("prOracle")}</div>
                    <div className="detail-value">{row.OraclePRNumber_NumeroPROracle}</div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">📦 {t("item")}</div>
                    <div className="detail-value">{row.ItemDescription_DescricaoItem}</div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">
                      🔢 SPN (SPARE PART NUMBER NO TM MASTER)
                    </div>
                    <div className="detail-value">{row.SPN}</div>
                  </div>

                  {row.FromDepartment_DepartamentoOrigem ? (
                    <div className="detail-item">
                      <div className="detail-label">🏢 {t("originDepartment")}</div>
                      <div className="detail-value">
                        {row.FromDepartment_DepartamentoOrigem}
                      </div>
                    </div>
                  ) : null}

                  {row.OriginAllocatedPosition_PosicaoAlocadaOrigem ? (
                    <div className="detail-item">
                      <div className="detail-label">📍 {t("physicalOriginPosition")}</div>
                      <div className="detail-value">
                        {row.OriginAllocatedPosition_PosicaoAlocadaOrigem}
                      </div>
                    </div>
                  ) : null}

                  {typeof row.QuantityToBeTransferred_QuantidadeATransferir !==
                    "undefined" && row.QuantityToBeTransferred_QuantidadeATransferir !== null && row.QuantityToBeTransferred_QuantidadeATransferir !== "" ? (
                    <div className="detail-item">
                      <div className="detail-label">📊 {t("requestedQuantity")}</div>
                      <div className="detail-value">
                        {row.QuantityToBeTransferred_QuantidadeATransferir}
                      </div>
                    </div>
                  ) : null}

                  {typeof row.conferencia_quantidade_conferida !== "undefined" ? (
                    <div className="detail-item">
                      <div className="detail-label">🧾 {t("qtyCheckedConf")}</div>
                      <div className="detail-value">
                        {row.conferencia_quantidade_conferida ?? "-"}
                      </div>
                    </div>
                  ) : null}

                  {typeof row.desembarque_quantidade_conferida !== "undefined" ? (
                    <div className="detail-item">
                      <div className="detail-label">⚓ {t("qtyCheckedUnload")}</div>
                      <div className="detail-value">
                        {row.desembarque_quantidade_conferida ?? "-"}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Lom;
