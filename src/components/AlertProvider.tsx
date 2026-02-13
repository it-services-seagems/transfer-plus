import { createContext, useContext, useState, type ReactNode } from 'react';

// Contexto para fornecer alertas
type AlertSeverity = 'success' | 'info' | 'warning' | 'error';

type AlertState = {
  message: string;
  severity: AlertSeverity;
};

type AlertContextType = (message: string, severity?: AlertSeverity) => void;

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

type AlertProviderProps = {
  children: ReactNode;
};

export function AlertProvider({ children }: AlertProviderProps) {
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showAlert: AlertContextType = (message, severity = 'success') => {
    setAlert({ message, severity });
    setIsVisible(true);
    // Auto-fechar após 10 segundos
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setAlert(null), 300); // Aguarda animação antes de remover
    }, 10000); // 10 segundos
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setAlert(null), 300); // Aguarda animação antes de remover
  };

  const getAlertStyles = (severity: AlertSeverity) => {
    const baseStyles = {
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '15px',
      fontWeight: '500',
      minWidth: '320px',
      maxWidth: '500px',
      backdropFilter: 'blur(10px)',
      border: '1px solid',
    };

    const severityStyles = {
      success: {
        ...baseStyles,
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderColor: '#059669',
        color: '#ffffff',
      },
      error: {
        ...baseStyles,
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        borderColor: '#dc2626',
        color: '#ffffff',
      },
      warning: {
        ...baseStyles,
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        borderColor: '#d97706',
        color: '#ffffff',
      },
      info: {
        ...baseStyles,
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        borderColor: '#2563eb',
        color: '#ffffff',
      },
    };

    return severityStyles[severity];
  };

  const getIcon = (severity: AlertSeverity) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    return icons[severity];
  };

  return (
    <AlertContext.Provider value={showAlert}>
      {children}

      {alert && (
        <div
          style={{
            display: 'flex',
            position: 'fixed',
            top: '100px',
            left: '24%',
            width: '25%',
            zIndex: 99999,
            transform: isVisible 
              ? 'translateX(-50%) translateY(0)' 
              : 'translateX(-50%) translateY(-150%)',
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          }}
        >
          <div style={getAlertStyles(alert.severity)}>
            <span style={{ fontSize: '14px', lineHeight: 1 }}>
              {getIcon(alert.severity)}
            </span>
            <span style={{ flex: 1 }}>{alert.message}</span>
            <button
              onClick={handleClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Fechar alerta"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}
