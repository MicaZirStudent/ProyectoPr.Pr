require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const crearAdmin = async () => {
    await mongoose.connect('mongodb://localhost:27017/solution');
    
    const db = mongoose.connection;
    
    const contraseñaEncriptada = await bcrypt.hash('admin123', 10);
    
    await db.collection('usuarios').insertOne({
        nombre: 'Admin',
        apellido: 'Test',
        email: 'admin2@solution.com',
        password: contraseñaEncriptada,
        rol: 'Administrador',
        estado: 'Activo'
    });
    
    console.log('Admin creado correctamente!');
    mongoose.disconnect();
};

crearAdmin();