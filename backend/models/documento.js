const mongoose = require('mongoose');

const documentoSchema = new mongoose.Schema({
  tipo: { 
    type: String, 
    required: true,
    enum: [
      'Titulo de propiedad',
      'Escritura',
      'Plano',
      'Inhibicion'
    ]
  },
  nombre_archivo: { type: String, required: true },
  url_archivo: { type: String, required: true },
  fecha_carga: { type: Date, default: Date.now },
  id_publicacion: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Publicacion', 
    required: true 
  }
});

module.exports = mongoose.model('Documento', documentoSchema);