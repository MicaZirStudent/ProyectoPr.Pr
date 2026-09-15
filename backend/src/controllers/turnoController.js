// Importamos la conexión a MySQL (el "pool" de conexiones)
const db = require('../config/db');

// Mensajes exactos del caso de uso CU-09
const MENSAJE_CAMPOS_VACIOS = 'Complete todos los campos para continuar';
const MENSAJE_EMAIL_TELEFONO = 'Email o teléfono inválidos';
const MENSAJE_HORARIO_OCUPADO = 'Este horario ya no está disponible. Por favor, seleccione otro';
const MENSAJE_FECHA_PASADA = 'No es posible reservar un turno en una fecha u horario pasado. Por favor, seleccione otra opción';
const MENSAJE_EXITO = 'Su solicitud de turno fue recibida. El agente se pondrá en contacto a la brevedad';

// Los días que usa la tabla disponibilidad (sin tilde, igual que el SQL)
// En JavaScript, domingo es 0, lunes es 1, ..., sábado es 6
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

// Cuántos días hacia adelante mostramos en el calendario
const DIAS_A_MOSTRAR = 14;

// Cada turno dura 1 hora dentro de la franja que configuró el agente
const DURACION_TURNO_MINUTOS = 60;

// --- Funciones chicas de apoyo (no son rutas, solo ayudan) ---

// Revisa que el correo tenga forma de email: texto@texto.texto
const emailValido = (correo) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo).trim());
};

// Revisa el WhatsApp: permite +, espacios y guiones, pero tiene que tener entre 8 y 15 dígitos
const telefonoValido = (telefono) => {
    const soloDigitos = String(telefono).replace(/[^\d]/g, '');
    return soloDigitos.length >= 8 && soloDigitos.length <= 15;
};

// Convierte "10:00:00" en minutos desde las 00:00 (10*60 = 600)
const horaAMinutos = (hora) => {
    const partes = String(hora).split(':');
    const horas = Number(partes[0]);
    const minutos = Number(partes[1] || 0);
    return horas * 60 + minutos;
};

