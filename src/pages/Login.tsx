import React, { useState } from 'react';
import '../styles/Login.css';
import logo from '../image/LOGO.png';

// ========================================
// 🔧 INTERFACES TYPESCRIPT
// ========================================

interface LoginResponse {
  status: string;
  message?: string;
  user?: {
    username: string;
    email: string;
    user_type: string;
    success: boolean;
    groups?: string[];
    access_level?: string;
    allowed_paths?: string[] | string;
    ou?: string;
  };
}

// ========================================
// 🔧 COMPONENTE LOGIN
// ========================================

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('pt-br');

  // ========================================
  // 🔧 TEXTOS DE TRADUÇÃO
  // ========================================
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'pt-br': {
        'systemAccess': 'Seagems Transferplus',
        'domainCredentials': 'Use suas credenciais do domínio Seagems',
        'exampleUser': 'Ex: wallace.araujo',
        'username': 'Usuário',
        'password': 'Senha',
        'usernamePlaceholder': 'Usuário',
        'passwordPlaceholder': 'Senha',
        'login': 'Entrar',
        'logging': 'Entrando...',
        'invalidCredentials': 'Usuário ou senha inválidos',
        'connectionError': 'Erro na conexão com o servidor',
        'groupNotConfigured': 'Grupo de acesso não configurado no sistema',
        'accessDenied': 'Acesso negado ao sistema',
        'loading': 'Carregando...'
      },
      'en': {
        'systemAccess': 'Seagems Transferplus',
        'domainCredentials': 'Use your Seagems domain credentials',
        'exampleUser': 'Ex: wallace.araujo',
        'username': 'Username',
        'password': 'Password',
        'usernamePlaceholder': 'Username',
        'passwordPlaceholder': 'Password',
        'login': 'Login',
        'logging': 'Logging in...',
        'invalidCredentials': 'Invalid username or password',
        'connectionError': 'Server connection error',
        'groupNotConfigured': 'Access group not configured in system',
        'accessDenied': 'Access denied to system',
        'loading': 'Loading...'
      }
    };
    return translations[language]?.[key] || key;
  };

  // ========================================
  // 🔧 FUNÇÃO DE SUBMIT
  // ========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const resp = await fetch('http://10.15.3.30:9280/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data: LoginResponse = await resp.json();

      if (data.status !== 'success' || !data.user) {
        setErro(data.message || t('invalidCredentials'));
        setLoading(false);
        return;
      }

      if (data.user.user_type === 'NO_ACCESS') {
        setErro(t('accessDenied'));
        setLoading(false);
        return;
      }

      // Salvar token simples e dados do usuário
      localStorage.setItem('authToken', 'auth-token-' + Date.now());
      localStorage.setItem('user', JSON.stringify(data.user));

      // SEMPRE redirecionar para menu - o menu controla as permissões
      const targetRoute = '/menu';

      // Aguardar um pouco antes de redirecionar para garantir que os dados foram salvos
      setTimeout(() => {
        window.location.href = targetRoute;
      }, 100);
    } catch (err) {
      console.error('❌ Erro na autenticação:', err);
      setErro(t('connectionError'));
    }
    setLoading(false);
  };

  // ========================================
  // 🔧 FUNÇÃO TROCAR IDIOMA
  // ========================================
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  // ========================================
  // 🔧 RENDER DO COMPONENTE
  // ========================================
  return (
    <div className="seagems-container">
      <div className="seagems-header">
        <img src={logo} alt="TransferPlus Logo" className="seagems-logo" />
      </div>

      <div className="seagems-card">
        <h2 className="seagems-title">{t('systemAccess')}</h2>
        <p className="seagems-subtitle">
          {t('domainCredentials')}<br />
          <span style={{ opacity: 0.7, fontSize: '13px' }}>{t('exampleUser')}</span>
        </p>

        {erro && <div className="seagems-error">{erro}</div>}

        <form onSubmit={handleSubmit}>
          <div className="seagems-input-group">
            <label htmlFor="username">{t('username')}</label>
            <input
              id="username"
              type="text"
              placeholder={t('usernamePlaceholder')}
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="seagems-input-group">
            <label htmlFor="password">{t('password')}</label>
            <input
              id="password"
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            className="seagems-button"
            type="submit"
            disabled={loading}
          >
            {loading ? t('logging') : t('login')}
          </button>
        </form>

        {/* Seletor de Idioma */}
        <div className="seagems-language-switcher">
          <button
            type="button"
            className={language === 'pt-br' ? 'active' : ''}
            onClick={() => handleLanguageChange('pt-br')}
          >
            🇧🇷 Português
          </button>
          <button
            type="button"
            className={language === 'en' ? 'active' : ''}
            onClick={() => handleLanguageChange('en')}
          >
            🇺🇸 English
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;