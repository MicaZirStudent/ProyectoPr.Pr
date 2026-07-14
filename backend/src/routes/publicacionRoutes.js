// Importamos express para usar su sistema de rutas
const express = require('express');

// Creamos el router
const router = express.Router();

// Importamos las funciones del controller
const { crearPublicacion, obtenerMisPublicaciones, obtenerPublicacionPorId, editarPublicacion, enviarARevision } = require('../controllers/publicacionController');

// Importamos el middleware de autenticación
const { verificarToken } = require('../middleware/authMiddleware');

// GET /api/publicaciones/mis-publicaciones — trae las publicaciones del agente logueado
router.get('/mis-publicaciones', verificarToken, obtenerMisPublicaciones);

// GET /api/publicaciones/:id — trae una publicación por su id
router.get('/:id', verificarToken, obtenerPublicacionPorId);

// POST /api/publicaciones/crear — crea una publicación nueva
router.post('/crear', verificarToken, crearPublicacion);

// PUT /api/publicaciones/:id — edita una publicación existente
router.put('/:id', verificarToken, editarPublicacion);

// PATCH /api/publicaciones/:id/enviar-revision — cambia el estado a en_revision
router.patch('/:id/enviar-revision', verificarToken, enviarARevision);

// Exportamos el router
module.exports = router;