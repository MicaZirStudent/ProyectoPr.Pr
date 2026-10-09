const mongoose = require('mongoose');
const Publicacion = require('../../models/publicacion');
const Observacion = require('../../models/observaciones');
const Notificacion = require('../../models/notificacion');
const Usuario = require('../../models/usuario');
const Documento = require('../../models/documento');
const Disponibilidad = require('../../models/disponibilidad');
const Turno = require('../../models/turno');

const ROL_AGENTE = 'Agente';
const ROL_LEGAL = 'Area legal';
const ROL_ADMIN = 'Administrador';

const MENSAJE_CAMPOS = 'Complete todos los campos obligatorios';
const MENSAJE_SIN_FOTO = 'Agregá al menos una foto del inmueble';
const MENSAJE_SIN_PDF = 'Adjuntá al menos un documento legal en PDF';
const MENSAJE_NO_ENCONTRADA = 'Publicación no encontrada';

const PREFIJO_PDF = 'data:application/pdf;base64,';
const PREFIJO_IMAGEN = 'data:image/';
const MAX_PDF_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENTOS = 10;

// Estados en los que el agente puede eliminar su propia publicación
const ESTADOS_ELIMINABLES_AGENTE = ['Borrador', 'Publicada'];
// Estados en los que el agente puede editar su propia publicación (el administrador edita en cualquiera)
const ESTADOS_EDITABLES_AGENTE = ['Borrador', 'Observada'];
const ESTADOS_PENDIENTES = ['Enviada a revision', 'En revision'];

// Paso anterior de cada estado dentro del flujo de revisión (lo usa el Área Legal para revertir)
const ESTADO_ANTERIOR = {
    Publicada: 'Enviada a revision',
    Observada: 'Enviada a revision',
    'Enviada a revision': 'Borrador',
    'En revision': 'Borrador'
};

const idValido = (id) => mongoose.Types.ObjectId.isValid(id);

const capitalizar = (texto) => (texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : undefined);

const tamanioDeDataUrl = (dataUrl, prefijo) => Math.floor((dataUrl.length - prefijo.length) * 3 / 4);

// ---------- Validación de datos ----------

// Normaliza y valida los campos del formulario de publicación.
const leerDatosPublicacion = (body) => {
    const { titulo, descripcion, tipoOperacion, tipoPropiedad, precio, moneda, direccion, superficie, ambientes, imagenes } = body;

    const textosCompletos = [titulo, descripcion, tipoOperacion, direccion].every((v) => String(v || '').trim());
    const precioNum = Number(precio);
    const superficieNum = Number(superficie);
    const ambientesNum = Number(ambientes);

    if (!textosCompletos || !(precioNum > 0) || !(superficieNum > 0) || !(ambientesNum >= 1)) {
        return { error: MENSAJE_CAMPOS };
    }

    const listaImagenes = Array.isArray(imagenes)
        ? imagenes.filter((img) => typeof img === 'string' && img.startsWith(PREFIJO_IMAGEN))
        : [];

    return {
        datos: {
            titulo: String(titulo).trim(),
            descripcion: String(descripcion).trim(),
            tipo_operacion: capitalizar(tipoOperacion),
            tipo_propiedad: capitalizar(tipoPropiedad),
            precio: precioNum,
            moneda: ['USD', 'ARS'].includes(moneda) ? moneda : 'USD',
            direccion: String(direccion).trim(),
            superficie: superficieNum,
            ambientes: Math.round(ambientesNum),
            imagenes: listaImagenes
        }
    };
};

// Separa los documentos que se conservan (traen _id) de los nuevos (traen nombre + contenido PDF).
const leerDocumentos = (documentos) => {
    const lista = Array.isArray(documentos) ? documentos : [];
    const conservar = [];
    const nuevos = [];

    for (const doc of lista) {
        if (doc && doc._id) {
            if (idValido(doc._id)) conservar.push(String(doc._id));
            continue;
        }
        const contenido = String(doc?.contenido || '');
        if (!contenido.startsWith(PREFIJO_PDF)) {
            return { error: 'Los documentos deben estar en formato PDF' };
        }
        const tamanio = tamanioDeDataUrl(contenido, PREFIJO_PDF);
        if (tamanio > MAX_PDF_BYTES) {
            return { error: `El archivo "${doc.nombre}" supera el máximo de 5 MB` };
        }
        nuevos.push({
            nombre_archivo: String(doc.nombre || 'documento.pdf').trim(),
            url_archivo: contenido,
            tamanio_bytes: tamanio
        });
    }

    if (conservar.length + nuevos.length > MAX_DOCUMENTOS) {
        return { error: `Podés adjuntar hasta ${MAX_DOCUMENTOS} documentos` };
    }

    return { conservar, nuevos };
};

