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
// Función para OBTENER una publicación por su id
// La necesitamos para pre-cargar el formulario de edición con los datos actuales
const obtenerPublicacionPorId = async (req, res) => {
    try {
        // El id de la publicación viene en la URL, por ejemplo /api/publicaciones/1
        const { id } = req.params;

        // El id del usuario logueado lo sacamos del token
        const idUsuario = req.usuario.idUsuario;

        // Buscamos la publicación en la base de datos
        // Filtramos por idUsuario también para que un agente no pueda ver publicaciones de otro
        const [publicaciones] = await db.query(
            'SELECT * FROM publicacion WHERE idPublicacion = ? AND idUsuario = ?',
            [id, idUsuario]
        );

        // Si no existe o no le pertenece, respondemos con 404
        if (publicaciones.length === 0) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }

        res.json(publicaciones[0]);

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener la publicación', error: error.message });
    }
};

// Función para EDITAR una publicación existente
// Solo se puede editar si está en estado borrador u observada
const editarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const idUsuario = req.usuario.idUsuario;

        const {
            titulo,
            descripcion,
            tipoOperacion,
            precio,
            direccion,
            superficie,
            ambientes
        } = req.body;

        // Validamos campos obligatorios
        if (!titulo || !tipoOperacion || !precio || !direccion) {
            return res.status(400).json({ mensaje: 'Complete todos los campos obligatorios' });
        }

        // Primero verificamos que la publicación exista y le pertenezca al agente
        const [publicaciones] = await db.query(
            'SELECT * FROM publicacion WHERE idPublicacion = ? AND idUsuario = ?',
            [id, idUsuario]
        );

        if (publicaciones.length === 0) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }

        const publicacion = publicaciones[0];

        // Verificamos que esté en un estado editable (borrador u observada)
        // Si está en revisión, publicada o dada de baja, no se puede editar
        if (!['borrador', 'observada'].includes(publicacion.estadoPublicacion)) {
            return res.status(403).json({ mensaje: 'No se puede editar una publicación en este estado' });
        }

        // Si estaba observada y la editamos, vuelve a borrador
        // Así el agente la puede volver a enviar a revisión
        const nuevoEstado = publicacion.estadoPublicacion === 'observada' ? 'borrador' : publicacion.estadoPublicacion;

        // Actualizamos la publicación en la base de datos
        await db.query(
            `UPDATE publicacion SET 
            titulo = ?, descripcion = ?, tipoOperacion = ?, precioPublicacion = ?, 
            direccion = ?, superficieM2 = ?, ambientes = ?, estadoPublicacion = ?
            WHERE idPublicacion = ? AND idUsuario = ?`,
            [titulo, descripcion, tipoOperacion, precio, direccion, superficie, ambientes, nuevoEstado, id, idUsuario]
        );

        res.json({ mensaje: 'Publicación actualizada correctamente' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al editar la publicación', error: error.message });
    }
};
// Exportamos las funciones
module.exports = { crearPublicacion, obtenerMisPublicaciones, obtenerPublicacionPorId, editarPublicacion };