// Importamos la conexión a la base de datos
const db = require('../config/db');

// Función para CREAR una publicación nueva
const crearPublicacion = async (req, res) => {
    try {
        // Sacamos los datos que React nos va a mandar en el body
        const {
            titulo,
            descripcion,
            tipoOperacion,
            precio,
            direccion,
            superficie,
            ambientes
        } = req.body;

        // El id del agente lo sacamos del token JWT, no del body
        // (más adelante conectamos el middleware que lo pone disponible)
        const idUsuario = req.usuario.idUsuario;

        // Validamos que vengan todos los campos obligatorios
        if (!titulo || !tipoOperacion || !precio || !direccion) {
            return res.status(400).json({ mensaje: 'Complete todos los campos obligatorios' });
        }

        // Insertamos la publicación en la base de datos con estado borrador
        const [resultado] = await db.query(
            `INSERT INTO publicacion 
            (titulo, descripcion, tipoOperacion, precioPublicacion, direccion, superficieM2, ambientes, estadoPublicacion, idUsuario) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'borrador', ?)`,
            [titulo, descripcion, tipoOperacion, precio, direccion, superficie, ambientes, idUsuario]
        );

        // Respondemos con el id de la publicación creada
        res.status(201).json({
            mensaje: 'Publicación guardada correctamente',
            idPublicacion: resultado.insertId
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear la publicación', error: error.message });
    }
};

// Función para OBTENER todas las publicaciones del agente logueado
const obtenerMisPublicaciones = async (req, res) => {
    try {
        const idUsuario = req.usuario.idUsuario;

        // Traemos todas las publicaciones del agente ordenadas por fecha
        const [publicaciones] = await db.query(
            'SELECT * FROM publicacion WHERE idUsuario = ? ORDER BY fechaDeCreacion DESC',
            [idUsuario]
        );

        res.json(publicaciones);

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener publicaciones', error: error.message });
    }
};

// Exportamos las funciones
module.exports = { crearPublicacion, obtenerMisPublicaciones };