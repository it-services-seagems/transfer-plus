import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faClipboardCheck, faBoxes, faSearch, faShoppingCart, faChartBar, faFilter, faListAlt } from '@fortawesome/free-solid-svg-icons';

interface CardIconProps {
  type: 'desembarque' | 'conferencia' | 'embarque' | 'consulta' | 'requisicoes' | 'analitico' | 'filtro-busca' | 'resultado-busca' | 'imagem-item' | 'origem' | 'navio' | 'diamante' | 'departamento' | 'vme' | 'posicao-fisica' | 'destino' | 'detalhes' | 'anexar-foto';
  className?: string;
}

export const CardIcon: React.FC<CardIconProps> = ({ type, className = 'card-icon' }) => {
  const iconMap = {
    desembarque: (
      <FontAwesomeIcon icon={faTruck} />
    ),
    conferencia: (
      <FontAwesomeIcon icon={faClipboardCheck} />
    ),
    embarque: (
      <FontAwesomeIcon icon={faBoxes} />
    ),
    consulta: (
      <FontAwesomeIcon icon={faSearch} />
    ),
    requisicoes: (
      <FontAwesomeIcon icon={faShoppingCart} />
    ),
    analitico: (
      <FontAwesomeIcon icon={faChartBar} />
    ),
    'filtro-busca': (
      <FontAwesomeIcon icon={faFilter} />
    ),
    'resultado-busca': (
      <FontAwesomeIcon icon={faListAlt} />
    ),
    'imagem-item': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
        <path d="M5 9l4 4L19 7"></path>
      </svg>
    ),
    'origem': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18"></path>
        <path d="M3 12h18"></path>
        <path d="M6 5h12"></path>
      </svg>
    ),
    'navio': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 21h14L12 13z"></path>
        <path d="M5 21l7-7 7 7"></path>
      </svg>
    ),
    'diamante': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l9 9-9 9-9-9z"></path>
        <path d="M12 3v18"></path>
      </svg>
    ),
    'departamento': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v18H3z"></path>
        <path d="M12 3v18"></path>
      </svg>
    ),
    'vme': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 8v8"></path>
        <path d="M8 12h8"></path>
      </svg>
    ),
    'posicao-fisica': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20"></path>
        <path d="M6 6l6 6 6-6"></path>
      </svg>
    ),
    'destino': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20"></path>
        <path d="M7 9l5 5 5-5"></path>
        <path d="M12 14v6"></path>
      </svg>
    ),
    'detalhes': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h12v20H6z"></path>
        <path d="M6 6h12"></path>
        <path d="M6 10h12"></path>
        <path d="M6 14h12"></path>
        <path d="M6 18h12"></path>
      </svg>
    ),
    'anexar-foto': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12l-5-5-5 5"></path>
        <path d="M12 19V5"></path>
        <circle cx="12" cy="12" r="9"></circle>
      </svg>
    ),
  };

  return <div className={className}>{iconMap[type]}</div>;
};

export default CardIcon;