// ---------- Helpers de acceso a datos ----------

const resumenDocumentos = async (idsPublicaciones) => {
    const docs = await Documento.find({ id_publicacion: { $in: idsPublicaciones } })
        .select('nombre_archivo tamanio_bytes fecha_carga id_publicacion')
        .sort({ fecha_carga: 1 })
        .lean();

    return docs.reduce((acc, doc) => {
        const clave = String(doc.id_publicacion);
        (acc[clave] = acc[clave] || []).push({
            _id: doc._id,
            nombre: doc.nombre_archivo,
            tamanio: doc.tamanio_bytes || null
        });
        return acc;
    }, {});
};

// Devuelve las publicaciones como objetos planos con la lista de documentos (sin el contenido)
const conDocumentos = async (publicaciones) => {
    const porPublicacion = await resumenDocumentos(publicaciones.map((p) => p._id));
    return publicaciones.map((pub) => ({
        ...(pub.toObject ? pub.toObject() : pub),
        documentos: porPublicacion[String(pub._id)] || []
    }));
};

// El administrador accede a cualquier publicación; el agente solo a las propias
const buscarPublicacionGestionable = (req, id) => {
    if (!idValido(id)) return null;
    const filtro = req.usuario.rol === ROL_ADMIN
        ? { _id: id }
        : { _id: id, id_agente: req.usuario.idUsuario };
    return Publicacion.findOne(filtro);
};

const notificarAreaLegal = async (mensaje, idPublicacion) => {
    const usuariosLegal = await Usuario.find({ rol: ROL_LEGAL });
    if (!usuariosLegal.length) return;
    await Notificacion.insertMany(usuariosLegal.map((u) => ({
        mensaje,
        id_usuario_destino: u._id,
        id_publicacion: idPublicacion,
        tipo: 'revision'
    })));
};

const notificarAgente = (publicacion, mensaje, tipo, conReferencia = true) => Notificacion.create({
    mensaje,
    id_usuario_destino: publicacion.id_agente,
    id_publicacion: conReferencia ? publicacion._id : undefined,
    tipo
});

// Borra la publicación junto con todo lo que depende de ella para no dejar datos huérfanos
const eliminarPublicacionYDependencias = async (publicacion) => {
    const filtro = { id_publicacion: publicacion._id };
    await Promise.all([
        Documento.deleteMany(filtro),
        Disponibilidad.deleteMany(filtro),
        Turno.deleteMany(filtro),
        Observacion.deleteMany(filtro),
        Notificacion.deleteMany(filtro)
    ]);
    await publicacion.deleteOne();
};

// ---------- CU-02: Crear publicación (Agente) ----------

