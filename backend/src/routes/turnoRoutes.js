// Importamos express para poder usar su sistema de rutas
const express = require('express');

// Creamos un "router": un grupo de URLs que después pegamos al servidor
const router = express.Router();

// Importamos las funciones del controlador de turnos
const { obtenerHorariosDisponibles, crearTurno } = require('../controllers/turnoController');

// GET /api/turnos/horarios/1
// El cliente pide los días y horas libres de la publicación con id 1
// No lleva token: el interesado no inicia sesión
router.get('/horarios/:idPublicacion', obtenerHorariosDisponibles);

// POST /api/turnos/solicitar
// El cliente envía el formulario (nombre, email, WhatsApp, fecha/hora, propiedad)
router.post('/solicitar', crearTurno);

// Exportamos el router para usarlo en index.js
module.exports = router;
