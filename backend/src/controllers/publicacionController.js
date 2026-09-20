const Publicacion = require('../../models/publicacion');
const Observacion = require('../../models/observaciones');
const Notificacion = require('../../models/notificacion');

// CU-02: Crear publicación
const crearPublicacion = async (req, res) => {
    try {
        console.log('Body recibido:', req.body);
        console.log('Usuario del token:', req.usuario);
        const {
            titulo,
            descripcion,
            tipoOperacion,
            tipoPropiedad,
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
            tipo_operacion: tipoOperacion.charAt(0).toUpperCase() + tipoOperacion.slice(1),
            tipo_propiedad: tipoPropiedad ? tipoPropiedad.charAt(0).toUpperCase() + tipoPropiedad.slice(1) : undefined,
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

// Obtener una publicación por id
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

// CU-03: Editar publicación
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
        publicacion.tipo_operacion = tipoOperacion.charAt(0).toUpperCase() + tipoOperacion.slice(1);
        publicacion.precio = precio;
        publicacion.direccion = direccion;
        publicacion.superficie = superficie;
        publicacion.ambientes = ambientes;

        if (publicacion.estado === 'Observada') {
            publicacion.estado = 'Borrador';
        }

        await publicacion.save();

        res.json({ mensaje: 'Publicación actualizada correctamente' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al editar la publicación', error: error.message });
    }
};

// CU-04: Enviar a revisión
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

// CU-catálogo: búsqueda pública de propiedades publicadas (sin login)
const OPERACIONES_VALIDAS = ['venta', 'alquiler'];
const PROPIEDADES_VALIDAS = ['casa', 'departamento', 'local'];
const AMBIENTES_VALIDOS = ['1', '2', '3', '4', '4+'];

const obtenerPublicacionesPublicas = async (req, res) => {
    try {
        const { tipo_operacion, tipo_propiedad, ambientes, precio_desde, precio_hasta } = req.query;

        const filtro = { estado: 'Publicada' };

        if (tipo_operacion) {
            if (!OPERACIONES_VALIDAS.includes(String(tipo_operacion).toLowerCase())) {
                return res.status(400).json({ success: false, mensaje: 'tipo_operacion inválido' });
            }
            filtro.tipo_operacion = new RegExp(`^${tipo_operacion}$`, 'i');
        }

        if (tipo_propiedad) {
            if (!PROPIEDADES_VALIDAS.includes(String(tipo_propiedad).toLowerCase())) {
                return res.status(400).json({ success: false, mensaje: 'tipo_propiedad inválido' });
            }
            filtro.tipo_propiedad = new RegExp(`^${tipo_propiedad}$`, 'i');
        }

        if (ambientes) {
            if (!AMBIENTES_VALIDOS.includes(String(ambientes))) {
                return res.status(400).json({ success: false, mensaje: 'ambientes inválido' });
            }
            filtro.ambientes = ambientes === '4+' ? { $gte: 4 } : Number(ambientes);
        }

        if (precio_desde !== undefined && precio_desde !== '') {
            const desde = Number(precio_desde);
            if (Number.isNaN(desde) || desde < 0) {
                return res.status(400).json({ success: false, mensaje: 'precio_desde inválido' });
            }
            filtro.precio = { ...(filtro.precio || {}), $gte: desde };
        }

        if (precio_hasta !== undefined && precio_hasta !== '') {
            const hasta = Number(precio_hasta);
            if (Number.isNaN(hasta) || hasta < 0) {
                return res.status(400).json({ success: false, mensaje: 'precio_hasta inválido' });
            }
            filtro.precio = { ...(filtro.precio || {}), $lte: hasta };
        }

        const publicaciones = await Publicacion.find(filtro)
            .populate('id_agente', 'nombre apellido')
            .sort({ createdAt: -1 });

        const propiedades = publicaciones.map((pub) => ({
            _id: pub._id,
            titulo: pub.titulo,
            tipo_operacion: pub.tipo_operacion,
            tipo_propiedad: pub.tipo_propiedad || null,
            precio: pub.precio,
            direccion: pub.direccion,
            superficie: pub.superficie,
            ambientes: pub.ambientes,
            imagenes: pub.imagenes,
            descripcion: pub.descripcion,
            agente: pub.id_agente ? `${pub.id_agente.nombre} ${pub.id_agente.apellido}` : null
        }));

        res.json({ success: true, total: propiedades.length, propiedades });

    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al buscar publicaciones', error: error.message });
    }
};

// Eliminar publicación (solo en estado Borrador)
const eliminarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const idUsuario = req.usuario.idUsuario;

        const publicacion = await Publicacion.findOne({ _id: id, id_agente: idUsuario });

        if (!publicacion) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }

        if (publicacion.estado !== 'Borrador') {
            return res.status(403).json({ mensaje: 'Solo se pueden eliminar publicaciones en borrador' });
        }

        await publicacion.deleteOne();

        res.json({ mensaje: 'Publicación eliminada correctamente' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar la publicación', error: error.message });
    }
};

// CU-05: Publicaciones en revisión para área legal
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

// Aprobar publicación
const aprobarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;

        const publicacion = await Publicacion.findById(id);

        if (!publicacion) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }

        if (publicacion.estado !== 'En revision') {
            return res.status(403).json({ mensaje: 'Solo se pueden aprobar publicaciones en revisión' });
        }

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

// Observar publicación
const observarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { comentario } = req.body;
        const idUsuarioLegal = req.usuario.idUsuario;

        if (!comentario || comentario.trim() === '') {
            return res.status(400).json({ mensaje: 'Debe ingresar un comentario para registrar la observación' });
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
    eliminarPublicacion,
    enviarARevision,
    obtenerPublicacionesPublicas,
    obtenerPublicacionesEnRevision,
    aprobarPublicacion,
    observarPublicacion
};