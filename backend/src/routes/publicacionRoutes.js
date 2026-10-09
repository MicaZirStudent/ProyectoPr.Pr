const express = require('express');
const router = express.Router();

const {
    crearPublicacion,
    obtenerMisPublicaciones,
    obtenerPublicacionPorId,
    editarPublicacion,
    eliminarPublicacion,
    enviarARevision,
    obtenerDocumento,
    obtenerPublicacionesPublicas,
    obtenerPublicacionPublicaPorId,
    obtenerPublicacionesPendientesRevision,
    obtenerHistorialLegal,
    aprobarPublicacion,
    observarPublicacion,
    revertirEstado,
    reasignarAgente,
    ROL_AGENTE,
    ROL_LEGAL,
    ROL_ADMIN
} = require('../controllers/publicacionController');

const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

const soloAgente = [verificarToken, verificarRol(ROL_AGENTE)];
const soloLegal = [verificarToken, verificarRol(ROL_LEGAL)];
const agenteOAdmin = [verificarToken, verificarRol(ROL_AGENTE, ROL_ADMIN)];

// ---------- Rutas públicas (catálogo, sin login) ----------
// Van ANTES de '/:id' para que Express no confunda "publicas" con un id
router.get('/publicas', obtenerPublicacionesPublicas);
router.get('/publicas/:id', obtenerPublicacionPublicaPorId);

// ---------- Panel del agente / administrador ----------
// Agente: sus publicaciones. Administrador: todas.
router.get('/mis-publicaciones', ...agenteOAdmin, obtenerMisPublicaciones);

// ---------- CU-05: Revisión (Área Legal) ----------
router.get('/pendientes-revision', ...soloLegal, obtenerPublicacionesPendientesRevision);
router.get('/historial', ...soloLegal, obtenerHistorialLegal);

// Solo el agente carga publicaciones nuevas (el administrador no)
router.post('/crear', ...soloAgente, crearPublicacion);

router.get('/:id', ...agenteOAdmin, obtenerPublicacionPorId);
router.put('/:id', ...agenteOAdmin, editarPublicacion);

// Agente (propias, en Borrador o Publicada), Área Legal y Administrador (cualquiera)
router.delete('/:id', verificarToken, verificarRol(ROL_AGENTE, ROL_LEGAL, ROL_ADMIN), eliminarPublicacion);

// Administrador: cambia el agente responsable y notifica a ambos
router.patch('/:id/reasignar', verificarToken, verificarRol(ROL_ADMIN), reasignarAgente);

// Descarga de un PDF adjunto
router.get('/:id/documentos/:idDocumento', verificarToken, verificarRol(ROL_AGENTE, ROL_LEGAL, ROL_ADMIN), obtenerDocumento);

router.patch('/:id/enviar-revision', ...soloAgente, enviarARevision);
router.patch('/:id/observar', ...soloLegal, observarPublicacion);
router.patch('/:id/aprobar', ...soloLegal, aprobarPublicacion);
router.patch('/:id/revertir-estado', ...soloLegal, revertirEstado);

module.exports = router;
