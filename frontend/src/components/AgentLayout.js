import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Brand from './Brand';
import './AgentLayout.css';

const NAV_ITEMS = [
    { path: '/dashboard', label: 'Inicio', icon: '⌂' },
    { path: '/mis-publicaciones', label: 'Publicaciones', icon: '▣' },
    { path: '/crear-publicacion', label: 'Nueva propiedad', icon: '+' }
];

const AgentLayout = ({ children, title, subtitle, actions }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const [menuAbierto, setMenuAbierto] = useState(false);

    const cerrarSesion = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/');
    };

    const irA = (path) => {
        navigate(path);
        setMenuAbierto(false);
    };

    const activo = (path) => {
        if (path === '/mis-publicaciones') {
            return location.pathname === path || location.pathname.startsWith('/editar-publicacion');
        }
        return location.pathname === path;
    };

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
                <button type="button" className="topbar-brand" onClick={() => irA('/dashboard')}>
                    <Brand compact />
                </button>
                <div className="topbar-user">
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
                <p className="sidebar-label">Panel del agente</p>
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.path}
                            type="button"
                            className={`sidebar-link ${activo(item.path) ? 'is-active' : ''}`}
                            onClick={() => irA(item.path)}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                    <button type="button" className="sidebar-link is-disabled" disabled>
                        <span className="sidebar-icon">◷</span>
                        Mis turnos
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

export default AgentLayout;
