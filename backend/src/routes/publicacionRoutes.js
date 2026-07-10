// Importamos express para usar su sistema de rutas
const express = require('express');

// Creamos el router
const router = express.Router();

// Importamos las funciones del controller
const { crearPublicacion, obtenerMisPublicaciones } = require('../controllers/publicacionController');

// Importamos el middleware de autenticación
const { verificarToken } = require('../middleware/authMiddleware');

// Todas las rutas de publicaciones requieren token válido
// verificarToken se ejecuta primero, si pasa recién llega al controller

// GET /api/publicaciones/mis-publicaciones — trae las publicaciones del agente logueado
router.get('/mis-publicaciones', verificarToken, obtenerMisPublicaciones);

// POST /api/publicaciones/crear — crea una publicación nueva
router.post('/crear', verificarToken, crearPublicacion);

// Exportamos el router
module.exports = router;