const crearPublicacion = async (req, res) => {
    try {
        const { datos, error } = leerDatosPublicacion(req.body);
        if (error) {
            return res.status(400).json({ mensaje: error });
        }
        if (datos.imagenes.length === 0) {
            return res.status(400).json({ mensaje: MENSAJE_SIN_FOTO });
        }

        const documentos = leerDocumentos(req.body.documentos);
        if (documentos.error) {
            return res.status(400).json({ mensaje: documentos.error });
        }
        if (documentos.nuevos.length === 0) {
            return res.status(400).json({ mensaje: MENSAJE_SIN_PDF });
        }

        const nuevaPublicacion = await Publicacion.create({
            ...datos,
            estado: 'Borrador',
            id_agente: req.usuario.idUsuario
        });

        try {
            await Documento.insertMany(documentos.nuevos.map((doc) => ({ ...doc, id_publicacion: nuevaPublicacion._id })));
        } catch (errorDocumentos) {
            // Si fallan los adjuntos no dejamos una publicación incompleta
            await nuevaPublicacion.deleteOne();
            throw errorDocumentos;
        }

        res.status(201).json({
            mensaje: 'Publicación guardada correctamente',
            idPublicacion: nuevaPublicacion._id
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear la publicación', error: error.message });
    }
};

// Agente: sus publicaciones. Administrador: todas las del sistema.
const obtenerMisPublicaciones = async (req, res) => {
    try {
        const esAdmin = req.usuario.rol === ROL_ADMIN;
        const filtro = esAdmin ? {} : { id_agente: req.usuario.idUsuario };
        const publicaciones = await Publicacion.find(filtro)
            .populate('id_agente', 'nombre apellido')
            .sort({ createdAt: -1 });
        res.json(publicaciones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener publicaciones', error: error.message });
    }
};

const obtenerPublicacionPorId = async (req, res) => {
    try {
        const publicacion = await buscarPublicacionGestionable(req, req.params.id);

        if (!publicacion) {
            return res.status(404).json({ mensaje: MENSAJE_NO_ENCONTRADA });
        }

        const [conDocs] = await conDocumentos([publicacion]);
        res.json(conDocs);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener la publicación', error: error.message });
    }
};

// ---------- CU-03: Editar publicación (Agente en Borrador/Observada, Administrador en cualquier estado) ----------

const editarPublicacion = async (req, res) => {
    try {
        const esAdmin = req.usuario.rol === ROL_ADMIN;
        const { datos, error } = leerDatosPublicacion(req.body);
        if (error) {
            return res.status(400).json({ mensaje: error });
        }

        const publicacion = await buscarPublicacionGestionable(req, req.params.id);
        if (!publicacion) {
            return res.status(404).json({ mensaje: MENSAJE_NO_ENCONTRADA });
        }

        if (!esAdmin && !ESTADOS_EDITABLES_AGENTE.includes(publicacion.estado)) {
            return res.status(403).json({ mensaje: 'No se puede editar una publicación en este estado' });
        }

        if (datos.imagenes.length === 0) {
            return res.status(400).json({ mensaje: MENSAJE_SIN_FOTO });
        }

        // Si no se envía la lista de documentos, se conservan los actuales
        const actuales = await Documento.find({ id_publicacion: publicacion._id }).select('_id').lean();
        const idsActuales = actuales.map((d) => String(d._id));
        const documentos = req.body.documentos === undefined
            ? { conservar: idsActuales, nuevos: [] }
            : leerDocumentos(req.body.documentos);
        if (documentos.error) {
            return res.status(400).json({ mensaje: documentos.error });
        }
        const conservar = documentos.conservar.filter((id) => idsActuales.includes(id));
        if (conservar.length + documentos.nuevos.length === 0) {
            return res.status(400).json({ mensaje: MENSAJE_SIN_PDF });
        }

        // Al corregir una observación, el agente la reenvía automáticamente a revisión
        const reenviarARevision = !esAdmin && publicacion.estado === 'Observada';

        Object.assign(publicacion, datos);
        if (reenviarARevision) {
            publicacion.estado = 'Enviada a revision';
        }
        await publicacion.save();

        if (documentos.nuevos.length) {
            await Documento.insertMany(documentos.nuevos.map((doc) => ({ ...doc, id_publicacion: publicacion._id })));
        }
        await Documento.deleteMany({
            id_publicacion: publicacion._id,
            _id: { $in: idsActuales.filter((id) => !conservar.includes(id)) }
        });

        if (reenviarARevision) {
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

// ---------- CU-04: Enviar a revisión (Agente) ----------

const enviarARevision = async (req, res) => {
    try {
        const { id } = req.params;
        const publicacion = idValido(id)
            ? await Publicacion.findOne({ _id: id, id_agente: req.usuario.idUsuario })
            : null;

        if (!publicacion) {
            return res.status(404).json({ mensaje: MENSAJE_NO_ENCONTRADA });
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

// ---------- Documentos adjuntos ----------

// Descarga un PDF: Área Legal y Administrador cualquiera; el agente solo los de sus publicaciones
const obtenerDocumento = async (req, res) => {
    try {
        const { id, idDocumento } = req.params;
        if (!idValido(id) || !idValido(idDocumento)) {
            return res.status(404).json({ mensaje: 'Documento no encontrado' });
        }

        if (req.usuario.rol === ROL_AGENTE) {
            const propia = await Publicacion.exists({ _id: id, id_agente: req.usuario.idUsuario });
            if (!propia) {
                return res.status(404).json({ mensaje: 'Documento no encontrado' });
            }
        }

        const documento = await Documento.findOne({ _id: idDocumento, id_publicacion: id });
        if (!documento) {
            return res.status(404).json({ mensaje: 'Documento no encontrado' });
        }

        res.json({ nombre: documento.nombre_archivo, contenido: documento.url_archivo });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el documento', error: error.message });
    }
};

// ---------- CU-08: Catálogo público (sin login) ----------

const OPERACIONES_VALIDAS = ['venta', 'alquiler'];
const PROPIEDADES_VALIDAS = ['casa', 'departamento', 'local'];
const AMBIENTES_VALIDOS = ['1', '2', '3', '4', '4+'];
const MONEDAS_VALIDAS = ['USD', 'ARS'];

const serializarPublica = (pub) => ({
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
    idAgente: pub.id_agente ? pub.id_agente._id : null,
    agente: pub.id_agente ? `${pub.id_agente.nombre} ${pub.id_agente.apellido}` : null
});

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

        const propiedades = publicaciones.map(serializarPublica);

        res.json({ success: true, total: propiedades.length, propiedades });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al buscar publicaciones', error: error.message });
    }
};

// Ficha pública de una propiedad publicada (sin login)
const obtenerPublicacionPublicaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!idValido(id)) {
            return res.status(404).json({ success: false, mensaje: 'Propiedad no encontrada' });
        }

        const pub = await Publicacion.findOne({ _id: id, estado: 'Publicada' })
            .populate('id_agente', 'nombre apellido');

        if (!pub) {
            return res.status(404).json({ success: false, mensaje: 'Propiedad no encontrada' });
        }

        res.json({ success: true, propiedad: serializarPublica(pub) });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al obtener la propiedad', error: error.message });
    }
};

// ---------- Eliminar publicación ----------
// Agente: solo las propias, en Borrador o Publicada (no mientras está en revisión).
// Área Legal y Administrador: cualquier publicación, en cualquier estado; se notifica al agente.

const QUIEN_ELIMINA = {
    [ROL_LEGAL]: 'El Área Legal',
    [ROL_ADMIN]: 'El administrador'
};

const eliminarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminaSupervisor = Boolean(QUIEN_ELIMINA[req.usuario.rol]);

        const publicacion = idValido(id) ? await Publicacion.findById(id) : null;
        const accesible = publicacion
            && (eliminaSupervisor || String(publicacion.id_agente) === String(req.usuario.idUsuario));

        if (!accesible) {
            return res.status(404).json({ mensaje: MENSAJE_NO_ENCONTRADA });
        }

        if (!eliminaSupervisor && !ESTADOS_ELIMINABLES_AGENTE.includes(publicacion.estado)) {
            return res.status(403).json({ mensaje: 'No se puede eliminar una publicación mientras está en revisión' });
        }

        await eliminarPublicacionYDependencias(publicacion);

        if (eliminaSupervisor) {
            await notificarAgente(
                publicacion,
                `${QUIEN_ELIMINA[req.usuario.rol]} dio de baja tu publicación "${publicacion.titulo}".`,
                'eliminada',
                false
            );
        }

        res.json({ mensaje: 'Publicación eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar la publicación', error: error.message });
    }
};

// ---------- CU-05: Revisión del Área Legal ----------

const obtenerPublicacionesPendientesRevision = async (req, res) => {
    try {
        const publicaciones = await Publicacion.find({ estado: { $in: ESTADOS_PENDIENTES } })
            .populate('id_agente', 'nombre apellido email')
            .sort({ updatedAt: -1 });

        res.json(await conDocumentos(publicaciones));
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener publicaciones pendientes', error: error.message });
    }
};

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

        res.json(await conDocumentos(publicaciones));
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el historial', error: error.message });
    }
};

const aprobarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const publicacion = idValido(id) ? await Publicacion.findById(id) : null;

        if (!publicacion) {
            return res.status(404).json({ mensaje: MENSAJE_NO_ENCONTRADA });
        }

        if (!ESTADOS_PENDIENTES.includes(publicacion.estado)) {
            return res.status(403).json({ mensaje: 'Solo se pueden aprobar publicaciones enviadas a revisión' });
        }

        publicacion.estado = 'Publicada';
        publicacion.fecha_revision = new Date();
        publicacion.usuario_revisor = req.usuario.idUsuario;
        await publicacion.save();

        await notificarAgente(
            publicacion,
            `¡Tu publicación "${publicacion.titulo}" fue aprobada y ya está visible en el catálogo!`,
            'aprobada'
        );

        res.json({ mensaje: 'Publicación aprobada y publicada correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al aprobar la publicación', error: error.message });
    }
};

const observarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const comentarios = String(req.body.comentarios || '').trim();

        if (!comentarios) {
            return res.status(400).json({ mensaje: 'Debe ingresar un comentario para registrar la observación' });
        }

        const publicacion = idValido(id) ? await Publicacion.findById(id) : null;

        if (!publicacion) {
            return res.status(404).json({ mensaje: MENSAJE_NO_ENCONTRADA });
        }

        if (!ESTADOS_PENDIENTES.includes(publicacion.estado)) {
            return res.status(403).json({ mensaje: 'Solo se pueden observar publicaciones enviadas a revisión' });
        }

        publicacion.estado = 'Observada';
        publicacion.comentarios_legal = comentarios;
        publicacion.fecha_revision = new Date();
        publicacion.usuario_revisor = req.usuario.idUsuario;
        await publicacion.save();

        await Observacion.create({
            comentario: comentarios,
            id_publicacion: publicacion._id,
            id_usuario_legal: req.usuario.idUsuario
        });

        await notificarAgente(
            publicacion,
            `Tu publicación "${publicacion.titulo}" tiene observaciones. Motivo: ${comentarios}`,
            'observada'
        );

        res.json({ mensaje: 'Observación registrada correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al registrar la observación', error: error.message });
    }
};

