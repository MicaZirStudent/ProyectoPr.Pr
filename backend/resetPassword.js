require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const fix = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection;
    
    // Eliminar el índice problemático
    try {
        await db.collection('usuarios').dropIndex('email_1');
        console.log('Índice eliminado');
    } catch (e) {
        console.log('No había índice o ya fue eliminado');
    }
    
    // Crear el usuario admin
    const hash = await bcrypt.hash('admin123', 10);
    await db.collection('usuarios').insertOne({
        nombre: 'Admin',
        apellido: 'Solution',
        email: 'admin@solution.com',
        password: hash,
        rol: 'Administrador',
        estado: 'Activo'
    });
    
    console.log('Usuario creado correctamente!');
    mongoose.disconnect();
};

fix();