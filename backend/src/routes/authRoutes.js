// Importamos express para poder usar su sistema de rutas
const express = require('express');

// Creamos un "router", que es como un mini-servidor de rutas
const router = express.Router();

// Importamos las funciones que escribimos en el controller
const { registrar, login } = require('../controllers/authController');

// Cuando llegue una petición POST a /registrar, ejecutamos la función registrar
router.post('/registrar', registrar);

// Cuando llegue una petición POST a /login, ejecutamos la función login
router.post('/login', login);

// Exportamos el router para poder usarlo en index.js
module.exports = router;