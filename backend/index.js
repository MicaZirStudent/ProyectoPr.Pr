const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
connectDB();
// Importamos express, el framework que nos permite crear el servidor
const express = require('express');

// Importamos cors, para que React (puerto 3000) pueda hablarle a este backend (puerto 3001)
const cors = require('cors');

// Cargamos las variables del archivo .env
require('dotenv').config();

// Importamos las rutas de autenticación (login y registro)
const authRoutes = require('./src/routes/authRoutes');
// Importamos las rutas de publicaciones
const publicacionRoutes = require('./src/routes/publicacionRoutes');
// Importamos las rutas de turnos (solicitar visita)
const turnoRoutes = require('./src/routes/turnoRoutes');

// Creamos la aplicación de Express
const app = express();

// Habilitamos CORS para todas las rutas
app.use(cors());

// Habilitamos que Express entienda JSON en el cuerpo de las peticiones
app.use(express.json());

// Le decimos a Express: todo lo que llegue a /api/auth, mandalo a authRoutes
// Por eso el login termina quedando en /api/auth/login y el registro en /api/auth/registrar
app.use('/api/auth', authRoutes);
// Rutas de publicaciones (protegidas por token)
app.use('/api/publicaciones', publicacionRoutes);
// Rutas de turnos (públicas: el cliente interesado no inicia sesión)
app.use('/api/turnos', turnoRoutes);

// Ruta de prueba: si entramos a localhost:3001/ vemos este mensaje
app.get('/', (req, res) => {
    res.send('Backend funcionando correctamente 🚀');
});

// Ruta de prueba para verificar la conexión a la base de datos
app.get('/test-db', async (req, res) => {
    try {
        // readyState 1 significa: MongoDB está conectado
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({ mensaje: 'Error al conectar con la base de datos' });
        }
        res.json({ mensaje: 'Conexión a la base de datos exitosa', motor: 'mongodb' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al conectar con la base de datos', error: error.message });
    }
});

// Tomamos el puerto desde el .env, o usamos 3001 si no está definido
const PORT = process.env.PORT || 3001;

// Levantamos el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});