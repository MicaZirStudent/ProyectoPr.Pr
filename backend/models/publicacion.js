const mongoose = require('mongoose');

const publicacionSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  tipo_operacion: { 
    type: String, 
    required: true,
    enum: ['Venta', 'Alquiler']
  },
  precio: { type: Number, required: true },
  direccion: { type: String, required: true },
  ubicacion_mapa: {
    lat: { type: Number },
    lng: { type: Number }
  },
  superficie: { type: Number, required: true },
  ambientes: { type: Number, required: true },
  imagenes: [{ type: String }],
  videos: [{ type: String }],
  estado: { 
    type: String, 
    default: 'Borrador',
    enum: [
      'Borrador',
      'Enviada a revision',
      'En revision',
      'Observada',
      'Aprobada',
      'Publicada',
      'Dada de baja'
    ]
  },
  id_agente: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Publicacion', publicacionSchema);