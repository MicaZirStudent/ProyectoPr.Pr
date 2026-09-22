const express = require('express');
const router = express.Router();
const { listarMias, marcarLeida, marcarTodasLeidas } = require('../controllers/notificacionController');
const { verificarToken } = require('../middleware/authMiddleware');

router.get('/', verificarToken, listarMias);
router.patch('/leer-todas', verificarToken, marcarTodasLeidas);
router.patch('/:id/leer', verificarToken, marcarLeida);

module.exports = router;
