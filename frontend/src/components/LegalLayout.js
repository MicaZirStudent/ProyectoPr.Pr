import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Brand from './Brand';
import { BuildingIcon } from './Icons';
import NotificationBell from './NotificationBell';
import './AgentLayout.css';

const LegalLayout = ({ children, title, subtitle, actions }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const [menuAbierto, setMenuAbierto] = useState(false);

    const cerrarSesion = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
    };

    const irA = (path) => {
        navigate(path);
        setMenuAbierto(false);
    };

    const activo = (path) => location.pathname === path;

    return (
        <div className="app-shell">
            <nav className="topbar">
                <button
                    type="button"
                    className="topbar-menu"
                    onClick={() => setMenuAbierto((v) => !v)}
                    aria-label="Abrir menú"
                >
                    ☰
                </button>
                <button type="button" className="topbar-brand" onClick={() => irA('/legal/publicaciones')}>
                    <Brand compact />
                </button>
                <div className="topbar-user">
                    <NotificationBell />
                    <div className="topbar-user-text">
                        <span className="topbar-nombre">{usuario?.nombre} {usuario?.apellido}</span>
                        <span className="topbar-rol">{usuario?.rol}</span>
                    </div>
                    <button type="button" className="btn btn-ghost" onClick={cerrarSesion}>
                        Cerrar sesión
                    </button>
                </div>
            </nav>

            {menuAbierto && (
                <button type="button" className="sidebar-backdrop" aria-label="Cerrar menú" onClick={() => setMenuAbierto(false)} />
            )}

            <aside className={`sidebar ${menuAbierto ? 'is-open' : ''}`}>
                <p className="sidebar-label">Panel Área Legal</p>
                <nav className="sidebar-nav">
                    <button
                        type="button"
                        className={`sidebar-link ${activo('/legal/publicaciones') ? 'is-active' : ''}`}
                        onClick={() => irA('/legal/publicaciones')}
                    >
                        <span className="sidebar-icon"><BuildingIcon size={18} /></span>
                        Publicaciones
                    </button>
                </nav>
            </aside>

            <div className="app-body">
                {(title || actions) && (
                    <header className="page-header">
                        <div>
                            {title && <h1 className="page-title">{title}</h1>}
                            {subtitle && <p className="page-subtitle">{subtitle}</p>}
                        </div>
                        {actions && <div className="page-actions">{actions}</div>}
                    </header>
                )}
                <main className="page-main">{children}</main>
            </div>
        </div>
    );
};

export default LegalLayout;
