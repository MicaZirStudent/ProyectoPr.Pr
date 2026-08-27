const mongoose = require('mongoose');

const turnoSchema = new mongoose.Schema({
  nombre_cliente: { type: String, required: true },
  email_cliente: { type: String, required: true },
  whatsapp_cliente: { type: String, required: true },
  fecha: { type: Date, required: true },
  hora: { type: String, required: true },
  estado: { 
    type: String, 
    default: 'Pendiente',
    enum: ['Pendiente', 'Confirmado', 'Cancelado']
  },
  id_publicacion: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Publicacion', 
    required: true 
  },
  id_disponibilidad: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Disponibilidad', 
    required: true 
  }
});

module.exports = mongoose.model('Turno', turnoSchema);