// Convierte 600 minutos en "10:00:00"
const minutosAHora = (totalMinutos) => {
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00`;
};

// Arma "2026-09-16 10:00:00" a partir de una fecha y una hora
const armarFechaHora = (fecha, hora) => {
    return `${fecha} ${hora}`;
};

// Devuelve YYYY-MM-DD en hora local de la computadora (Argentina)
const formatearFecha = (date) => {
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
};

// Compara si esa fecha y hora ya pasaron
const esFechaHoraPasada = (fechaHoraTexto) => {
    const fecha = new Date(fechaHoraTexto.replace(' ', 'T'));
    return fecha.getTime() <= Date.now();
};

// Busca una publicación publicada. Si no existe o no está publicada, devolvemos null.
const obtenerPublicacionPublicada = async (conexion, idPublicacion) => {
    const [filas] = await conexion.query(
        `SELECT idPublicacion, titulo, direccion, estadoPublicacion, idUsuario
         FROM publicacion
         WHERE idPublicacion = ? AND estadoPublicacion = 'publicada'`,
        [idPublicacion]
    );
    return filas[0] || null;
};

// Genera los horarios libres de los próximos días, usando la disponibilidad del agente
const generarHorariosLibres = (disponibilidades, turnosOcupados, ahora) => {
    const ocupados = new Set(
        turnosOcupados.map((t) => {
            // MySQL puede devolver un Date o un texto. Lo unificamos a "YYYY-MM-DD HH:mm:ss"
            if (t.fechaHora instanceof Date) {
                const f = formatearFecha(t.fechaHora);
                const h = String(t.fechaHora.getHours()).padStart(2, '0');
                const m = String(t.fechaHora.getMinutes()).padStart(2, '0');
                return `${f} ${h}:${m}:00`;
            }
            return String(t.fechaHora).slice(0, 19);
        })
    );

    const horarios = [];

    for (let i = 0; i < DIAS_A_MOSTRAR; i++) {
        const dia = new Date(ahora);
        dia.setDate(ahora.getDate() + i);
        dia.setHours(0, 0, 0, 0);

        const nombreDia = DIAS_SEMANA[dia.getDay()];
        // El enum de la tabla no incluye domingo: ese día no se ofrece
        const bloquesDelDia = disponibilidades.filter((d) => d.diaSemana === nombreDia);

        const fechaTexto = formatearFecha(dia);

        for (const bloque of bloquesDelDia) {
            const inicio = horaAMinutos(bloque.horaInicio);
            const fin = horaAMinutos(bloque.horaFin);

            // Recorremos la franja de a 1 hora: 10:00-12:00 => 10:00 y 11:00
            for (let minuto = inicio; minuto + DURACION_TURNO_MINUTOS <= fin; minuto += DURACION_TURNO_MINUTOS) {
                const horaTexto = minutosAHora(minuto);
                const fechaHora = armarFechaHora(fechaTexto, horaTexto);

                if (esFechaHoraPasada(fechaHora)) {
                    continue;
                }

                if (ocupados.has(fechaHora)) {
                    continue;
                }

                horarios.push({
                    fecha: fechaTexto,
                    hora: horaTexto.slice(0, 5),
                    fechaHora,
                    idDisponibilidad: bloque.idDisponibilidad
                });
            }
        }
    }

    return horarios;
};

// Busca qué bloque de disponibilidad cubre esa fecha y hora
const encontrarBloque = (disponibilidades, fechaHoraTexto) => {
    const fecha = new Date(fechaHoraTexto.replace(' ', 'T'));
    const nombreDia = DIAS_SEMANA[fecha.getDay()];
    const minutos = fecha.getHours() * 60 + fecha.getMinutes();

    return disponibilidades.find((bloque) => {
        if (bloque.diaSemana !== nombreDia) {
            return false;
        }
        const inicio = horaAMinutos(bloque.horaInicio);
        const fin = horaAMinutos(bloque.horaFin);
        return minutos >= inicio && minutos + DURACION_TURNO_MINUTOS <= fin;
    }) || null;
};

// GET: lista los horarios libres de una propiedad publicada
// El cliente NO necesita estar logueado (es un interesado, no un usuario del sistema)
const obtenerHorariosDisponibles = async (req, res) => {
    try {
        const { idPublicacion } = req.params;

        const publicacion = await obtenerPublicacionPublicada(db, idPublicacion);
        if (!publicacion) {
            return res.status(404).json({
                mensaje: 'La propiedad no está disponible para solicitar turnos'
            });
        }

        const [disponibilidades] = await db.query(
            `SELECT idDisponibilidad, diaSemana,
                    TIME_FORMAT(horaInicio, '%H:%i:%s') AS horaInicio,
                    TIME_FORMAT(horaFin, '%H:%i:%s') AS horaFin
             FROM disponibilidad
             WHERE idPublicacion = ?`,
            [idPublicacion]
        );

        const [turnosOcupados] = await db.query(
            `SELECT DATE_FORMAT(fechaHora, '%Y-%m-%d %H:%i:%s') AS fechaHora
             FROM turno
             WHERE idPublicacion = ?
               AND estado IN ('pendiente', 'confirmado')`,
            [idPublicacion]
        );

        const horarios = generarHorariosLibres(disponibilidades, turnosOcupados, new Date());

        res.json({
            publicacion: {
                idPublicacion: publicacion.idPublicacion,
                titulo: publicacion.titulo,
                direccion: publicacion.direccion
            },
            horarios
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los horarios disponibles', error: error.message });
    }
};

// POST: registra la reserva del cliente
const crearTurno = async (req, res) => {
    // Pedimos una conexión propia para poder "bloquear" la fila mientras reservamos.
    // Así, si dos personas aprietan a la vez el mismo horario, una espera y la otra ve que ya está ocupado.
    const conexion = await db.getConnection();

    try {
        const { nombre, correoElectronico, telefono, fechaHora, idPublicacion } = req.body;

        // 1) Campos obligatorios vacíos
        if (!nombre || !correoElectronico || !telefono || !fechaHora || !idPublicacion) {
            return res.status(400).json({ mensaje: MENSAJE_CAMPOS_VACIOS });
        }

        if (!String(nombre).trim()) {
            return res.status(400).json({ mensaje: MENSAJE_CAMPOS_VACIOS });
        }

        // 2) Email o teléfono inválidos
        if (!emailValido(correoElectronico) || !telefonoValido(telefono)) {
            return res.status(400).json({ mensaje: MENSAJE_EMAIL_TELEFONO });
        }

        // Normalizamos la fecha: aceptamos "2026-09-16T10:00" o "2026-09-16 10:00:00"
        let fechaHoraNormalizada = String(fechaHora).trim().replace('T', ' ');
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(fechaHoraNormalizada)) {
            fechaHoraNormalizada = `${fechaHoraNormalizada}:00`;
        }

        // 3) No se puede reservar en el pasado
        if (esFechaHoraPasada(fechaHoraNormalizada)) {
            return res.status(400).json({ mensaje: MENSAJE_FECHA_PASADA });
        }

        await conexion.beginTransaction();

        // Bloqueamos la publicación para que dos reservas del mismo horario no pasen juntas
        const [publicaciones] = await conexion.query(
            `SELECT idPublicacion, titulo, estadoPublicacion, idUsuario
             FROM publicacion
             WHERE idPublicacion = ? AND estadoPublicacion = 'publicada'
             FOR UPDATE`,
            [idPublicacion]
        );

        if (publicaciones.length === 0) {
            await conexion.rollback();
            return res.status(404).json({
                mensaje: 'La propiedad no está disponible para solicitar turnos'
            });
        }

        const publicacion = publicaciones[0];

        const [disponibilidades] = await conexion.query(
            `SELECT idDisponibilidad, diaSemana,
                    TIME_FORMAT(horaInicio, '%H:%i:%s') AS horaInicio,
                    TIME_FORMAT(horaFin, '%H:%i:%s') AS horaFin
             FROM disponibilidad
             WHERE idPublicacion = ?`,
            [idPublicacion]
        );

        const bloque = encontrarBloque(disponibilidades, fechaHoraNormalizada);
        if (!bloque) {
            await conexion.rollback();
            return res.status(409).json({ mensaje: MENSAJE_HORARIO_OCUPADO });
        }

        // ¿Ya hay un turno pendiente o confirmado en ese mismo momento?
        const [existentes] = await conexion.query(
            `SELECT idTurno
             FROM turno
             WHERE idPublicacion = ?
               AND fechaHora = ?
               AND estado IN ('pendiente', 'confirmado')
             FOR UPDATE`,
            [idPublicacion, fechaHoraNormalizada]
        );

        if (existentes.length > 0) {
            await conexion.rollback();
            return res.status(409).json({ mensaje: MENSAJE_HORARIO_OCUPADO });
        }

        const [resultado] = await conexion.query(
            `INSERT INTO turno
             (nombre, correoElectronico, telefono, fechaHora, estado, idPublicacion, idDisponibilidad)
             VALUES (?, ?, ?, ?, 'pendiente', ?, ?)`,
            [
                String(nombre).trim(),
                String(correoElectronico).trim(),
                String(telefono).trim(),
                fechaHoraNormalizada,
                idPublicacion,
                bloque.idDisponibilidad
            ]
        );

        // Notificamos al agente (actor secundario del caso de uso)
        const nota = `Nuevo turno de ${String(nombre).trim()} el ${fechaHoraNormalizada}. Email: ${String(correoElectronico).trim()}. WhatsApp: ${String(telefono).trim()}. Propiedad: ${publicacion.titulo}.`;
        await conexion.query(
            `INSERT INTO notificacion (asunto, nota, idUsuario)
             VALUES (?, ?, ?)`,
            ['Nueva solicitud de turno', nota, publicacion.idUsuario]
        );

        await conexion.commit();

        res.status(201).json({
            mensaje: MENSAJE_EXITO,
            idTurno: resultado.insertId
        });
    } catch (error) {
        await conexion.rollback();

        // Si más adelante agregamos un índice único, este error cubre el empate de dos clics
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: MENSAJE_HORARIO_OCUPADO });
        }

        res.status(500).json({ mensaje: 'Error al registrar el turno', error: error.message });
    } finally {
        conexion.release();
    }
};

module.exports = { obtenerHorariosDisponibles, crearTurno };
