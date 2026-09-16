require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Usuario = require('../models/usuario');

const crearAdmin = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const email = 'admin@solution.com';
    const existente = await Usuario.findOne({ email });
    if (existente) {
        console.log('Ya existe un administrador con ese correo');
        await mongoose.disconnect();
        return;
    }

    const passwordHasheada = await bcrypt.hash('admin123', 10);

    const admin = new Usuario({
        nombre: 'Admin',
        apellido: 'Test',
        email,
        password: passwordHasheada,
        rol: 'Administrador',
        estado: 'Activo'
    });

    await admin.save();
    console.log('Admin creado: admin@solution.com / admin123');
    await mongoose.disconnect();
};

crearAdmin().catch((error) => {
    console.error('Error al crear admin:', error.message);
    process.exit(1);
});
