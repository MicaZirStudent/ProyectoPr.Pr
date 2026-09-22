// Reutilizamos los modelos Mongoose que ya existen en backend/models/
const mongoose = require('mongoose');
const Turno = require('../../models/turno');
const Disponibilidad = require('../../models/disponibilidad');
const Publicacion = require('../../models/publicacion');
const Notificacion = require('../../models/notificacion');

// Mensajes exactos del caso de uso CU-09
const MENSAJE_CAMPOS_VACIOS = 'Complete todos los campos para continuar';
const MENSAJE_EMAIL_TELEFONO = 'Email o teléfono inválidos';
const MENSAJE_HORARIO_OCUPADO = 'Este horario ya no está disponible. Por favor, seleccione otro';
const MENSAJE_FECHA_PASADA = 'No es posible reservar un turno en una fecha u horario pasado. Por favor, seleccione otra opción';
const MENSAJE_EXITO = 'Su solicitud de turno fue recibida. El agente se pondrá en contacto a la brevedad';

// En JavaScript, domingo es 0. El modelo Disponibilidad no incluye domingo.
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const DIAS_A_MOSTRAR = 14;
const DURACION_TURNO_MINUTOS = 60;
const ESTADOS_OCUPADOS = ['Pendiente', 'Confirmado'];

const emailValido = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo).trim());

const telefonoValido = (telefono) => {
    const soloDigitos = String(telefono).replace(/[^\d]/g, '');
    return soloDigitos.length >= 8 && soloDigitos.length <= 15;
};

const horaAMinutos = (hora) => {
    const partes = String(hora).split(':');
    return Number(partes[0]) * 60 + Number(partes[1] || 0);
};

const minutosAHora = (totalMinutos) => {
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
};

const formatearFecha = (date) => {
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
};

const fechaDesdeTexto = (fechaTexto) => new Date(`${fechaTexto}T00:00:00`);

const esFechaHoraPasada = (fechaTexto, horaTexto) => {
    const fecha = new Date(`${fechaTexto}T${horaTexto.length === 5 ? `${horaTexto}:00` : horaTexto}`);
    return fecha.getTime() <= Date.now();
};

const idEsValido = (id) => mongoose.Types.ObjectId.isValid(id);

const claveTurno = (fecha, hora) => `${formatearFecha(new Date(fecha))}|${String(hora).slice(0, 5)}`;

const generarHorariosLibres = (disponibilidades, turnosOcupados, ahora) => {
    const ocupados = new Set(turnosOcupados.map((t) => claveTurno(t.fecha, t.hora)));
    const horarios = [];

    for (let i = 0; i < DIAS_A_MOSTRAR; i++) {
        const dia = new Date(ahora);
        dia.setDate(ahora.getDate() + i);
        dia.setHours(0, 0, 0, 0);

        const nombreDia = DIAS_SEMANA[dia.getDay()];
        const bloquesDelDia = disponibilidades.filter((d) => d.dia_semana === nombreDia);
        const fechaTexto = formatearFecha(dia);

        for (const bloque of bloquesDelDia) {
            const inicio = horaAMinutos(bloque.hora_inicio);
            const fin = horaAMinutos(bloque.hora_fin);

            for (let minuto = inicio; minuto + DURACION_TURNO_MINUTOS <= fin; minuto += DURACION_TURNO_MINUTOS) {
                const horaTexto = minutosAHora(minuto);
                if (esFechaHoraPasada(fechaTexto, horaTexto)) {
                    continue;
                }
                if (ocupados.has(`${fechaTexto}|${horaTexto}`)) {
                    continue;
                }
                horarios.push({
                    fecha: fechaTexto,
                    hora: horaTexto,
                    fechaHora: `${fechaTexto} ${horaTexto}:00`,
                    idDisponibilidad: bloque._id
                });
            }
        }
    }

    return horarios;
};

const encontrarBloque = (disponibilidades, fechaTexto, horaTexto) => {
    const fecha = new Date(`${fechaTexto}T${horaTexto}:00`);
    const nombreDia = DIAS_SEMANA[fecha.getDay()];
    const minutos = horaAMinutos(horaTexto);

    return disponibilidades.find((bloque) => {
        if (bloque.dia_semana !== nombreDia) {
            return false;
        }
        const inicio = horaAMinutos(bloque.hora_inicio);
        const fin = horaAMinutos(bloque.hora_fin);
        return minutos >= inicio && minutos + DURACION_TURNO_MINUTOS <= fin;
    }) || null;
};

const partirFechaHora = (fechaHora) => {
    let texto = String(fechaHora).trim().replace('T', ' ');
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(texto)) {
        texto = `${texto}:00`;
    }
    const [fechaTexto, horaCompleta] = texto.split(' ');
    const horaTexto = horaCompleta ? horaCompleta.slice(0, 5) : '';
    return { fechaTexto, horaTexto };
};

