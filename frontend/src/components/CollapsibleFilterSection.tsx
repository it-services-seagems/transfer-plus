import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
import '../styles/main.css';

/**
 * CollapsibleFilterSection - Componente reutilizável para seções de filtro colapsáveis
 * 
 * @param title - Título da seção de filtros quando expandido
 * @param collapsedTitle - Título quando minimizado (padrão: "Filtro Avançado")
 * @param children - Conteúdo do filtro (formulário, inputs, etc.)
 * @param onSubmit - Função chamada ao submeter o formulário
 * @param defaultCollapsed - Define se inicia colapsado (padrão: true)
 * @param loading - Estado de carregamento (desabilita botões)
 * @param searchButtonLabel - Texto do botão de busca
 * @param clearButtonLabel - Texto do botão de limpar
 * @param onClear - Função chamada ao limpar filtros
 */

interface CollapsibleFilterSectionProps {
  title: string;
  collapsedTitle?: string;
  children: React.ReactNode;
  onSubmit: (e?: React.FormEvent) => void;
  onClear: () => void;
  defaultCollapsed?: boolean;
  loading?: boolean;
  searchButtonLabel?: string;
  clearButtonLabel?: string;
}

export default function CollapsibleFilterSection({
  title,
  collapsedTitle = 'Filtro Avançado',
  children,
  onSubmit,
  onClear,
  defaultCollapsed = true,
  loading = false,
  searchButtonLabel = 'Buscar',
  clearButtonLabel = 'Limpar'
}: CollapsibleFilterSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <section className="filter-section collapsible-filter">
      {/* Cabeçalho clicável para expandir/colapsar */}
      <div 
        className="filter-section-header" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <h2 className="section-title">
          <span className="section-icon">
            <FontAwesomeIcon icon={isCollapsed ? faFilter : faSearch} />
          </span>
          {isCollapsed ? collapsedTitle : title}
        </h2>
        <button 
          type="button" 
          className="collapse-toggle"
          aria-label={isCollapsed ? 'Expandir filtros' : 'Colapsar filtros'}
        >
          <FontAwesomeIcon icon={isCollapsed ? faChevronDown : faChevronUp} />
        </button>
      </div>

      {/* Conteúdo do filtro (colapsável) */}
      <div className={`filter-content ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <form onSubmit={handleSubmit}>
          {/* Renderiza os campos de filtro passados como children */}
          {children}

          {/* Botões de ação */}
          <div className="buttons-container">
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? `🔄 Buscando...` : searchButtonLabel}
              {loading && <span className="loading-spinner"></span>}
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClear}
            >
              {clearButtonLabel}
            </button>
          </div>
        </form>
      </div>

      {/* Estilos específicos do componente */}
      <style>{`
        .collapsible-filter {
          position: relative;
          background: transparent;
          border-radius: 0;
          box-shadow: none;
          border: none;
          overflow: visible;
          margin: 0;
          padding: 0;
        }

        .filter-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          margin-bottom: 24px;
          background: linear-gradient(135deg, #e6f0ff 0%, #d0e4ff 100%);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-bottom: 2px solid rgba(7, 55, 118, 0.15);
          position: relative;
          overflow: hidden;
        }

        .filter-section-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s;
        }

        .filter-section-header:hover::before {
          left: 100%;
        }

        .filter-section-header:hover {
          background: linear-gradient(135deg, #d0e4ff 0%, #b8d4ff 100%);
          border-bottom-color: rgba(7, 55, 118, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(7, 55, 118, 0.15);
        }

        .filter-section-header .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          color: #073776;
          font-size: 16px;
          margin: 0;
          transition: color 0.3s ease;
        }

        .filter-section-header:hover .section-title {
          color: #053056;
        }

        .filter-section-header .section-icon {
          font-size: 18px;
          transition: transform 0.3s ease;
        }

        .filter-section-header:hover .section-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .collapse-toggle {
          background: linear-gradient(135deg, rgba(7, 55, 118, 0.15) 0%, rgba(7, 55, 118, 0.1) 100%);
          border: 1px solid rgba(7, 55, 118, 0.25);
          border-radius: 8px;
          padding: 10px 14px;
          cursor: pointer;
          color: #073776;
          font-size: 18px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          height: 44px;
          box-shadow: 0 2px 4px rgba(7, 55, 118, 0.1);
        }

        .collapse-toggle:hover {
          background: linear-gradient(135deg, rgba(7, 55, 118, 0.25) 0%, rgba(7, 55, 118, 0.2) 100%);
          border-color: rgba(7, 55, 118, 0.35);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 4px 8px rgba(7, 55, 118, 0.2);
        }

        .collapse-toggle:active {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 1px 2px rgba(7, 55, 118, 0.15);
        }

        .collapse-toggle svg {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .filter-content {
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: transparent;
        }

        .filter-content.collapsed {
          max-height: 0;
          opacity: 0;
          margin: 0;
          pointer-events: none;
          padding: 0;
        }

        .filter-content.expanded {
          max-height: 2500px;
          opacity: 1;
          margin: 0;
          padding: 20px;
          animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .filter-content form {
          position: relative;
        }

        .filter-content .buttons-container {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid rgba(7, 55, 118, 0.1);
        }

        /* Efeito de pulsação sutil no botão quando colapsado */
        .collapsible-filter:has(.filter-content.collapsed) .collapse-toggle {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 2px 4px rgba(7, 55, 118, 0.1);
          }
          50% {
            box-shadow: 0 2px 8px rgba(7, 55, 118, 0.2);
          }
        }

        /* Ajuste para mobile */
        @media (max-width: 768px) {
          .collapsible-filter {
            border-radius: 0;
            margin: 0;
            padding: 0;
          }

          .filter-section-header {
            padding: 12px 16px;
          }

          .filter-section-header .section-title {
            font-size: 14px;
          }

          .collapse-toggle {
            min-width: 40px;
            height: 40px;
            padding: 8px 12px;
            font-size: 16px;
          }

          .filter-content.expanded {
            padding: 16px;
          }
        }

        /* Estilo para melhorar os inputs dentro do filtro */
        .filter-content input.form-input,
        .filter-content select.form-input {
          transition: all 0.3s ease;
        }

        .filter-content input.form-input:focus,
        .filter-content select.form-input:focus {
          border-color: #073776;
          box-shadow: 0 0 0 3px rgba(7, 55, 118, 0.1);
          transform: translateY(-1px);
        }
      `}</style>
    </section>
  );
}
