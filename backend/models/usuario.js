const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { 
    type: String, 
    required: true,
    enum: ['Agente', 'Area legal', 'Administrador']
  },
  estado: { 
    type: String, 
    default: 'Activo',
    enum: ['Activo', 'Inactivo']
  },
  reset_token: { type: String, default: null },
  reset_token_expira: { type: Date, default: null },
  reset_token_usado: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);