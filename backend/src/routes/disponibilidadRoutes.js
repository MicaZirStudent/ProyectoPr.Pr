const express = require('express');
const router = express.Router();
const { obtenerDisponibilidad, guardarDisponibilidad } = require('../controllers/disponibilidadController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

router.get('/:idPublicacion', verificarToken, verificarRol('Agente'), obtenerDisponibilidad);
router.put('/:idPublicacion', verificarToken, verificarRol('Agente'), guardarDisponibilidad);

module.exports = router;
