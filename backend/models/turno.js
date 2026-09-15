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

// Evita dos reservas activas en el mismo día y hora para la misma propiedad
turnoSchema.index(
  { id_publicacion: 1, fecha: 1, hora: 1 },
  { unique: true, partialFilterExpression: { estado: { $in: ['Pendiente', 'Confirmado'] } } }
);

module.exports = mongoose.model('Turno', turnoSchema);