// Devuelve la publicación al paso anterior del flujo de revisión
const MENSAJES_REVERSION = {
    'Enviada a revision': (titulo) => `Tu publicación "${titulo}" volvió a quedar pendiente de revisión legal.`,
    Borrador: (titulo) => `El Área Legal devolvió tu publicación "${titulo}" a borrador. Podés editarla y volver a enviarla.`
};

const revertirEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const publicacion = idValido(id) ? await Publicacion.findById(id) : null;

        if (!publicacion) {
            return res.status(404).json({ mensaje: MENSAJE_NO_ENCONTRADA });
        }

        const estadoAnterior = ESTADO_ANTERIOR[publicacion.estado];
        if (!estadoAnterior) {
            return res.status(409).json({ mensaje: 'La publicación no tiene un estado anterior al que volver' });
        }

        const estadoActual = publicacion.estado;
        publicacion.estado = estadoAnterior;
        // Al volver a revisión o a borrador, la revisión previa deja de estar vigente
        publicacion.fecha_revision = undefined;
        publicacion.usuario_revisor = undefined;
        await publicacion.save();

        await notificarAgente(publicacion, MENSAJES_REVERSION[estadoAnterior](publicacion.titulo), 'devuelta');

        res.json({
            mensaje: `La publicación pasó de "${estadoActual}" a "${estadoAnterior}"`,
            estado: estadoAnterior
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al revertir el estado de la publicación', error: error.message });
    }
};

// ---------- Reasignar publicación a otro agente (Administrador) ----------
// Notifica al agente nuevo que se le asignó y al anterior que se le dio de baja.

const reasignarAgente = async (req, res) => {
    try {
        const { id } = req.params;
        const { idAgente } = req.body;

        if (!idValido(id) || !idValido(idAgente)) {
            return res.status(400).json({ mensaje: 'Seleccioná un agente válido' });
        }

        const publicacion = await Publicacion.findById(id);
        if (!publicacion) {
            return res.status(404).json({ mensaje: MENSAJE_NO_ENCONTRADA });
        }

        if (String(publicacion.id_agente) === String(idAgente)) {
            return res.status(409).json({ mensaje: 'La publicación ya está asignada a ese agente' });
        }

        const nuevoAgente = await Usuario.findOne({ _id: idAgente, rol: ROL_AGENTE, estado: 'Activo' })
            .select('nombre apellido');
        if (!nuevoAgente) {
            return res.status(400).json({ mensaje: 'El agente seleccionado no existe o está inactivo' });
        }

        const agenteAnterior = publicacion.id_agente;
        publicacion.id_agente = nuevoAgente._id;
        await publicacion.save();

        await Notificacion.insertMany([
            {
                mensaje: `Se te asignó la publicación "${publicacion.titulo}". Ya podés gestionarla desde Mis publicaciones.`,
                id_usuario_destino: nuevoAgente._id,
                id_publicacion: publicacion._id,
                tipo: 'asignada'
            },
            {
                mensaje: `Se te dio de baja la publicación "${publicacion.titulo}": fue reasignada a otro agente.`,
                id_usuario_destino: agenteAnterior,
                tipo: 'desasignada'
            }
        ]);

        res.json({
            mensaje: `Publicación reasignada a ${nuevoAgente.nombre} ${nuevoAgente.apellido}`,
            agente: { _id: nuevoAgente._id, nombre: nuevoAgente.nombre, apellido: nuevoAgente.apellido }
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al reasignar la publicación', error: error.message });
    }
};

module.exports = {
    reasignarAgente,
    crearPublicacion,
    obtenerMisPublicaciones,
    obtenerPublicacionPorId,
    editarPublicacion,
    eliminarPublicacion,
    enviarARevision,
    obtenerDocumento,
    obtenerPublicacionesPublicas,
    obtenerPublicacionPublicaPorId,
    obtenerPublicacionesPendientesRevision,
    obtenerHistorialLegal,
    aprobarPublicacion,
    observarPublicacion,
    revertirEstado,
    ROL_AGENTE,
    ROL_LEGAL,
    ROL_ADMIN
};
