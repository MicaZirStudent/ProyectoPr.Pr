import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Brand from './Brand';
import NotificationBell from './NotificationBell';
import { ROLES, cerrarSesion, obtenerUsuario, panelDeRol } from '../utils/sesion';
import './AgentLayout.css';

// Menú lateral de cada rol. "activoEn" agrupa las pantallas internas de una sección.
const MENU_POR_ROL = {
    [ROLES.AGENTE]: {
        titulo: 'Panel del agente',
        items: [
            { path: '/dashboard', label: 'Inicio' },
            {
                path: '/mis-publicaciones',
                label: 'Mis publicaciones',
                activoEn: ['/editar-publicacion', '/gestionar-disponibilidad']
            },
            { path: '/crear-publicacion', label: 'Nueva propiedad' },
            { path: '/mis-turnos', label: 'Mis turnos' }
        ]
    },
    [ROLES.ADMIN]: {
        titulo: 'Panel de administración',
        items: [
            { path: '/dashboard', label: 'Inicio' },
            { path: '/mis-publicaciones', label: 'Publicaciones', activoEn: ['/editar-publicacion'] },
            { path: '/gestion-usuarios', label: 'Usuarios' }
        ]
    },
    [ROLES.LEGAL]: {
        titulo: 'Panel Área Legal',
        items: [{ path: '/legal/publicaciones', label: 'Publicaciones' }]
    }
};

const PanelLayout = ({ children, title, subtitle, actions }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const usuario = obtenerUsuario();
    const [menuAbierto, setMenuAbierto] = useState(false);
    const menu = MENU_POR_ROL[usuario?.rol] || MENU_POR_ROL[ROLES.AGENTE];

    const salir = () => {
        cerrarSesion();
        navigate('/login');
    };

    const irA = (path) => {
        navigate(path);
        setMenuAbierto(false);
    };

    const activo = (item) => location.pathname === item.path
        || (item.activoEn || []).some((prefijo) => location.pathname.startsWith(prefijo));

    return (
        <div className="app-shell">
            <nav className="topbar">
                <button
                    type="button"
                    className={`topbar-menu ${menuAbierto ? 'is-open' : ''}`}
                    onClick={() => setMenuAbierto((v) => !v)}
                    aria-expanded={menuAbierto}
                >
                    {menuAbierto ? 'Cerrar' : 'Menú'}
                </button>
                <button type="button" className="topbar-brand" onClick={() => irA(panelDeRol(usuario?.rol))}>
                    <Brand compact />
                </button>
                <div className="topbar-user">
                    <button type="button" className="btn btn-ghost btn-back topbar-catalogo" onClick={() => irA('/')}>
                        Volver al catálogo
                    </button>
                    <NotificationBell />
                    <div className="topbar-user-text">
                        <span className="topbar-nombre">{usuario?.nombre} {usuario?.apellido}</span>
                        <span className="topbar-rol">{usuario?.rol}</span>
                    </div>
                    <button type="button" className="btn btn-ghost" onClick={salir}>
                        Cerrar sesión
                    </button>
                </div>
            </nav>

            {menuAbierto && (
                <button type="button" className="sidebar-backdrop" aria-label="Cerrar menú" onClick={() => setMenuAbierto(false)} />
            )}

            <aside className={`sidebar ${menuAbierto ? 'is-open' : ''}`}>
                <p className="sidebar-label">{menu.titulo}</p>
                <nav className="sidebar-nav">
                    {menu.items.map((item, index) => (
                        <button
                            key={item.path}
                            type="button"
                            className={`sidebar-link ${activo(item) ? 'is-active' : ''}`}
                            onClick={() => irA(item.path)}
                        >
                            <span className="sidebar-num">{String(index + 1).padStart(2, '0')}</span>
                            <span className="sidebar-text">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <button type="button" className="btn btn-ghost btn-back sidebar-catalogo" onClick={() => irA('/')}>
                    Volver al catálogo
                </button>
                <div className="sidebar-pie" aria-hidden="true" />
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

export default PanelLayout;
