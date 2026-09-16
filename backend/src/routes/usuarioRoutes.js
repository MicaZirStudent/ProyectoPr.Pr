const express = require('express');
const router = express.Router();
const { listarUsuarios, crearUsuario, modificarUsuario, eliminarUsuario } = require('../controllers/usuarioController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

const soloAdmin = [verificarToken, verificarRol('Administrador')];

router.get('/', ...soloAdmin, listarUsuarios);
router.post('/', ...soloAdmin, crearUsuario);
router.put('/:id', ...soloAdmin, modificarUsuario);
router.delete('/:id', ...soloAdmin, eliminarUsuario);

module.exports = router;
