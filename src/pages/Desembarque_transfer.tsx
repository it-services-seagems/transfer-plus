import React, { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAlert, AlertProvider } from "../components/AlertProvider";
import "../styles/Desembarque_transfer.css";

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
    QuantityToBeTransferred_QuantidadeATransferir: string;
    conf_QuantidadeConferida: string;
    TotalAmount_USD_ValorTotal_USD: string;
    motivo_padrao: string;
    observacao: string;
    Sugestao_Minima: string;
    Sugestao_Maxima: string;
    responsavel_conf: string;
    image: File | null;
    username?: string;
}

// ====== Constantes ======
const motivosValidos = [
    "Estoque mínimo a bordo requerido",
    "Não operacional",
    "Ajuste de Inventário",
    "Material de Contrato",
    "Material de Projeto",
    "Material em uso (WIP)",
    "Outros"
];

const DesembarqueTransfer: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const showAlert = useAlert();

    const [user, setUser] = useState<User | null>(null);
    const [language, setLanguage] = useState('pt-br');
    const [form, setForm] = useState<FormDataState>({} as FormDataState);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [showMotivoPadrao, setShowMotivoPadrao] = useState(false);
    const [showJustificativa, setShowJustificativa] = useState(false);
    const [showSugestoes, setShowSugestoes] = useState(false);

    // ===== Tradução =====
    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            'pt-br': {
                'disembarkmentTransfer': 'TRANSFERÊNCIA DE DESEMBARQUE',
                'request': 'REQUISIÇÃO',
                'originVessel': 'NAVIO DE ORIGEM',
                'destinationVessel': 'NAVIO DE DESTINO',
                'itemInformation': 'Informações do Item',
                'vessel': 'NAVIO',
                'department': 'DEPARTAMENTO',
                'physicalOriginPosition': 'POSIÇÃO FÍSICA DE ORIGEM',
                'prTmMaster': 'PR TM MASTER (REQUISIÇÃO DE COMPRA NO TM MASTER)',
                'prOracle': 'PR ORACLE (REQUISIÇÃO DE COMPRA NO ORACLE)',
                'spn': 'SPN (SPARE PART NUMBER NO TM MASTER)',
                'itemDescription': 'DESCRIÇÃO DO ITEM',
                'requestedQuantity': 'QUANTIDADE SOLICITADA PARA TRANSFERÊNCIA',
                'conferredQuantity': 'QUANTIDADE CONFERIDA DESEMBARQUE',
                'divergenceReason': 'MOTIVO DA DIVERGÊNCIA',
                'divergenceJustification': 'JUSTIFICATIVA DA DIVERGÊNCIA',
                'responsible': 'RESPONSÁVEL',
                'minimumStockSuggestion': 'SUGESTÃO DE QUANTIDADE DE ESTOQUE MÍNIMO',
                'maximumStockSuggestion': 'SUGESTÃO DE QUANTIDADE DE ESTOQUE MÁXIMO',
                'minimumStockRequired': 'Estoque mínimo a bordo requerido',
                'notOperational': 'Não operacional',
                'inventoryAdjustment': 'Ajuste de Inventário',
                'contractMaterial': 'Material de Contrato',
                'projectMaterial': 'Material de Projeto',
                'materialInUse': 'Material em uso (WIP)',
                'others': 'Outros',
                'select': 'Selecione',
                'finalize': 'Finalizar',
                'backToDisembarkment': 'Voltar para Desembarque',
                'fieldErrors': 'Corrija os seguintes campos obrigatórios:',
                'idNotFound': 'ID de referência não encontrado.',
                'originDeptRequired': 'Departamento de Origem é obrigatório.',
                'positionRequired': 'Posição Alocada é obrigatória.',
                'invalidQuantity': 'Quantidade Conferida inválida.',
                'reasonRequired': 'Motivo Padrão é obrigatório.',
                'justificationRequired': 'Justificativa é obrigatória.',
                'minSuggestionRequired': 'Sugestão Mínima é obrigatória.',
                'maxSuggestionRequired': 'Sugestão Máxima é obrigatória.',
                'conferenceFinalized': 'Conferência finalizada sem lançamento em conferência (Qtd = 0).',
                'conferenceSuccess': 'Conferência registrada com sucesso!',
                'error': 'Erro',
                'unknownError': 'Erro desconhecido'
            },
            'en': {
                'disembarkmentTransfer': 'DISEMBARKMENT TRANSFER',
                'request': 'REQUEST',
                'originVessel': 'ORIGIN VESSEL',
                'destinationVessel': 'DESTINATION VESSEL',
                'itemInformation': 'Item Information',
                'vessel': 'VESSEL',
                'department': 'DEPARTMENT',
                'physicalOriginPosition': 'PHYSICAL ORIGIN POSITION',
                'prTmMaster': 'PR TM MASTER (PURCHASE REQUEST IN TM MASTER)',
                'prOracle': 'PR ORACLE (PURCHASE REQUEST IN ORACLE)',
                'spn': 'SPN (SPARE PART NUMBER IN TM MASTER)',
                'itemDescription': 'ITEM DESCRIPTION',
                'requestedQuantity': 'REQUESTED QUANTITY FOR TRANSFER',
                'conferredQuantity': 'CONFERRED QUANTITY  DISEMBAKMENT',
                'divergenceReason': 'DIVERGENCE REASON',
                'divergenceJustification': 'DIVERGENCE JUSTIFICATION',
                'responsible': 'RESPONSIBLE',
                'minimumStockSuggestion': 'MINIMUM STOCK QUANTITY SUGGESTION',
                'maximumStockSuggestion': 'MAXIMUM STOCK SUGGESTION',
                'minimumStockRequired': 'Minimum stock on board required',
                'notOperational': 'Not operational',
                'inventoryAdjustment': 'Inventory Adjustment',
                'contractMaterial': 'Contract Material',
                'projectMaterial': 'Project Material',
                'materialInUse': 'Material in use (WIP)',
                'others': 'Others',
                'select': 'Select',
                'finalize': 'Finalize',
                'backToDisembarkment': 'Back to Disembarkment',
                'fieldErrors': 'Please correct the following required fields:',
                'idNotFound': 'Reference ID not found.',
                'originDeptRequired': 'Origin Department is required.',
                'positionRequired': 'Allocated Position is required.',
                'invalidQuantity': 'Invalid Conferred Quantity.',
                'reasonRequired': 'Standard Reason is required.',
                'justificationRequired': 'Justification is required.',
                'minSuggestionRequired': 'Minimum Suggestion is required.',
                'maxSuggestionRequired': 'Maximum Suggestion is required.',
                'conferenceFinalized': 'Conference finalized without conference entry (Qty = 0).',
                'conferenceSuccess': 'Conference registered successfully!',
                'error': 'Error',
                'unknownError': 'Unknown error'
            }
        };
        return translations[language]?.[key] || key;
    };

    // ===== Traduzir motivos válidos =====
    const getTranslatedMotivos = () => ([
        t('minimumStockRequired'),
        t('notOperational'),
        t('inventoryAdjustment'),
        t('contractMaterial'),
        t('projectMaterial'),
        t('materialInUse'),
        t('others')
    ]);

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
        // Normalizar e mapear os dados vindos via location.state.
        // A interface Registro no Desembarque.tsx usa nomes específicos que precisam ser mapeados
        // para os nomes esperados pelo FormDataState aqui.
        const tdAny = location.state as any;
        if (!tdAny) {
            navigate("/desembarque");
            return;
        }

        // Mapear exatamente conforme os nomes da interface Registro → FormDataState
        const mapped: FormDataState = {
            id: tdAny.id ?? 0,
            FromVessel_NavioOrigem: tdAny.FromVessel_NavioOrigem ?? "",
            ToVessel_NavioDestino: tdAny.ToVessel_NavioDestino ?? "",
            FromDepartment_DepartamentoOrigem: tdAny.FromDepartment_DepartamentoOrigem ?? "",
            ToDepartment_DepartamentoDestino: tdAny.ToDepartment_DepartamentoDestino ?? "",
            // CRÍTICO: A interface Registro usa "PRNumberTMMaster_Nome", mas o form precisa de "PRNumberTMMaster_NumeroPRTMMaster"
            PRNumberTMMaster_NumeroPRTMMaster: tdAny.PRNumberTMMaster_Nome ?? tdAny.PRNumberTMMaster_NumeroPRTMMaster ?? "",
            // CRÍTICO: A interface Registro usa "OraclePRNumber_Numero", mas o form precisa de "OraclePRNumber_NumeroPROracle"
            OraclePRNumber_NumeroPROracle: tdAny.OraclePRNumber_Numero ?? tdAny.OraclePRNumber_NumeroPROracle ?? "",
            SPN: tdAny.SPN ?? "",
            // A interface Registro usa "ItemDescription_Descricao", mas o form precisa de "ItemDescription_DescricaoItem"
            ItemDescription_DescricaoItem: tdAny.ItemDescription_Descricao ?? tdAny.ItemDescription_DescricaoItem ?? "",
            OriginAllocatedPosition_PosicaoAlocadaOrigem: tdAny.OriginAllocatedPosition ?? tdAny.OriginAllocatedPosition_PosicaoAlocadaOrigem ?? "",
            // CRÍTICO: A interface Registro usa "QuantityToBeTransferred", mas o form precisa de "QuantityToBeTransferred_QuantidadeATransferir"
            QuantityToBeTransferred_QuantidadeATransferir: tdAny.QuantityToBeTransferred ?? tdAny.QuantityToBeTransferred_QuantidadeATransferir ?? "",
            conf_QuantidadeConferida: "0",
            // A interface Registro usa "TotalAmount_USD_Valor", mas o form precisa de "TotalAmount_USD_ValorTotal_USD"
            TotalAmount_USD_ValorTotal_USD: tdAny.TotalAmount_USD_Valor ?? tdAny.TotalAmount_USD_ValorTotal_USD ?? "",
            motivo_padrao: "",
            observacao: "",
            Sugestao_Minima: "",
            Sugestao_Maxima: "",
            responsavel_conf: tdAny.username || user?.username || "Usuário logado",
            image: null,
            username: tdAny.username ?? user?.username ?? undefined,
        };

        setForm(mapped);
    }, [location, navigate, user]);

    // ===== Change language =====
    const handleLanguageChange = (newLanguage: string) => setLanguage(newLanguage);

    // ===== Handle form changes =====
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === "file") {
            const fileInput = e.target as HTMLInputElement;
            const file = fileInput.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => setImagePreview(event.target?.result as string);
                reader.readAsDataURL(file);
                setForm((prev) => ({ ...prev, image: file }));
            }
            return;
        }

        setForm((prev) => {
            const updated = { ...prev, [name]: value };

            if (name === "conf_QuantidadeConferida") {
                const conf = parseInt(value) || 0;
                const sol = parseInt(updated.QuantityToBeTransferred_QuantidadeATransferir || "0");
                const ativar = conf < sol; // inclui 0
                setShowMotivoPadrao(ativar);
                setShowJustificativa(ativar);
                if (!ativar) {
                    updated.motivo_padrao = "";
                    updated.observacao = "";
                    setShowSugestoes(false);
                }
            }

            if (name === "motivo_padrao") {
                const isMinimumStock = value === motivosValidos[0] || value === t('minimumStockRequired');
                setShowSugestoes(isMinimumStock);
                if (!isMinimumStock) {
                    updated.Sugestao_Minima = "";
                    updated.Sugestao_Maxima = "";
                }
            }
            return updated;
        });
    };

    // ===== Handle submit =====
    const handleSubmit = async () => {
        const errors: string[] = [];

        if (!form.id) errors.push(t('idNotFound'));
        if (!form.FromDepartment_DepartamentoOrigem?.trim()) errors.push(t('originDeptRequired'));
        if (!form.OriginAllocatedPosition_PosicaoAlocadaOrigem?.trim()) errors.push(t('positionRequired'));
        if (!form.conf_QuantidadeConferida || isNaN(Number(form.conf_QuantidadeConferida))) errors.push(t('invalidQuantity'));

        const quantidade = Number(form.conf_QuantidadeConferida);
        const solicitada = Number(form.QuantityToBeTransferred_QuantidadeATransferir || 0);

        if (quantidade < solicitada && !form.motivo_padrao) errors.push(t('reasonRequired'));
        if (showJustificativa && !form.observacao?.trim()) errors.push(t('justificationRequired'));
        if (showSugestoes) {
            if (!form.Sugestao_Minima) errors.push(t('minSuggestionRequired'));
            if (!form.Sugestao_Maxima) errors.push(t('maxSuggestionRequired'));
        }

        if (errors.length > 0) {
            showAlert("⚠️ " + t('fieldErrors') + "\n\n- " + errors.join("\n- "), "error");
            return;
        }

        try {
            // Preparar payload com os nomes corretos esperados pela API

            const payload: any = {
                id: form.id,
                FromVessel_NavioOrigem: form.FromVessel_NavioOrigem,
                ToVessel_NavioDestino: form.ToVessel_NavioDestino,
                FromDepartment_DepartamentoOrigem: form.FromDepartment_DepartamentoOrigem,
                ToDepartment_DepartamentoDestino: form.ToDepartment_DepartamentoDestino,
                PRNumberTMMaster_NumeroPRTMMaster: form.PRNumberTMMaster_NumeroPRTMMaster,
                OraclePRNumber_NumeroPROracle: form.OraclePRNumber_NumeroPROracle,
                SPN: form.SPN,
                ItemDescription_DescricaoItem: form.ItemDescription_DescricaoItem,
                OriginAllocatedPosition_PosicaoAlocadaOrigem: form.OriginAllocatedPosition_PosicaoAlocadaOrigem,
                QuantityToBeTransferred_QuantidadeATransferir: form.QuantityToBeTransferred_QuantidadeATransferir,
                TotalAmount_USD_ValorTotal_USD: form.TotalAmount_USD_ValorTotal_USD,
                // Campos da conferência
                status_final: form.motivo_padrao || "Desembarcado com sucesso",
                desembarque_quantidade_conferida: form.conf_QuantidadeConferida,
                conf_QuantidadeConferida: form.conf_QuantidadeConferida, // fallback
                conferencia_responsavel: form.responsavel_conf, // Nome correto esperado pela API
                responsavel_conf: form.responsavel_conf, // fallback
                Sugestao_Minima: showSugestoes ? form.Sugestao_Minima : null,
                Sugestao_Maxima: showSugestoes ? form.Sugestao_Maxima : null,
                observacao: form.observacao,
                motivo_padrao: form.motivo_padrao,
                lom: null, // Inicialmente null
                data_inicio_quarentena: new Date().toISOString().slice(0, 19).replace('T', ' '), // Data/hora atual: YYYY-MM-DD HH:MM:SS
                data_fim_quarentena: null,
            };

            if (quantidade === 0) {
                const payloadZero = {
                    id: form.id,
                    transfer_status: "Finalizado",
                    Desembarque_quantidade_conferida: 0,
                    Desembarque_responsavel: form.responsavel_conf,
                    sugestao_minima: form.Sugestao_Minima || "",
                    sugestao_maxima: form.Sugestao_Maxima || "",
                    justificativa: form.observacao || "",
                    motivo_padrao: form.motivo_padrao || ""
                };

              

                const res = await fetch("http://10.15.3.30:9280/api/desembarque/confirmar", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        'x-user-name': user?.username || '',
                        'x-user-type': user?.user_type || ''
                    },
                    body: JSON.stringify(payloadZero),
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    console.error("❌ Erro na resposta da API (Qtd=0):", errorData);
                    throw new Error(errorData.message || "Falha ao finalizar registro na Desembarque (Qtd=0)");
                }

                showAlert("✅ " + t('conferenceFinalized'), "success");
                // Aguardar 2 segundos antes de navegar para o usuário ver o alerta
                setTimeout(() => {
                    navigate("/desembarque");
                }, 2000);
                return;
            }

            const res = await fetch("http://10.15.3.30:9280/api/desembarque/confirmar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'x-user-name': user?.username || '',
                    'x-user-type': user?.user_type || ''
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("❌ Erro na resposta da API:", errorData);
                throw new Error(errorData.message || "Falha ao registrar dados da conferência");
            }

            const responseData = await res.json();

            showAlert( t('conferenceSuccess'), "success");
            // Aguardar 2 segundos antes de navegar para o usuário ver o alerta
            setTimeout(() => {
                navigate("/desembarque");
            }, 2000);
        } catch (err: any) {
            console.error("Erro ao submeter conferência:", err);
            showAlert("❌ " + t('error') + ": " + (err.message || t('unknownError')), "error");
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
                        onClick={() => navigate("/desembarque")}
                        style={{ marginLeft: "12px" }}
                    >
                        ⬅ {t('backToDisembarkment')}
                    </button>
                </div>
            </div>

            <div className="filter-section">
                <div style={{ marginBottom: "20px" }}>
                    <h3>📤 {t('disembarkmentTransfer')}</h3>
                </div>

                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                        <h3 className="section-title">🚢 {t('originVessel')}</h3>
                        <div className="form-group">
                            <label className="field-label">{t('vessel')}</label>
                            <input type="text" readOnly className="form-input" value={form.FromVessel_NavioOrigem || ""} />
                        </div>
                        <div className="form-group">
                            <label className="field-label">{t('department')}</label>
                            <input
                                type="text"
                                name="FromDepartment_DepartamentoOrigem"
                                className="form-input"
                                value={form.FromDepartment_DepartamentoOrigem || ""}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="field-label">{t('physicalOriginPosition')}</label>
                            <input
                                type="text"
                                name="OriginAllocatedPosition_PosicaoAlocadaOrigem"
                                className="form-input"
                                value={form.OriginAllocatedPosition_PosicaoAlocadaOrigem || ""}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <h3 className="section-title">⚓ {t('destinationVessel')}</h3>
                        <div className="form-group">
                            <label className="field-label">{t('vessel')}</label>
                            <input type="text" readOnly className="form-input" value={form.ToVessel_NavioDestino || ""} />
                        </div>
                        <div className="form-group">
                            <label className="field-label">{t('department')}</label>
                            <input type="text" readOnly className="form-input" value={form.ToDepartment_DepartamentoDestino || ""} />
                        </div>
                        <div className="form-group">
                            <label className="field-label">{t('prTmMaster')}</label>
                            <input type="text" readOnly className="form-input" value={form.PRNumberTMMaster_NumeroPRTMMaster || ""} />
                        </div>
                        <div className="form-group">
                            <label className="field-label">{t('prOracle')}</label>
                            <input type="text" readOnly className="form-input" value={form.OraclePRNumber_NumeroPROracle || ""} />
                        </div>
                    </div>
                </div>

                <h3 className="section-title" style={{ marginTop: "32px" }}>📦 {t('itemInformation')}</h3>

                <div className="item-info-layout">
                    {/* Linha 1: Descrição do Item */}
                    <div className="item-row">
                        <div className="form-group">
                            <label className="field-label">{t('itemDescription')}</label>
                            <input type="text" readOnly className="form-input" value={form.ItemDescription_DescricaoItem || ""} />
                        </div>
                    </div>

                    {/* Linha 2: SPN / Quantidade solicitada */}
                    <div className="item-row">
                        <div className="form-group">
                            <label className="field-label">{t('spn')}</label>
                            <input type="text" readOnly className="form-input" value={form.SPN || ""} />
                        </div>
                        <div className="form-group">
                            <label className="field-label">{t('requestedQuantity')}</label>
                            <input type="text" readOnly className="form-input" value={form.QuantityToBeTransferred_QuantidadeATransferir || ""} />
                        </div>
                    </div>

                    {/* Linha 3: Quantidade Conferida / Responsável */}
                    <div className="item-row">
                        <div className="form-group">
                            <label className="field-label">{t('conferredQuantity')}</label>
                            <select
                                name="conf_QuantidadeConferida"
                                className="form-input"
                                value={form.conf_QuantidadeConferida}
                                onChange={handleChange}
                            >
                                {Array.from(
                                    { length: Math.max(0, Number(form.QuantityToBeTransferred_QuantidadeATransferir || 0)) + 1 },
                                    (_, i) => (
                                        <option key={i} value={i} disabled={i === 0}>
                                            {i}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="field-label">{t('responsible')}</label>
                            <input type="text" readOnly className="form-input" value={form.responsavel_conf} />
                        </div>
                    </div>

                    {/* Motivo da Divergência (se ativado) */}
                    {showMotivoPadrao && (
                        <div className="item-row">
                            <div className="form-group">
                                <label className="field-label">{t('divergenceReason')}</label>
                                <select
                                    name="motivo_padrao"
                                    className="form-input"
                                    value={form.motivo_padrao}
                                    onChange={handleChange}
                                >
                                    <option value="">{t('select')}</option>
                                    {getTranslatedMotivos().map((motivo, index) => (
                                        <option key={motivo} value={motivosValidos[index]}>
                                            {motivo}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Justificativa da Divergência (se ativado) */}
                    {showJustificativa && (
                        <div className="item-row">
                            <div className="form-group">
                                <label className="field-label">{t('divergenceJustification')}</label>
                                <input
                                    type="text"
                                    name="observacao"
                                    className="form-input"
                                    value={form.observacao}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {showSugestoes && (
                    <div style={{ display: "flex", gap: "16px", marginTop: "16px", flexWrap: "wrap" }}>
                        <div className="form-group">
                            <label className="field-label">{t('minimumStockSuggestion')}</label>
                            <input
                                type="number"
                                name="Sugestao_Minima"
                                className="form-input"
                                value={form.Sugestao_Minima}
                                onChange={handleChange}
                                min={0}
                            />
                        </div>
                        <div className="form-group">
                            <label className="field-label">{t('maximumStockSuggestion')}</label>
                            <input
                                type="number"
                                name="Sugestao_Maxima"
                                className="form-input"
                                value={form.Sugestao_Maxima}
                                onChange={handleChange}
                                min={0}
                            />
                        </div>
                    </div>
                )}

                <div style={{ marginTop: "30px" }}>
                    <button className="btn-primary" onClick={handleSubmit}>
                        ✅ {t('finalize')}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* CSS adicional para o novo layout */
const additionalCSS = `
.item-info-layout {
  margin-top: 16px;
  background: #ffffff;
  border: 1px solid rgba(7, 55, 118, 0.1);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.item-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.item-row:last-child {
  margin-bottom: 0;
}

.item-row .form-group {
  flex: 1;
  min-width: 280px;
}

/* Linha 1: Descrição ocupa largura total */
.item-row:first-child .form-group {
  flex: 1;
  min-width: 100%;
}

@media (max-width: 767px) {
  .item-row {
    flex-direction: column;
    gap: 16px;
  }
  
  .item-row .form-group {
    min-width: 100%;
  }
  
  .item-info-layout {
    padding: 16px;
  }
}
`;

// Wrapper do componente com AlertProvider
function DesembarqueTransferWithProvider() {
    return (
        <AlertProvider>
            <DesembarqueTransfer />
        </AlertProvider>
    );
}

export default DesembarqueTransferWithProvider;