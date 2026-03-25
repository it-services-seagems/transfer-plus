import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import axios, { isAxiosError } from 'axios';
import logo from '../image/LOGO.png';
import '../styles/Login.css';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [locale, setLocale] = useState<'pt' | 'en'>('pt');

    const texts: Record<string, Record<string, string>> = {
        pt: {
            usernamePlaceholder: 'Usuário',
            passwordPlaceholder: 'Senha',
            signIn: 'Entrar',
            connecting: 'Conectando...',
            noAccess: 'Usuário sem permissão para acessar o sistema. Contate o administrador.',
            invalidCredentials: 'Credenciais inválidas. Verifique seu usuário e senha.',
            connectionError: 'Erro na conexão com o servidor.',
            loginTitle: 'TransferPlus'
        },
        en: {
            usernamePlaceholder: 'Username',
            passwordPlaceholder: 'Password',
            signIn: 'Sign In',
            connecting: 'Connecting...',
            noAccess: 'User has no permission to access the system. Contact administrator.',
            invalidCredentials: 'Invalid credentials. Check username and password.',
            connectionError: 'Server connection error.',
            loginTitle: 'TransferPlus'
        }
    };
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    axios.defaults.baseURL = 'http://10.15.3.30:9280';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await axios.post('/api/login', {
                username: username.toLowerCase().trim(),
                password: password
            });

            if (response.data.status === 'success') {
                // Armazenar dados do usuário no localStorage
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('authToken', response.data.session_token);
                
                // Verificar tipo de usuário
                const userType = response.data.user.user_type;
                
                if (userType === 'NO_ACCESS') {
                    setError('Usuário sem permissão para acessar o sistema. Contate o administrador.');
                    // Limpar dados do localStorage se sem acesso
                    localStorage.removeItem('user');
                    localStorage.removeItem('authToken');
                } else {
                    // Navegar para o menu
                    navigate('/menu');
                }
            } else {
                setError(response.data.message || 'Erro ao fazer login');
            }
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                if (err.response?.status === 403) {
                    setError("Usuário não possui permissão no sistema. Contate o administrador.");
                } else if (err.response?.status === 401) {
                    setError("Credenciais inválidas. Verifique seu usuário e senha.");
                } else if (err.response?.status === 400) {
                    setError(err.response?.data?.message || "Dados inválidos.");
                } else {
                    setError(err.response?.data?.message || err.message || "Erro na conexão com o servidor.");
                }
            } else {
                setError('Erro inesperado. Por favor, tente novamente mais tarde.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-all">
            <div className="container-inside">
                <div className="t-Login-region" role="region" aria-labelledby="login_heading">
                    <img className="t-Login-logo" src={logo} alt="Seagems Logo" />
                            <div className="t-Login-header" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                    <h2 className="t-Login-title" id="login_heading">{texts[locale].loginTitle}</h2>
                                </div>
                                <div style={{display: 'flex', gap: '3px', marginLeft: '11px'}}>
                                    <button
                                        type="button"
                                        onClick={() => setLocale('pt')}
                                        aria-pressed={locale === 'pt'}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '0.85em',
                                            borderRadius: 4,
                                            border: locale === 'pt' ? '1px solid #073776' : '1px solid #ccc',
                                            background: locale === 'pt' ? '#073776' : 'transparent',
                                            color: locale === 'pt' ? '#fff' : '#073776',
                                            cursor: 'pointer'
                                        }}
                                    >PT</button>
                                    <button
                                        type="button"
                                        onClick={() => setLocale('en')}
                                        aria-pressed={locale === 'en'}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '0.85em',
                                            borderRadius: 4,
                                            border: locale === 'en' ? '1px solid #073776' : '1px solid #ccc',
                                            background: locale === 'en' ? '#073776' : 'transparent',
                                            color: locale === 'en' ? '#fff' : '#073776',
                                            cursor: 'pointer'
                                        }}
                                    >EN</button>
                                </div>
                            </div>
                    <div className="t-Login-body">
                        <form onSubmit={handleLogin}>
                            <div className="t-Form-fieldContainer">
                                <div className="t-Form-inputContainer">
                                    <div className="t-Form-itemWrapper">
                                        <input 
                                            type="text" 
                                            id="username" 
                                            value={username} 
                                            placeholder={texts[locale].usernamePlaceholder} 
                                            onChange={(e) => {
                                                const rawInput = e.target.value;
                                                const lowercaseInput = rawInput.toLowerCase();
                                                const usernameOnly = lowercaseInput.split('@')[0];
                                                setUsername(usernameOnly);
                                            }} 
                                            required 
                                            className="text_field apex-item-text apex-item-has-icon"
                                        />
                                        <FontAwesomeIcon icon={faUser} className="apex-item-icon" aria-hidden="true" />
                                    </div>
                                </div>
                            </div>
                            <div className="t-Form-fieldContainer">
                                <div className="t-Form-inputContainer">
                                    <div className="t-Form-itemWrapper">
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            id="password" 
                                            value={password} 
                                            placeholder={texts[locale].passwordPlaceholder} 
                                            onChange={(e) => setPassword(e.target.value)} 
                                            required 
                                            className="password"
                                        />
                                        <FontAwesomeIcon
                                            icon={showPassword ? faEyeSlash : faEye}
                                            className="apex-item-icon"
                                            aria-hidden="true"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            {error && <p style={{ color: 'red' }}>{error}</p>}
                            <div className="t-Login-buttons">
                                <button className="t-Button t-Button--hot" type="submit" disabled={loading}>
                                    <span className="t-Button-label">{loading ? texts[locale].connecting : texts[locale].signIn}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div className="footer">
                Innovation and Development Team - Jorge Kort - 2025
            </div>
        </div>
    );
};

export default Login;