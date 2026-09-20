const express = require('express');
const router = express.Router();

const { 
    crearPublicacion, 
    obtenerMisPublicaciones, 
    obtenerPublicacionPorId, 
    editarPublicacion,
    eliminarPublicacion,
    enviarARevision,
    obtenerPublicacionesPublicas,
    obtenerPublicacionesEnRevision,
    aprobarPublicacion,
    observarPublicacion
} = require('../controllers/publicacionController');

const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

// GET /api/publicaciones/mis-publicaciones — trae las publicaciones del agente logueado
router.get('/mis-publicaciones', verificarToken, obtenerMisPublicaciones);

// GET /api/publicaciones/publicas — catálogo público de propiedades publicadas (sin login)
// Va ANTES de '/:id' para que Express no confunda "publicas" con un id
router.get('/publicas', obtenerPublicacionesPublicas);

// ---------- CU-05: Revisar Publicación (Área Legal) ----------
// Van ANTES de '/:id' para que Express no confunda "legal" con un id

router.get('/legal/en-revision', verificarToken, verificarRol('Area legal'), obtenerPublicacionesEnRevision);
router.patch('/legal/:id/aprobar', verificarToken, verificarRol('Area legal'), aprobarPublicacion);
router.patch('/legal/:id/observar', verificarToken, verificarRol('Area legal'), observarPublicacion);

// GET /api/publicaciones/:id — trae una publicación por su id
router.get('/:id', verificarToken, obtenerPublicacionPorId);

// POST /api/publicaciones/crear — crea una publicación nueva
router.post('/crear', verificarToken, crearPublicacion);

// PUT /api/publicaciones/:id — edita una publicación existente
router.put('/:id', verificarToken, editarPublicacion);

// DELETE /api/publicaciones/:id — elimina una publicación en borrador
router.delete('/:id', verificarToken, eliminarPublicacion);

// PATCH /api/publicaciones/:id/enviar-revision — cambia el estado a en_revision
router.patch('/:id/enviar-revision', verificarToken, enviarARevision);

module.exports = router;