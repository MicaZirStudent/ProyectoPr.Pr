const jwt = require('jsonwebtoken');

// Duración de la sesión por inactividad: cada petición autenticada la renueva
const DURACION_SESION = '30m';
const HEADER_TOKEN_RENOVADO = 'X-Token-Renovado';
// Las consultas automáticas (ej. polling de avisos) lo envían para no extender la sesión
const HEADER_SIN_RENOVAR = 'x-sin-renovar';

const firmarToken = ({ idUsuario, rol }) => jwt.sign(
    { idUsuario, rol },
    process.env.JWT_SECRET,
    { expiresIn: DURACION_SESION }
);

// Verifica que el usuario esté logueado y que su token sea válido.
// Si lo es, devuelve un token renovado en el header X-Token-Renovado (sesión deslizante).
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ mensaje: 'Acceso denegado. Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ mensaje: 'Acceso denegado. Token mal formado' });
    }

    try {
        const datos = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = datos;

        if (!req.headers[HEADER_SIN_RENOVAR]) {
            res.set(HEADER_TOKEN_RENOVADO, firmarToken(datos));
        }

        next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'Tu sesión expiró. Iniciá sesión nuevamente' });
    }
};

// Restringe el acceso según el rol. Se usa DESPUÉS de verificarToken.
const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ mensaje: 'No tenés permisos para realizar esta acción' });
        }
        next();
    };
};

module.exports = { verificarToken, verificarRol, firmarToken, HEADER_TOKEN_RENOVADO };
