// Manejo centralizado de la sesión del usuario interno (token + datos básicos).

export const ROLES = {
    AGENTE: 'Agente',
    LEGAL: 'Area legal',
    ADMIN: 'Administrador'
};

const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

export const obtenerToken = () => localStorage.getItem(CLAVE_TOKEN);

export const obtenerUsuario = () => {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_USUARIO) || 'null');
    } catch {
        return null;
    }
};

export const haySesion = () => Boolean(obtenerToken() && obtenerUsuario());

export const guardarSesion = (token, usuario) => {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
};

export const actualizarToken = (token) => {
    if (token && obtenerToken()) {
        localStorage.setItem(CLAVE_TOKEN, token);
    }
};

export const cerrarSesion = () => {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
};

export const encabezadoAuth = () => ({
    headers: { Authorization: `Bearer ${obtenerToken()}` }
});

// Pantalla de inicio de cada rol
export const panelDeRol = (rol) => (rol === ROLES.LEGAL ? '/legal/publicaciones' : '/dashboard');

export const esRol = (...roles) => roles.includes(obtenerUsuario()?.rol);
