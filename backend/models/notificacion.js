const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  mensaje: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  leida: { type: Boolean, default: false },
  id_usuario_destino: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  id_publicacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Publicacion',
    required: false
  }
});

module.exports = mongoose.model('Notificacion', notificacionSchema);