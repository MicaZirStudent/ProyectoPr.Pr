const mongoose = require('mongoose');

const observacionSchema = new mongoose.Schema({
  comentario: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  id_publicacion: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Publicacion', 
    required: true 
  },
  id_usuario_legal: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  }
});

module.exports = mongoose.model('Observacion', observacionSchema);