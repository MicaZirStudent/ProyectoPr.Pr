import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const emailValido = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo).trim());
const telefonoValido = (telefono) => {
    const soloDigitos = String(telefono).replace(/[^\d]/g, '');
    return soloDigitos.length >= 8 && soloDigitos.length <= 15;
};

const formatearFechaVisible = (fechaISO) => {
    const [anio, mes, dia] = fechaISO.split('-');
    return `${dia}/${mes}/${anio}`;
};

const ModalContacto = ({ publicacion, onClose }) => {
    const [horarios, setHorarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [fechaElegida, setFechaElegida] = useState('');
    const [horaElegida, setHoraElegida] = useState('');
    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        const cargar = async () => {
            try {
                const respuesta = await axios.get(`http://localhost:3001/api/turnos/horarios/${publicacion._id}`);
                setHorarios(respuesta.data.horarios || []);
            } catch (err) {
                setError(err.response?.data?.mensaje || 'No se pudo cargar la disponibilidad');
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [publicacion._id]);

    const diasDisponibles = useMemo(() => {
        const unicos = [];
        horarios.forEach((item) => {
            if (!unicos.includes(item.fecha)) unicos.push(item.fecha);
        });
        return unicos;
    }, [horarios]);

    const horasDelDia = useMemo(
        () => horarios.filter((item) => item.fecha === fechaElegida),
        [horarios, fechaElegida]
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!nombre.trim() || !correo.trim() || !whatsapp.trim() || !fechaElegida || !horaElegida) {
            setError('Complete todos los campos para continuar');
            return;
        }
        if (!emailValido(correo) || !telefonoValido(whatsapp)) {
            setError('Email o teléfono inválidos');
            return;
        }

        const slot = horarios.find((item) => item.fecha === fechaElegida && item.hora === horaElegida);
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
                idPublicacion: publicacion._id
            });
            setExito(respuesta.data.mensaje);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'No se pudo registrar el turno');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-contacto" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="modal-cerrar" onClick={onClose} aria-label="Cerrar">×</button>
                <h2 className="modal-titulo">Contactar por: {publicacion.titulo}</h2>
                <p className="modal-subtitulo">Dejá tus datos y elegí un horario para visitar la propiedad</p>

                {cargando ? (
                    <p className="catalogo-vacio">Cargando disponibilidad...</p>
                ) : exito ? (
                    <p className="alert alert-ok">{exito}</p>
                ) : (
                    <form onSubmit={handleSubmit} className="modal-form">
                        {error && <p className="alert alert-error">{error}</p>}

                        <div className="field">
                            <label>Nombre completo *</label>
                            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Ana Pérez" />
                        </div>
                        <div className="field">
                            <label>Correo electrónico *</label>
                            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="ana@correo.com" />
                        </div>
                        <div className="field">
                            <label>WhatsApp *</label>
                            <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ej: 3415551234" />
                        </div>

                        {diasDisponibles.length === 0 ? (
                            <p className="catalogo-vacio">El agente todavía no cargó horarios disponibles.</p>
                        ) : (
                            <>
                                <p className="modal-ayuda">Elegí un día</p>
                                <div className="modal-opciones">
                                    {diasDisponibles.map((fecha) => (
                                        <button
                                            type="button"
                                            key={fecha}
                                            className={`modal-chip ${fechaElegida === fecha ? 'activo' : ''}`}
                                            onClick={() => { setFechaElegida(fecha); setHoraElegida(''); }}
                                        >
                                            {formatearFechaVisible(fecha)}
                                        </button>
                                    ))}
                                </div>

                                {fechaElegida && (
                                    <>
                                        <p className="modal-ayuda">Elegí un horario</p>
                                        <div className="modal-opciones">
                                            {horasDelDia.map((item) => (
                                                <button
                                                    type="button"
                                                    key={item.fechaHora}
                                                    className={`modal-chip ${horaElegida === item.hora ? 'activo' : ''}`}
                                                    onClick={() => setHoraElegida(item.hora)}
                                                >
                                                    {item.hora}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        <div className="modal-acciones">
                            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={enviando || diasDisponibles.length === 0}>
                                {enviando ? 'Enviando...' : 'Solicitar turno'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ModalContacto;
