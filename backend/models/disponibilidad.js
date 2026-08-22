const mongoose = require('mongoose');

const disponibilidadSchema = new mongoose.Schema({
  dia_semana: { 
    type: String, 
    required: true,
    enum: [
      'Lunes',
      'Martes',
      'Miercoles',
      'Jueves',
      'Viernes',
      'Sabado'
    ]
  },
  hora_inicio: { type: String, required: true },
  hora_fin: { type: String, required: true },
  id_publicacion: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Publicacion', 
    required: true 
  }
});

module.exports = mongoose.model('Disponibilidad', disponibilidadSchema);