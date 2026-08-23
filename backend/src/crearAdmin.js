require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Usuario = require('./models/usuario');

const crearAdmin = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    
    const contraseñaEncriptada = await bcrypt.hash('admin123', 10);
    
    const admin = new Usuario({
        nombre: 'Admin',
        apellido: 'Test',
        email: 'admin@solution.com',
        contraseña: contraseñaEncriptada,
        rol: 'Administrador',
        estado: 'Activo'
    });
    
    await admin.save();
    console.log('Admin creado correctamente!');
    mongoose.disconnect();
};

crearAdmin();