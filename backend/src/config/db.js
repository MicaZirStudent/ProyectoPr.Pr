// Importamos la librería mysql2, que sabe comunicarse con MySQL
const mysql = require('mysql2');

// Importamos dotenv y la activamos: esto hace que las variables
// del archivo .env queden disponibles en process.env
require('dotenv').config();

// Creamos un "pool" de conexiones a la base de datos.
// En vez de abrir y cerrar una conexión nueva cada vez (lento),
// el pool mantiene varias conexiones abiertas y las reutiliza.
const pool = mysql.createPool({
    host: process.env.DB_HOST,           // dirección del servidor MySQL (localhost en nuestro caso)
    user: process.env.DB_USER,           // usuario de MySQL (root en XAMPP)
    password: process.env.DB_PASSWORD,   // contraseña de MySQL (vacía en XAMPP por defecto)
    database: process.env.DB_NAME,       // nombre de la base de datos (gestion_inmobiliaria)
    waitForConnections: true,            // si no hay conexiones libres, espera en vez de fallar
    connectionLimit: 10,                 // máximo de conexiones simultáneas permitidas
    queueLimit: 0                        // sin límite de peticiones esperando en cola
});

// Exportamos el pool en su versión "promise", para poder usar
// async/await en vez de callbacks al hacer consultas SQL
module.exports = pool.promise();
