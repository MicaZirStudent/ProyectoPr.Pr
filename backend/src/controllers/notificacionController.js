const mongoose = require('mongoose');
const Notificacion = require('../../models/notificacion');

const destinoDe = (req) => req.usuario.idUsuario;

const listarMias = async (req, res) => {
    try {
        const notificaciones = await Notificacion.find({ id_usuario_destino: destinoDe(req) })
            .sort({ fecha: -1, _id: -1 })
            .limit(40);

        res.json(notificaciones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al listar notificaciones', error: error.message });
    }
};

const marcarLeida = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ mensaje: 'Notificación no encontrada' });
        }

        const notificacion = await Notificacion.findOne({
            _id: id,
            id_usuario_destino: destinoDe(req)
        });

        if (!notificacion) {
            return res.status(404).json({ mensaje: 'Notificación no encontrada' });
        }

        notificacion.leida = true;
        await notificacion.save();
        res.json(notificacion);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar la notificación', error: error.message });
    }
};

const marcarTodasLeidas = async (req, res) => {
    try {
        await Notificacion.updateMany(
            { id_usuario_destino: destinoDe(req), leida: false },
            { $set: { leida: true } }
        );
        res.json({ mensaje: 'Notificaciones marcadas como leídas' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar las notificaciones', error: error.message });
    }
};

module.exports = { listarMias, marcarLeida, marcarTodasLeidas };
