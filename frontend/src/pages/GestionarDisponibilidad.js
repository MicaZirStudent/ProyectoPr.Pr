import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AgentLayout from '../components/AgentLayout';
import './GestionarDisponibilidad.css';

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const HORAS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const MENSAJE_VACIO = 'Debe seleccionar al menos un día y horario disponible para continuar';

const clave = (dia, hora) => `${dia}|${hora}`;

const horaFin = (horaInicio) => {
    const [h, m] = horaInicio.split(':').map(Number);
    return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const GestionarDisponibilidad = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [titulo, setTitulo] = useState('');
    const [seleccion, setSeleccion] = useState({});
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const auth = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    useEffect(() => {
        const cargar = async () => {
            try {
                const respuesta = await axios.get(`http://localhost:3001/api/disponibilidad/${id}`, auth());
                setTitulo(respuesta.data.publicacion.titulo);
                const actual = {};
                respuesta.data.bloques.forEach((bloque) => {
                    actual[clave(bloque.dia_semana, String(bloque.hora_inicio).slice(0, 5))] = true;
                });
                setSeleccion(actual);
            } catch (err) {
                if (err.response?.status === 401) {
                    navigate('/login');
                    return;
                }
                setError(err.response?.data?.mensaje || 'No se pudo cargar la disponibilidad');
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [id, navigate]);

    const cantidad = useMemo(() => Object.values(seleccion).filter(Boolean).length, [seleccion]);

    const toggle = (dia, hora) => {
        const k = clave(dia, hora);
        setSeleccion((prev) => ({ ...prev, [k]: !prev[k] }));
        setError('');
        setExito('');
    };

    const guardar = async () => {
        setError('');
        setExito('');
        const bloques = [];
        DIAS.forEach((dia) => {
            HORAS.forEach((hora) => {
                if (seleccion[clave(dia, hora)]) {
                    bloques.push({
                        dia_semana: dia,
                        hora_inicio: hora,
                        hora_fin: horaFin(hora)
                    });
                }
            });
        });

        if (bloques.length === 0) {
            setError(MENSAJE_VACIO);
            return;
        }

        setGuardando(true);
        try {
            const respuesta = await axios.put(`http://localhost:3001/api/disponibilidad/${id}`, { bloques }, auth());
            setExito(respuesta.data.mensaje);
        } catch (err) {
            if (err.response?.status === 401) {
                navigate('/login');
                return;
            }
            setError(err.response?.data?.mensaje || MENSAJE_VACIO);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <AgentLayout
            title="Gestionar disponibilidad"
            subtitle={titulo || 'Elegí días y horarios de visita'}
            actions={
                <button type="button" className="btn btn-outline" onClick={() => navigate('/mis-publicaciones')}>
                    Cancelar
                </button>
            }
        >
            {cargando ? (
                <p className="empty-state">Cargando configuración...</p>
            ) : (
                <>
                    {error && <p className="disp-error">{error}</p>}
                    {exito && <p className="disp-exito">{exito}</p>}
                    <p className="disp-ayuda">Seleccioná al menos un día y un horario. Los clientes van a ver estos turnos.</p>
                    <div className="disp-tabla-wrap">
                        <table className="disp-tabla">
                            <thead>
                                <tr>
                                    <th>Horario</th>
                                    {DIAS.map((dia) => <th key={dia}>{dia}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {HORAS.map((hora) => (
                                    <tr key={hora}>
                                        <td>{hora} - {horaFin(hora)}</td>
                                        {DIAS.map((dia) => (
                                            <td key={clave(dia, hora)}>
                                                <button
                                                    type="button"
                                                    className={`disp-slot ${seleccion[clave(dia, hora)] ? 'activo' : ''}`}
                                                    onClick={() => toggle(dia, hora)}
                                                >
                                                    {seleccion[clave(dia, hora)] ? 'Sí' : 'No'}
                                                </button>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="disp-acciones">
                        <span className="disp-contador">{cantidad} horario{cantidad === 1 ? '' : 's'} seleccionado{cantidad === 1 ? '' : 's'}</span>
                        <button type="button" className="btn btn-primary" onClick={guardar} disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </>
            )}
        </AgentLayout>
    );
};

export default GestionarDisponibilidad;
