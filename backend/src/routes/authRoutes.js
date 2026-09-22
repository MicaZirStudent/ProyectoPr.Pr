// Importamos express para poder usar su sistema de rutas
const express = require('express');

// Creamos un "router", que es como un mini-servidor de rutas
const router = express.Router();

// Importamos las funciones que escribimos en el controller
const { registrar, login, solicitarRecuperacion, restablecerContrasena } = require('../controllers/authController');

router.post('/registrar', registrar);
router.post('/login', login);
router.post('/recuperar', solicitarRecuperacion);
router.post('/restablecer', restablecerContrasena);

// Exportamos el router para poder usarlo en index.js
module.exports = router;