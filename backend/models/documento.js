const mongoose = require('mongoose');

// Documentación legal adjunta a una publicación (PDF).
// Se guarda en su propia colección para no inflar el documento de la publicación
// (MongoDB limita cada documento a 16 MB).
const documentoSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    default: 'Documento legal',
    enum: [
      'Documento legal',
      'Titulo de propiedad',
      'Escritura',
      'Plano',
      'Inhibicion'
    ]
  },
  nombre_archivo: { type: String, required: true },
  // Contenido del PDF como data URL (data:application/pdf;base64,...)
  url_archivo: { type: String, required: true },
  tamanio_bytes: { type: Number },
  fecha_carga: { type: Date, default: Date.now },
  id_publicacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Publicacion',
    required: true,
    index: true
  }
});

module.exports = mongoose.model('Documento', documentoSchema);
