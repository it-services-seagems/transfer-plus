import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faCaretUp, faCaretDown, faSignOutAlt, faChartLine, faHome, faClipboardCheck, faTruckLoading, faBoxes, faFileAlt, faShoppingCart, faChartBar } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';
import logo from '../image/LOGO.png';

interface User {
  username: string;
  email: string;
  user_type: 'ADMIN' | 'DESEMBARQUE' | 'CONFERENTE' | 'EMBARQUE';
  success: boolean;
}

interface NavbarProps {
  user: User;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const [portalStyle, setPortalStyle] = useState({ left: 0, top: 0 });

  // Capitaliza a primeira letra de cada palavra (ex: gabriel.nascimento -> Gabriel.Nascimento)
  const capitalizeUsername = (username: string): string => {
    // Replace dots/underscores/other non-letter separators with a single space,
    // collapse multiple separators, trim, then capitalize each word.
    const cleaned = username.replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    return cleaned
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const userLabel = capitalizeUsername(user.username);

  const getLinkClass = (path: string) => (location.pathname === path ? 'links active' : 'links');

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    navigate(path);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && dropdownRef.current.contains(target)) return;
      if (portalRef.current && portalRef.current.contains(target)) return;
      setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const computePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const portalEl = portalRef.current;
      const portalWidth = portalEl ? portalEl.offsetWidth : 200; // fallback
      const portalHeight = portalEl ? portalEl.offsetHeight : 200;

      // center portal horizontally relative to button
      let left = rect.left + rect.width / 2 - portalWidth / 2;
      // clamp within viewport
      left = Math.max(8, Math.min(left, window.innerWidth - portalWidth - 8));

      // try to place below button; if not enough space, place above
      let top = rect.bottom + 8;
      if (top + portalHeight > window.innerHeight) {
        top = rect.top - portalHeight - 8;
      }

      setPortalStyle({ left, top });
    };
    if (dropdownOpen) computePosition();
    window.addEventListener('resize', computePosition);
    window.addEventListener('scroll', computePosition, true);
    return () => {
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition, true);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
    } catch {}
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  const isMenu = location.pathname === '/menu';

  return (
    <nav className="navbar" style={{ position: 'relative', zIndex: 30 }}>
      <div className="navbar-logo">
        <img src={logo} alt="TransferPlus Logo" className="navbar-logo-img" />
      </div>

      <ul className="nav-links">
        {!isMenu && (
          <>
            <li className={getLinkClass('/menu')}>
              <Link to="/menu" onClick={(e) => handleNavClick(e, '/menu')}>
                <FontAwesomeIcon className="t-Icon" icon={faHome} aria-hidden="true" />
                <span className="t-Tabs-label">Home</span>
              </Link>
            </li>
            <li className={getLinkClass('/desembarque')}>
              <Link to="/desembarque" onClick={(e) => handleNavClick(e, '/desembarque')}>
                <FontAwesomeIcon className="t-Icon" icon={faTruckLoading} aria-hidden="true" />
                <span className="t-Tabs-label">Desembarque</span>
              </Link>
            </li>
            <li className={getLinkClass('/conferencia')}>
              <Link to="/conferencia" onClick={(e) => handleNavClick(e, '/conferencia')}>
                <FontAwesomeIcon className="t-Icon" icon={faClipboardCheck} aria-hidden="true" />
                <span className="t-Tabs-label">Conferência</span>
              </Link>
            </li>           
            <li className={getLinkClass('/embarque')}>
              <Link to="/embarque" onClick={(e) => handleNavClick(e, '/embarque')}>
                <FontAwesomeIcon className="t-Icon" icon={faBoxes} aria-hidden="true" />
                <span className="t-Tabs-label">Embarque</span>
              </Link>
            </li>
            <li className={getLinkClass('/Desembarque_consulta')}>
              <Link to="/Desembarque_consulta" onClick={(e) => handleNavClick(e, '/Desembarque_consulta')}>
                <FontAwesomeIcon className="t-Icon" icon={faFileAlt} aria-hidden="true" />
                <span className="t-Tabs-label">Status Transfer.</span>
              </Link>
            </li>
            <li className={getLinkClass('/purchase-requisitions')}>
              <Link to="/purchase-requisitions" onClick={(e) => handleNavClick(e, '/purchase-requisitions')}>
                <FontAwesomeIcon className="t-Icon" icon={faShoppingCart} aria-hidden="true" />
                <span className="t-Tabs-label">Req. Compras</span>
              </Link>
            </li>
            <li className={getLinkClass('/dashboard')}>
              <Link to="/dashboard" onClick={(e) => handleNavClick(e, '/dashboard')}>
                <FontAwesomeIcon className="t-Icon" icon={faChartBar} aria-hidden="true" />
                <span className="t-Tabs-label">Analítico</span>
              </Link>
            </li>
          </>
        )}
      </ul>

      <div className="dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          ref={buttonRef}
          className="dropbtn"
          onClick={() => setDropdownOpen((s) => !s)}
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
          style={{ gap: '8px' }}
        >
          {userLabel}
          <FontAwesomeIcon icon={dropdownOpen ? faCaretUp : faCaretDown} style={{ fontSize: '14px' }} />
        </button>
 
        {dropdownOpen &&
          ReactDOM.createPortal(
            <div
              ref={portalRef}
              className="dropdown-content-portal"
              role="menu"
              style={{
                position: 'fixed',
                left: portalStyle.left,
                top: portalStyle.top,
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 6,
                boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                zIndex: 99999,
                minWidth: 180,
              }}
            >
              <Link
                to="/admin"
                onClick={(e) => {
                  setDropdownOpen(false);
                  handleNavClick(e, '/admin');
                }}
              >
                <FontAwesomeIcon className="t-Icon" icon={faUserCircle} aria-hidden="true" />
                <span>Admin</span>
              </Link>
              
            
              
              <button
                className="button-inside-drop"
                onClick={handleLogout}
              >
                <FontAwesomeIcon className="t-Icon" icon={faSignOutAlt} aria-hidden="true" />
                <span>Logout</span>
              </button>
            </div>,
            document.body
          )}
      </div>
    </nav>
  );
};

export default Navbar;
