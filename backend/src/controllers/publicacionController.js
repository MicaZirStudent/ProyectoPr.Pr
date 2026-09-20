const mongoose = require('mongoose');
const Publicacion = require('../../models/publicacion');
const Observacion = require('../../models/observaciones');
const Notificacion = require('../../models/notificacion');
const Usuario = require('../../models/usuario');

const notificarAreaLegal = async (mensaje, idPublicacion) => {
    const usuariosLegal = await Usuario.find({ rol: 'Area legal' });
    if (!usuariosLegal.length) return;
    await Notificacion.insertMany(usuariosLegal.map((u) => ({
        mensaje,
        id_usuario_destino: u._id,
        id_publicacion: idPublicacion
    })));
};

// CU-02: Crear publicación
const crearPublicacion = async (req, res) => {
    try {
        const {
            titulo,
            descripcion,
            tipoOperacion,
            tipoPropiedad,
            precio,
            moneda,
            direccion,
            superficie,
            ambientes,
            imagenes
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
            moneda: ['USD', 'ARS'].includes(moneda) ? moneda : 'USD',
            direccion,
            superficie,
            ambientes,
            imagenes: Array.isArray(imagenes) ? imagenes : [],
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

        const { titulo, descripcion, tipoOperacion, tipoPropiedad, precio, moneda, direccion, superficie, ambientes, imagenes } = req.body;

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

        const eraObservada = publicacion.estado === 'Observada';

        publicacion.titulo = titulo;
        publicacion.descripcion = descripcion;
        publicacion.tipo_operacion = tipoOperacion.charAt(0).toUpperCase() + tipoOperacion.slice(1);
        publicacion.tipo_propiedad = tipoPropiedad ? tipoPropiedad.charAt(0).toUpperCase() + tipoPropiedad.slice(1) : undefined;
        publicacion.precio = precio;
        publicacion.moneda = ['USD', 'ARS'].includes(moneda) ? moneda : publicacion.moneda;
        publicacion.direccion = direccion;
        publicacion.superficie = superficie;
        publicacion.ambientes = ambientes;
        if (Array.isArray(imagenes)) {
            publicacion.imagenes = imagenes;
        }

        if (eraObservada) {
            publicacion.estado = 'Enviada a revision';
        }

        await publicacion.save();

        if (eraObservada) {
            await notificarAreaLegal(
                `La publicación "${publicacion.titulo}" fue corregida y está nuevamente pendiente de revisión`,
                publicacion._id
            );
        }

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

        publicacion.estado = 'Enviada a revision';
        await publicacion.save();

        await notificarAreaLegal(
            `Nueva publicación pendiente de revisión: "${publicacion.titulo}"`,
            publicacion._id
        );

        res.json({ mensaje: 'Publicación enviada a revisión correctamente' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al enviar a revisión', error: error.message });
    }
};

// CU-catálogo: búsqueda pública de propiedades publicadas (sin login)
const OPERACIONES_VALIDAS = ['venta', 'alquiler'];
const PROPIEDADES_VALIDAS = ['casa', 'departamento', 'local'];
const AMBIENTES_VALIDOS = ['1', '2', '3', '4', '4+'];
const MONEDAS_VALIDAS = ['USD', 'ARS'];

const obtenerPublicacionesPublicas = async (req, res) => {
    try {
        const { tipo_operacion, tipo_propiedad, ambientes, precio_desde, precio_hasta, moneda } = req.query;

        const filtro = { estado: 'Publicada' };

        if (moneda) {
            if (!MONEDAS_VALIDAS.includes(String(moneda).toUpperCase())) {
                return res.status(400).json({ success: false, mensaje: 'moneda inválida' });
            }
            filtro.moneda = String(moneda).toUpperCase();
        }

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
            moneda: pub.moneda || 'USD',
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

// Ficha pública de una propiedad publicada (sin login) — trae todos los datos, incluidas las fotos
const obtenerPublicacionPublicaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, mensaje: 'Propiedad no encontrada' });
        }

        const pub = await Publicacion.findOne({ _id: id, estado: 'Publicada' })
            .populate('id_agente', 'nombre apellido');

        if (!pub) {
            return res.status(404).json({ success: false, mensaje: 'Propiedad no encontrada' });
        }

        res.json({
            success: true,
            propiedad: {
                _id: pub._id,
                titulo: pub.titulo,
                tipo_operacion: pub.tipo_operacion,
                tipo_propiedad: pub.tipo_propiedad || null,
                precio: pub.precio,
                moneda: pub.moneda || 'USD',
                direccion: pub.direccion,
                superficie: pub.superficie,
                ambientes: pub.ambientes,
                imagenes: pub.imagenes,
                descripcion: pub.descripcion,
                agente: pub.id_agente ? `${pub.id_agente.nombre} ${pub.id_agente.apellido}` : null
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al obtener la propiedad', error: error.message });
    }
};

// Eliminar publicación: el agente puede hacerlo mientras no la envió a revisión (Borrador)
// o una vez que ya fue aprobada (Publicada). Mientras está en revisión no puede eliminarla.
const ESTADOS_ELIMINABLES = ['Borrador', 'Publicada'];

const eliminarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const idUsuario = req.usuario.idUsuario;

        const publicacion = await Publicacion.findOne({ _id: id, id_agente: idUsuario });

        if (!publicacion) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }

        if (!ESTADOS_ELIMINABLES.includes(publicacion.estado)) {
            return res.status(403).json({ mensaje: 'No se puede eliminar una publicación mientras está en revisión' });
        }

        await publicacion.deleteOne();

        res.json({ mensaje: 'Publicación eliminada correctamente' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar la publicación', error: error.message });
    }
};

// CU-05: Publicaciones pendientes de revisión para Área Legal
const ESTADOS_PENDIENTES = ['Enviada a revision', 'En revision'];

const obtenerPublicacionesPendientesRevision = async (req, res) => {
    try {
        const publicaciones = await Publicacion.find({ estado: { $in: ESTADOS_PENDIENTES } })
            .populate('id_agente', 'nombre apellido email')
            .sort({ updatedAt: -1 });

        res.json(publicaciones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener publicaciones pendientes', error: error.message });
    }
};

// Historial de publicaciones ya revisadas por Área Legal
const obtenerHistorialLegal = async (req, res) => {
    try {
        const { tipo } = req.query;

        if (!['aprobadas', 'observadas'].includes(tipo)) {
            return res.status(400).json({ mensaje: 'Parámetro tipo inválido. Use aprobadas u observadas' });
        }

        const estado = tipo === 'aprobadas' ? 'Publicada' : 'Observada';

        const publicaciones = await Publicacion.find({ estado })
            .populate('id_agente', 'nombre apellido email')
            .populate('usuario_revisor', 'nombre apellido')
            .sort({ fecha_revision: -1, updatedAt: -1 });

        res.json(publicaciones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el historial', error: error.message });
    }
};

// Aprobar publicación
const aprobarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const idUsuarioLegal = req.usuario.idUsuario;

        const publicacion = await Publicacion.findById(id);

        if (!publicacion) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }

        if (!ESTADOS_PENDIENTES.includes(publicacion.estado)) {
            return res.status(403).json({ mensaje: 'Solo se pueden aprobar publicaciones enviadas a revisión' });
        }

        publicacion.estado = 'Publicada';
        publicacion.fecha_revision = new Date();
        publicacion.usuario_revisor = idUsuarioLegal;
        await publicacion.save();

        await Notificacion.create({
            mensaje: `¡Tu publicación "${publicacion.titulo}" fue aprobada y ya está visible en el catálogo!`,
            id_usuario_destino: publicacion.id_agente,
            id_publicacion: publicacion._id
        });

        res.json({ mensaje: 'Publicación aprobada y publicada correctamente' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al aprobar la publicación', error: error.message });
    }
};

// Observar publicación (rechazar con comentarios)
const observarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { comentarios } = req.body;
        const idUsuarioLegal = req.usuario.idUsuario;

        if (!comentarios || comentarios.trim() === '') {
            return res.status(400).json({ mensaje: 'Debe ingresar un comentario para registrar la observación' });
        }

        const publicacion = await Publicacion.findById(id);

        if (!publicacion) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }

        if (!ESTADOS_PENDIENTES.includes(publicacion.estado)) {
            return res.status(403).json({ mensaje: 'Solo se pueden observar publicaciones enviadas a revisión' });
        }

        publicacion.estado = 'Observada';
        publicacion.comentarios_legal = comentarios.trim();
        publicacion.fecha_revision = new Date();
        publicacion.usuario_revisor = idUsuarioLegal;
        await publicacion.save();

        await Observacion.create({
            comentario: comentarios.trim(),
            id_publicacion: publicacion._id,
            id_usuario_legal: idUsuarioLegal
        });

        await Notificacion.create({
            mensaje: `Tu publicación "${publicacion.titulo}" tiene observaciones. Motivo: ${comentarios.trim()}`,
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
    obtenerPublicacionPublicaPorId,
    obtenerPublicacionesPendientesRevision,
    obtenerHistorialLegal,
    aprobarPublicacion,
    observarPublicacion
};