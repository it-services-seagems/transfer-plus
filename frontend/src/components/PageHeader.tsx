import React from 'react';
import './PageHeader.css';

export interface PageHeaderButton {
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
  /** Numeric badge shown on the button (e.g. quarantine count). Badge is hidden when value is 0. */
  badge?: number;
  title?: string;
  /** Optional icon rendered before the label */
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

interface PageHeaderProps {
  /** Page title text */
  title?: React.ReactNode;
  /** Icon rendered before the title (e.g. <FontAwesomeIcon icon={...} />) */
  icon?: React.ReactNode;
  /** When provided, renders the admin badge next to the title */
  adminBadge?: string;
  /** Current active language: 'pt-br' | 'en' */
  language?: string;
  /** Called when the user clicks a language button */
  onLanguageChange?: (lang: string) => void;
  /** Set to false to hide the language selector entirely */
  showLanguageSelector?: boolean;
  /** Set to false to hide flag emojis from the language buttons */
  showFlags?: boolean;
  /** Action buttons rendered in the right section of the header */
  buttons?: PageHeaderButton[];
  /** Extra class names for the outer page-header div */
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  icon,
  adminBadge,
  language,
  onLanguageChange,
  showLanguageSelector = true,
  showFlags = true,
  buttons = [],
  className = '',
}) => {
  return (
    <div className={`page-header${className ? ` ${className}` : ''}`}>
      <div className="page-title">
        {icon && (
          <span className="page-icon section-icon">{icon}</span>
        )}
        {title && <h1>{title}</h1>}
        {adminBadge && (
          <span className="admin-role-badge">{adminBadge}</span>
        )}
      </div>

      <div className="page-actions">
        {showLanguageSelector && onLanguageChange && (
          <div className="language-selector">
            <button
              type="button"
              className={`language-btn ${language === 'pt-br' ? 'active' : ''}`}
              onClick={() => onLanguageChange('pt-br')}
            >
              {showFlags ? '🇧🇷 ' : ''}PT
            </button>
            <button
              type="button"
              className={`language-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => onLanguageChange('en')}
            >
              {showFlags ? '🇺🇸 ' : ''}EN
            </button>
          </div>
        )}

        {buttons.map((btn, i) => (
          <button
            key={i}
            type="button"
            className={`${btn.className ?? 'btn-secondary'}${btn.badge !== undefined ? ' btn-with-badge' : ''}`}
            onClick={btn.onClick}
            title={btn.title}
            style={btn.style}
          >
            {btn.icon}
            {btn.label}
            {btn.badge !== undefined && (
              <span
                className={`btn-badge${btn.badge === 0 ? ' zero' : ''}`}
                title={`${btn.badge} itens`}
                aria-hidden={btn.badge === 0}
              >
                {btn.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PageHeader;
