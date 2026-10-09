// Importamos express para poder usar su sistema de rutas
const express = require('express');

// Creamos un "router", que es como un mini-servidor de rutas
const router = express.Router();

// Importamos las funciones que escribimos en el controller
const { registrar, login, solicitarRecuperacion, restablecerContrasena, obtenerSesion } = require('../controllers/authController');
const { verificarToken } = require('../middleware/authMiddleware');

router.post('/registrar', registrar);
router.post('/login', login);
router.post('/recuperar', solicitarRecuperacion);
router.post('/restablecer', restablecerContrasena);
// GET /api/auth/sesion — valida la sesión actual y la renueva mientras el usuario navega
router.get('/sesion', verificarToken, obtenerSesion);

// Exportamos el router para poder usarlo en index.js
module.exports = router;