const obtenerHorariosDisponibles = async (req, res) => {
    try {
        const { idPublicacion } = req.params;

        if (!idEsValido(idPublicacion)) {
            return res.status(404).json({ mensaje: 'La propiedad no está disponible para solicitar turnos' });
        }

        const publicacion = await Publicacion.findOne({
            _id: idPublicacion,
            estado: 'Publicada'
        });

        if (!publicacion) {
            return res.status(404).json({
                mensaje: 'La propiedad no está disponible para solicitar turnos'
            });
        }

        const disponibilidades = await Disponibilidad.find({ id_publicacion: idPublicacion });
        const turnosOcupados = await Turno.find({
            id_publicacion: idPublicacion,
            estado: { $in: ESTADOS_OCUPADOS }
        });

        const horarios = generarHorariosLibres(disponibilidades, turnosOcupados, new Date());

        res.json({
            publicacion: {
                idPublicacion: publicacion._id,
                titulo: publicacion.titulo,
                direccion: publicacion.direccion
            },
            horarios
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los horarios disponibles', error: error.message });
    }
};

const crearTurno = async (req, res) => {
    try {
        const { nombre, correoElectronico, telefono, fechaHora, idPublicacion } = req.body;

        if (!nombre || !correoElectronico || !telefono || !fechaHora || !idPublicacion) {
            return res.status(400).json({ mensaje: MENSAJE_CAMPOS_VACIOS });
        }

        if (!String(nombre).trim()) {
            return res.status(400).json({ mensaje: MENSAJE_CAMPOS_VACIOS });
        }

        if (!emailValido(correoElectronico) || !telefonoValido(telefono)) {
            return res.status(400).json({ mensaje: MENSAJE_EMAIL_TELEFONO });
        }

        if (!idEsValido(idPublicacion)) {
            return res.status(404).json({ mensaje: 'La propiedad no está disponible para solicitar turnos' });
        }

        const { fechaTexto, horaTexto } = partirFechaHora(fechaHora);
        if (!fechaTexto || !horaTexto) {
            return res.status(400).json({ mensaje: MENSAJE_CAMPOS_VACIOS });
        }

        if (esFechaHoraPasada(fechaTexto, horaTexto)) {
            return res.status(400).json({ mensaje: MENSAJE_FECHA_PASADA });
        }

        const publicacion = await Publicacion.findOne({
            _id: idPublicacion,
            estado: 'Publicada'
        });

        if (!publicacion) {
            return res.status(404).json({
                mensaje: 'La propiedad no está disponible para solicitar turnos'
            });
        }

        const disponibilidades = await Disponibilidad.find({ id_publicacion: idPublicacion });
        const bloque = encontrarBloque(disponibilidades, fechaTexto, horaTexto);
        if (!bloque) {
            return res.status(409).json({ mensaje: MENSAJE_HORARIO_OCUPADO });
        }

        const existente = await Turno.findOne({
            id_publicacion: idPublicacion,
            fecha: fechaDesdeTexto(fechaTexto),
            hora: horaTexto,
            estado: { $in: ESTADOS_OCUPADOS }
        });

        if (existente) {
            return res.status(409).json({ mensaje: MENSAJE_HORARIO_OCUPADO });
        }

        const nuevoTurno = new Turno({
            nombre_cliente: String(nombre).trim(),
            email_cliente: String(correoElectronico).trim(),
            whatsapp_cliente: String(telefono).trim(),
            fecha: fechaDesdeTexto(fechaTexto),
            hora: horaTexto,
            estado: 'Pendiente',
            id_publicacion: idPublicacion,
            id_disponibilidad: bloque._id
        });

        await nuevoTurno.save();

        await Notificacion.create({
            mensaje: `Nuevo turno de ${String(nombre).trim()} el ${fechaTexto} a las ${horaTexto}. Email: ${String(correoElectronico).trim()}. WhatsApp: ${String(telefono).trim()}. Propiedad: ${publicacion.titulo}.`,
            id_usuario_destino: publicacion.id_agente,
            id_publicacion: publicacion._id,
            tipo: 'turno'
        });

        res.status(201).json({
            mensaje: MENSAJE_EXITO,
            idTurno: nuevoTurno._id
        });
    } catch (error) {
        // 11000 = índice único: otra persona reservó el mismo horario al mismo tiempo
        if (error.code === 11000) {
            return res.status(409).json({ mensaje: MENSAJE_HORARIO_OCUPADO });
        }
        res.status(500).json({ mensaje: 'Error al registrar el turno', error: error.message });
    }
};

const publicacionesDelUsuario = async (req) => {
    const filtro = req.usuario.rol === 'Administrador'
        ? {}
        : { id_agente: req.usuario.idUsuario };
    return Publicacion.find(filtro).select('_id titulo direccion');
};

const serializarTurno = (turno) => {
    const publicacion = turno.id_publicacion && turno.id_publicacion.titulo
        ? turno.id_publicacion
        : null;
    return {
        _id: turno._id,
        nombre_cliente: turno.nombre_cliente,
        email_cliente: turno.email_cliente,
        whatsapp_cliente: turno.whatsapp_cliente,
        fecha: formatearFecha(new Date(turno.fecha)),
        hora: String(turno.hora).slice(0, 5),
        estado: turno.estado,
        id_publicacion: publicacion ? publicacion._id : turno.id_publicacion,
        publicacion: publicacion
            ? { titulo: publicacion.titulo, direccion: publicacion.direccion }
            : null
    };
};

const listarMisTurnos = async (req, res) => {
    try {
        const publicaciones = await publicacionesDelUsuario(req);
        const ids = publicaciones.map((p) => p._id);
        const turnos = await Turno.find({ id_publicacion: { $in: ids } })
            .populate('id_publicacion', 'titulo direccion')
            .sort({ fecha: 1, hora: 1 });

        res.json(turnos.map(serializarTurno));
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al listar los turnos', error: error.message });
    }
};

const actualizarTurno = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, fechaHora, nombre, correoElectronico, telefono } = req.body;

        if (!idEsValido(id)) {
            return res.status(404).json({ mensaje: 'Turno no encontrado' });
        }

        const turno = await Turno.findById(id);
        if (!turno) {
            return res.status(404).json({ mensaje: 'Turno no encontrado' });
        }

        const publicacion = await Publicacion.findById(turno.id_publicacion);
        if (!publicacion) {
            return res.status(404).json({ mensaje: 'Turno no encontrado' });
        }

        const esDuenio = String(publicacion.id_agente) === String(req.usuario.idUsuario);
        if (!esDuenio && req.usuario.rol !== 'Administrador') {
            return res.status(403).json({ mensaje: 'No tenés permisos para realizar esta acción' });
        }

        if (estado) {
            if (!['Pendiente', 'Confirmado', 'Cancelado'].includes(estado)) {
                return res.status(400).json({ mensaje: 'El estado indicado no es válido' });
            }
            turno.estado = estado;
        }

        if (nombre && String(nombre).trim()) {
            turno.nombre_cliente = String(nombre).trim();
        }
        if (correoElectronico) {
            if (!emailValido(correoElectronico)) {
                return res.status(400).json({ mensaje: MENSAJE_EMAIL_TELEFONO });
            }
            turno.email_cliente = String(correoElectronico).trim();
        }
        if (telefono) {
            if (!telefonoValido(telefono)) {
                return res.status(400).json({ mensaje: MENSAJE_EMAIL_TELEFONO });
            }
            turno.whatsapp_cliente = String(telefono).trim();
        }

        if (fechaHora) {
            const { fechaTexto, horaTexto } = partirFechaHora(fechaHora);
            if (!fechaTexto || !horaTexto) {
                return res.status(400).json({ mensaje: MENSAJE_CAMPOS_VACIOS });
            }

            const fechaActual = formatearFecha(new Date(turno.fecha));
            const horaActual = String(turno.hora).slice(0, 5);
            const mismoHorario = fechaActual === fechaTexto && horaActual === horaTexto;

            if (!mismoHorario) {
                if (esFechaHoraPasada(fechaTexto, horaTexto)) {
                    return res.status(400).json({ mensaje: MENSAJE_FECHA_PASADA });
                }

                const disponibilidades = await Disponibilidad.find({ id_publicacion: turno.id_publicacion });
                const bloque = encontrarBloque(disponibilidades, fechaTexto, horaTexto);
                if (!bloque) {
                    return res.status(409).json({ mensaje: MENSAJE_HORARIO_OCUPADO });
                }

                const conflicto = await Turno.findOne({
                    _id: { $ne: turno._id },
                    id_publicacion: turno.id_publicacion,
                    fecha: fechaDesdeTexto(fechaTexto),
                    hora: horaTexto,
                    estado: { $in: ESTADOS_OCUPADOS }
                });
                if (conflicto) {
                    return res.status(409).json({ mensaje: MENSAJE_HORARIO_OCUPADO });
                }

                turno.fecha = fechaDesdeTexto(fechaTexto);
                turno.hora = horaTexto;
                turno.id_disponibilidad = bloque._id;
            }
        }

        await turno.save();
        const actualizado = await Turno.findById(turno._id).populate('id_publicacion', 'titulo direccion');

        res.json({
            mensaje: 'Turno actualizado correctamente',
            turno: serializarTurno(actualizado)
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ mensaje: MENSAJE_HORARIO_OCUPADO });
        }
        res.status(500).json({ mensaje: 'Error al actualizar el turno', error: error.message });
    }
};

module.exports = { obtenerHorariosDisponibles, crearTurno, listarMisTurnos, actualizarTurno };
