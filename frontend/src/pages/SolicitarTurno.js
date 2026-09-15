import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './SolicitarTurno.css';

const MENSAJE_CAMPOS_VACIOS = 'Complete todos los campos para continuar';
const MENSAJE_EMAIL_TELEFONO = 'Email o teléfono inválidos';

const emailValido = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo).trim());
const telefonoValido = (telefono) => {
    const soloDigitos = String(telefono).replace(/[^\d]/g, '');
    return soloDigitos.length >= 8 && soloDigitos.length <= 15;
};

const formatearFechaVisible = (fechaISO) => {
    const [anio, mes, dia] = fechaISO.split('-');
    return `${dia}/${mes}/${anio}`;
};

const SolicitarTurno = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [publicacion, setPublicacion] = useState(null);
    const [horarios, setHorarios] = useState([]);
    const [fechaElegida, setFechaElegida] = useState('');
    const [horaElegida, setHoraElegida] = useState('');
    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [cargando, setCargando] = useState(true);

    const cargarHorarios = async () => {
        const respuesta = await axios.get(`http://localhost:3001/api/turnos/horarios/${id}`);
        setPublicacion(respuesta.data.publicacion);
        setHorarios(respuesta.data.horarios);
        return respuesta.data.horarios;
    };

    useEffect(() => {
        const cargar = async () => {
            try {
                await cargarHorarios();
            } catch (err) {
                setError(err.response?.data?.mensaje || 'No se pudo cargar la disponibilidad');
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [id]);

    // Armamos la lista de días distintos para el calendario
    const diasDisponibles = useMemo(() => {
        const unicos = [];
        horarios.forEach((item) => {
            if (!unicos.includes(item.fecha)) {
                unicos.push(item.fecha);
            }
        });
        return unicos;
    }, [horarios]);

    const horasDelDia = useMemo(() => {
        return horarios.filter((item) => item.fecha === fechaElegida);
    }, [horarios, fechaElegida]);

    const cancelar = () => {
        // El caso de uso pide descartar el formulario y no guardar nada
        navigate(`/propiedad/${id}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');

        if (!nombre.trim() || !correo.trim() || !whatsapp.trim() || !fechaElegida || !horaElegida) {
            setError(MENSAJE_CAMPOS_VACIOS);
            return;
        }

        if (!emailValido(correo) || !telefonoValido(whatsapp)) {
            setError(MENSAJE_EMAIL_TELEFONO);
            return;
        }

        const slot = horarios.find(
            (item) => item.fecha === fechaElegida && item.hora === horaElegida
        );

        if (!slot) {
            setError('Este horario ya no está disponible. Por favor, seleccione otro');
            return;
        }

        setEnviando(true);
        try {
            const respuesta = await axios.post('http://localhost:3001/api/turnos/solicitar', {
                nombre: nombre.trim(),
                correoElectronico: correo.trim(),
                telefono: whatsapp.trim(),
                fechaHora: slot.fechaHora,
                idPublicacion: id
            });

            setExito(respuesta.data.mensaje);
            setHoraElegida('');
            const actualizados = await cargarHorarios();
            if (fechaElegida && !actualizados.some((item) => item.fecha === fechaElegida)) {
                setFechaElegida('');
            }
        } catch (err) {
            setError(err.response?.data?.mensaje || 'No se pudo registrar el turno');
            try {
                await cargarHorarios();
            } catch (reloadError) {
                // Si falla recargar, dejamos el error original de la reserva
            }
        } finally {
            setEnviando(false);
        }
    };

    if (cargando) {
        return (
            <div className="turno-wrap">
                <p className="turno-mensaje">Cargando horarios...</p>
            </div>
        );
    }

    return (
        <div className="turno-wrap">
            <div className="turno-header">
                <div>
                    <h1 className="turno-titulo">Solicitar turno de visita</h1>
                    <p className="turno-subtitulo">
                        {publicacion ? publicacion.titulo : 'Propiedad'}
                    </p>
                </div>
                <button type="button" className="btn-volver" onClick={cancelar}>← Volver</button>
            </div>

            <form className="turno-form" onSubmit={handleSubmit}>
                {error && <p className="turno-error">{error}</p>}
                {exito && <p className="turno-exito">{exito}</p>}

                <div className="turno-card">
                    <h2 className="turno-seccion-titulo">Tus datos</h2>

                    <div className="turno-field">
                        <label>Nombre completo *</label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Ana Pérez"
                        />
                    </div>

                    <div className="turno-field">
                        <label>Correo electrónico *</label>
                        <input
                            type="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            placeholder="ana@correo.com"
                        />
                    </div>

                    <div className="turno-field">
                        <label>Número de WhatsApp *</label>
                        <input
                            type="tel"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            placeholder="Ej: 3415551234"
                        />
                    </div>
                </div>

                <div className="turno-card">
                    <h2 className="turno-seccion-titulo">Calendario de horarios disponibles</h2>

                    {diasDisponibles.length === 0 ? (
                        <p className="turno-mensaje">No hay horarios disponibles en este momento.</p>
                    ) : (
                        <>
                            <p className="turno-ayuda">1. Elegí un día</p>
                            <div className="turno-calendario">
                                {diasDisponibles.map((fecha) => (
                                    <button
                                        type="button"
                                        key={fecha}
                                        className={`turno-dia ${fechaElegida === fecha ? 'activo' : ''}`}
                                        onClick={() => {
                                            setFechaElegida(fecha);
                                            setHoraElegida('');
                                            setError('');
                                        }}
                                    >
                                        {formatearFechaVisible(fecha)}
                                    </button>
                                ))}
                            </div>

                            {fechaElegida && (
                                <>
                                    <p className="turno-ayuda">2. Elegí un horario</p>
                                    <div className="turno-horas">
                                        {horasDelDia.map((item) => (
                                            <button
                                                type="button"
                                                key={item.fechaHora}
                                                className={`turno-hora ${horaElegida === item.hora ? 'activo' : ''}`}
                                                onClick={() => {
                                                    setHoraElegida(item.hora);
                                                    setError('');
                                                }}
                                            >
                                                {item.hora}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className="turno-botones">
                    <button type="button" className="btn-cancelar" onClick={cancelar}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-guardar" disabled={enviando || !!exito}>
                        {enviando ? 'Enviando...' : 'Solicitar turno'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SolicitarTurno;
