const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Usuario = require('./models/usuario'); // ajustá la ruta si es distinta

async function crearUsuarioPrueba() {
  try {
    await mongoose.connect(process.env.MONGO_URI); // usá el mismo nombre de variable que tenés en tu .env

    const passwordHasheada = await bcrypt.hash('123456', 10);

    const usuario = new Usuario({
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@test.com',
      password: passwordHasheada,
      rol: 'Agente', // podés cambiar a 'Area legal' o 'Administrador'
      estado: 'Activo'
    });

    await usuario.save();
    console.log('Usuario de prueba creado:', usuario);

  } catch (error) {
    console.error('Error al crear el usuario:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

crearUsuarioPrueba();