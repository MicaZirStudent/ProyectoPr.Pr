// Importamos jsonwebtoken para verificar el token
const jwt = require('jsonwebtoken');

// Esta función se ejecuta ANTES de llegar al controller
// Verifica que el usuario esté logueado y que su token sea válido
const verificarToken = (req, res, next) => {

    // El token viaja en el header "Authorization" con el formato "Bearer TOKEN"
    const authHeader = req.headers['authorization'];

    // Si no viene el header, rechazamos la petición
    if (!authHeader) {
        return res.status(401).json({ mensaje: 'Acceso denegado. Token no proporcionado' });
    }

    // Separamos la palabra "Bearer" del token real
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ mensaje: 'Acceso denegado. Token mal formado' });
    }

    try {
        // Verificamos que el token sea válido y no haya expirado
        // Si es válido, jwt.verify nos devuelve los datos que guardamos al hacer login
        const datos = jwt.verify(token, process.env.JWT_SECRET);

        // Guardamos los datos del usuario en req.usuario para que el controller los pueda usar
        req.usuario = datos;

        // Llamamos a next() para que la petición siga su camino al controller
        next();

    } catch (error) {
        // Si el token expiró o es inválido
        return res.status(401).json({ mensaje: 'Token inválido o expirado. Iniciá sesión nuevamente' });
    }
};

// Exportamos el middleware
module.exports = { verificarToken };