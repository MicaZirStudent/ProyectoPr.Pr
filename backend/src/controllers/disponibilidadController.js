const mongoose = require('mongoose');
const Disponibilidad = require('../../models/disponibilidad');
const Publicacion = require('../../models/publicacion');

const MENSAJE_VACIO = 'Debe seleccionar al menos un día y horario disponible para continuar';
const MENSAJE_EXITO = 'Disponibilidad actualizada correctamente';
const DIAS_VALIDOS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

const horaAMinutos = (hora) => {
    const partes = String(hora).split(':');
    return Number(partes[0]) * 60 + Number(partes[1] || 0);
};

const obtenerPublicacionDelAgente = async (idPublicacion, idAgente) => {
    if (!mongoose.Types.ObjectId.isValid(idPublicacion)) {
        return null;
    }
    return Publicacion.findOne({
        _id: idPublicacion,
        id_agente: idAgente,
        estado: 'Publicada'
    });
};

const obtenerDisponibilidad = async (req, res) => {
    try {
        const { idPublicacion } = req.params;
        const publicacion = await obtenerPublicacionDelAgente(idPublicacion, req.usuario.idUsuario);

        if (!publicacion) {
            return res.status(404).json({ mensaje: 'La publicación no está disponible para gestionar horarios' });
        }

        const bloques = await Disponibilidad.find({ id_publicacion: idPublicacion }).sort({ dia_semana: 1, hora_inicio: 1 });

        res.json({
            publicacion: {
                idPublicacion: publicacion._id,
                titulo: publicacion.titulo
            },
            bloques
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener la disponibilidad', error: error.message });
    }
};

const guardarDisponibilidad = async (req, res) => {
    try {
        const { idPublicacion } = req.params;
        const { bloques } = req.body;

        if (!Array.isArray(bloques) || bloques.length === 0) {
            return res.status(400).json({ mensaje: MENSAJE_VACIO });
        }

        const publicacion = await obtenerPublicacionDelAgente(idPublicacion, req.usuario.idUsuario);
        if (!publicacion) {
            return res.status(404).json({ mensaje: 'La publicación no está disponible para gestionar horarios' });
        }

        const bloquesLimpios = [];
        for (const bloque of bloques) {
            const dia_semana = bloque.dia_semana;
            const hora_inicio = String(bloque.hora_inicio || '').slice(0, 5);
            const hora_fin = String(bloque.hora_fin || '').slice(0, 5);

            if (!DIAS_VALIDOS.includes(dia_semana) || !hora_inicio || !hora_fin) {
                return res.status(400).json({ mensaje: MENSAJE_VACIO });
            }
            if (horaAMinutos(hora_inicio) >= horaAMinutos(hora_fin)) {
                return res.status(400).json({ mensaje: 'La hora de fin debe ser posterior a la de inicio' });
            }

            bloquesLimpios.push({
                dia_semana,
                hora_inicio,
                hora_fin,
                id_publicacion: idPublicacion
            });
        }

        await Disponibilidad.deleteMany({ id_publicacion: idPublicacion });
        await Disponibilidad.insertMany(bloquesLimpios);

        res.json({ mensaje: MENSAJE_EXITO });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al guardar la disponibilidad', error: error.message });
    }
};

module.exports = { obtenerDisponibilidad, guardarDisponibilidad };
