const Publicacion = require('../../models/publicacion');
const Observacion = require('../../models/observaciones');
const Notificacion = require('../../models/notificacion');

// ---------- FUNCIONES YA EXISTENTES (CU-01 a CU-04), MIGRADAS A MONGOOSE ----------

// CU-02: Crear publicación
const crearPublicacion = async (req, res) => {
    try {
        const {
            titulo,
            descripcion,
            tipoOperacion,
            precio,
            direccion,
            superficie,
            ambientes
        } = req.body;

        const idUsuario = req.usuario.idUsuario;

        if (!titulo || !tipoOperacion || !precio || !direccion) {
            return res.status(400).json({ mensaje: 'Complete todos los campos obligatorios' });
        }

        const nuevaPublicacion = new Publicacion({
            titulo,
            descripcion,
            tipo_operacion: tipoOperacion,
            precio,
            direccion,
            superficie,
            ambientes,
            estado: 'Borrador',
            id_agente: idUsuario
        });

        await nuevaPublicacion.save();

        res.status(201).json({
            mensaje: 'Publicación guardada correctamente',
            idPublicacion: nuevaPublicacion._id
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear la publicación', error: error.message });
    }
};

// Obtener publicaciones del agente logueado
const obtenerMisPublicaciones = async (req, res) => {
    try {
        const idUsuario = req.usuario.idUsuario;
        const publicaciones = await Publicacion.find({ id_agente: idUsuario }).sort({ createdAt: -1 });
        res.json(publicaciones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener publicaciones', error: error.message });
    }
};

// Obtener una publicación por id (del agente dueño)
const obtenerPublicacionPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const idUsuario = req.usuario.idUsuario;

        const publicacion = await Publicacion.findOne({ _id: id, id_agente: idUsuario });

        if (!publicacion) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }

        res.json(publicacion);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener la publicación', error: error.message });
    }
};

// CU-03: Editar publicación (solo Borrador u Observada)
const editarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const idUsuario = req.usuario.idUsuario;

        const { titulo, descripcion, tipoOperacion, precio, direccion, superficie, ambientes } = req.body;

        if (!titulo || !tipoOperacion || !precio || !direccion) {
            return res.status(400).json({ mensaje: 'Complete todos los campos obligatorios' });
        }

        const publicacion = await Publicacion.findOne({ _id: id, id_agente: idUsuario });

        if (!publicacion) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }

        if (!['Borrador', 'Observada'].includes(publicacion.estado)) {
            return res.status(403).json({ mensaje: 'No se puede editar una publicación en este estado' });
        }

        publicacion.titulo = titulo;
        publicacion.descripcion = descripcion;
        publicacion.tipo_operacion = tipoOperacion;
        publicacion.precio = precio;
        publicacion.direccion = direccion;
        publicacion.superficie = superficie;
        publicacion.ambientes = ambientes;

        // Si estaba observada, vuelve a Borrador para reenviarla
        if (publicacion.estado === 'Observada') {
            publicacion.estado = 'Borrador';
        }

        await publicacion.save();

        res.json({ mensaje: 'Publicación actualizada correctamente' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al editar la publicación', error: error.message });
    }
};

// CU-04: Enviar a revisión (solo desde Borrador)
const enviarARevision = async (req, res) => {
    try {
        const { id } = req.params;
        const idUsuario = req.usuario.idUsuario;

        const publicacion = await Publicacion.findOne({ _id: id, id_agente: idUsuario });

        if (!publicacion) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }

        if (publicacion.estado !== 'Borrador') {
            return res.status(403).json({ mensaje: 'Solo se pueden enviar a revisión publicaciones en borrador' });
        }

        publicacion.estado = 'En revision';
        await publicacion.save();

        res.json({ mensaje: 'Publicación enviada a revisión correctamente' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al enviar a revisión', error: error.message });
    }
};

// ---------- CU-05: REVISAR PUBLICACIÓN (Área Legal) ----------

// Listado de publicaciones pendientes para el área legal
const obtenerPublicacionesEnRevision = async (req, res) => {
    try {
        const publicaciones = await Publicacion.find({ estado: 'En revision' })
            .populate('id_agente', 'nombre apellido email')
            .sort({ createdAt: 1 });

        res.json(publicaciones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener publicaciones en revisión', error: error.message });
    }
};

// Aprobar publicación: En revision -> Aprobada -> Publicada, y notifica al agente
const aprobarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const idUsuarioLegal = req.usuario.idUsuario;

        const publicacion = await Publicacion.findById(id);

        if (!publicacion) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }

        if (publicacion.estado !== 'En revision') {
            return res.status(403).json({ mensaje: 'Solo se pueden aprobar publicaciones en revisión' });
        }

        // Paso intermedio + visibilidad pública
        publicacion.estado = 'Aprobada';
        await publicacion.save();

        publicacion.estado = 'Publicada';
        await publicacion.save();

        await Notificacion.create({
            asunto: 'Publicación aprobada',
            mensaje: `Tu publicación "${publicacion.titulo}" fue aprobada y ya está visible en el portal.`,
            id_usuario_destino: publicacion.id_agente,
            id_publicacion: publicacion._id
        });

        res.json({ mensaje: 'Publicación aprobada y publicada correctamente' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al aprobar la publicación', error: error.message });
    }
};

// Observar publicación: En revision -> Observada, con comentario obligatorio
const observarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { comentario } = req.body;
        const idUsuarioLegal = req.usuario.idUsuario;

        if (!comentario || comentario.trim() === '') {
            return res.status(400).json({ mensaje: 'Debe ingresar un comentario para poder registrar la observación' });
        }

        const publicacion = await Publicacion.findById(id);

        if (!publicacion) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }

        if (publicacion.estado !== 'En revision') {
            return res.status(403).json({ mensaje: 'Solo se pueden observar publicaciones en revisión' });
        }

        publicacion.estado = 'Observada';
        await publicacion.save();

        await Observacion.create({
            comentario,
            id_publicacion: publicacion._id,
            id_usuario_legal: idUsuarioLegal
        });

        await Notificacion.create({
            asunto: 'Publicación observada',
            mensaje: `Tu publicación "${publicacion.titulo}" fue observada. Motivo: ${comentario}`,
            id_usuario_destino: publicacion.id_agente,
            id_publicacion: publicacion._id
        });

        res.json({ mensaje: 'Observación registrada correctamente' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al registrar la observación', error: error.message });
    }
};

module.exports = {
    crearPublicacion,
    obtenerMisPublicaciones,
    obtenerPublicacionPorId,
    editarPublicacion,
    enviarARevision,
    obtenerPublicacionesEnRevision,
    aprobarPublicacion,
    observarPublicacion
};