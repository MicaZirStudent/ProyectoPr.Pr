import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AgentLayout from '../components/AgentLayout';
import './MisTurnos.css';

const VACIO = {
    nombre: '',
    correoElectronico: '',
    telefono: '',
    fecha: '',
    hora: '',
    estado: 'Pendiente'
};

const MisTurnos = () => {
    const navigate = useNavigate();
    const [turnos, setTurnos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(VACIO);
    const [horarios, setHorarios] = useState([]);
    const [guardando, setGuardando] = useState(false);

    const auth = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const cargar = async () => {
        try {
            const respuesta = await axios.get('http://localhost:3001/api/turnos/mios', auth());
            setTurnos(respuesta.data);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/login');
                return;
            }
            setError(err.response?.data?.mensaje || 'No se pudieron cargar los turnos');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        const sesion = JSON.parse(localStorage.getItem('usuario') || 'null');
        if (!sesion) {
            navigate('/login');
            return;
        }
        cargar();
    }, []);

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value, ...(name === 'fecha' ? { hora: '' } : {}) }));
        setError('');
        setExito('');
    };

    const abrirEdicion = async (turno) => {
        setError('');
        setExito('');
        setEditando(turno);
        setForm({
            nombre: turno.nombre_cliente,
            correoElectronico: turno.email_cliente,
            telefono: turno.whatsapp_cliente,
            fecha: turno.fecha,
            hora: turno.hora,
            estado: turno.estado
        });
        try {
            const respuesta = await axios.get(`http://localhost:3001/api/turnos/horarios/${turno.id_publicacion}`);
            const lista = respuesta.data.horarios || [];
            const yaEsta = lista.some((h) => h.fecha === turno.fecha && h.hora === turno.hora);
            setHorarios(yaEsta ? lista : [{ fecha: turno.fecha, hora: turno.hora }, ...lista]);
        } catch {
            setHorarios([{ fecha: turno.fecha, hora: turno.hora }]);
        }
    };

    const cancelarEdicion = () => {
        setEditando(null);
        setForm(VACIO);
        setHorarios([]);
    };

    const guardar = async (e) => {
        e.preventDefault();
        if (!editando) {
            return;
        }
        setGuardando(true);
        setError('');
        setExito('');
        try {
            const respuesta = await axios.put(`http://localhost:3001/api/turnos/${editando._id}`, {
                nombre: form.nombre,
                correoElectronico: form.correoElectronico,
                telefono: form.telefono,
                estado: form.estado,
                fechaHora: `${form.fecha} ${form.hora}`
            }, auth());
            setExito(respuesta.data.mensaje);
            setEditando(null);
            setForm(VACIO);
            await cargar();
        } catch (err) {
            setError(err.response?.data?.mensaje || 'No se pudo actualizar el turno');
        } finally {
            setGuardando(false);
        }
    };

    const fechas = [...new Set(horarios.map((h) => h.fecha))];
    const horasDelDia = horarios.filter((h) => h.fecha === form.fecha);

    return (
        <AgentLayout
            title="Mis turnos"
            subtitle="Confirmá, cancelá o cambiá el horario de las visitas"
        >
            {error && <p className="trn-error">{error}</p>}
            {exito && <p className="trn-exito">{exito}</p>}

            <div className="trn-card">
                {cargando ? (
                    <p className="empty-state">Cargando turnos...</p>
                ) : turnos.length === 0 ? (
                    <p className="empty-state">Todavía no hay solicitudes de visita para tus propiedades.</p>
                ) : (
                    <div className="trn-tabla-wrap">
                        <table className="trn-tabla">
                            <thead>
                                <tr>
                                    <th>Propiedad</th>
                                    <th>Cliente</th>
                                    <th>Contacto</th>
                                    <th>Fecha</th>
                                    <th>Hora</th>
                                    <th>Estado</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {turnos.map((turno) => (
                                    <tr key={turno._id}>
                                        <td>
                                            <strong>{turno.publicacion?.titulo || 'Propiedad'}</strong>
                                            <div className="trn-dir">{turno.publicacion?.direccion}</div>
                                        </td>
                                        <td>{turno.nombre_cliente}</td>
                                        <td>
                                            <div>{turno.email_cliente}</div>
                                            <div>{turno.whatsapp_cliente}</div>
                                        </td>
                                        <td>{turno.fecha}</td>
                                        <td>{turno.hora}</td>
                                        <td>
                                            <span className={`trn-estado trn-${turno.estado.toLowerCase()}`}>
                                                {turno.estado}
                                            </span>
                                        </td>
                                        <td>
                                            <button type="button" className="btn btn-soft" onClick={() => abrirEdicion(turno)}>
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {editando && (
                <div className="trn-modal-fondo">
                    <form className="trn-modal" onSubmit={guardar}>
                        <h2>Editar turno</h2>
                        <p className="trn-dir">{editando.publicacion?.titulo}</p>
                        <div className="trn-grid">
                            <div className="field">
                                <label>Nombre</label>
                                <input name="nombre" value={form.nombre} onChange={onChange} required />
                            </div>
                            <div className="field">
                                <label>Email</label>
                                <input name="correoElectronico" type="email" value={form.correoElectronico} onChange={onChange} required />
                            </div>
                            <div className="field">
                                <label>WhatsApp</label>
                                <input name="telefono" value={form.telefono} onChange={onChange} required />
                            </div>
                            <div className="field">
                                <label>Estado</label>
                                <select name="estado" value={form.estado} onChange={onChange}>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Confirmado">Confirmado</option>
                                    <option value="Cancelado">Cancelado</option>
                                </select>
                            </div>
                            <div className="field">
                                <label>Fecha</label>
                                <select name="fecha" value={form.fecha} onChange={onChange} required>
                                    {fechas.map((fecha) => (
                                        <option key={fecha} value={fecha}>{fecha}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label>Hora</label>
                                <select name="hora" value={form.hora} onChange={onChange} required>
                                    {horasDelDia.map((item) => (
                                        <option key={item.hora} value={item.hora}>{item.hora}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="trn-botones">
                            <button type="button" className="btn btn-outline" onClick={cancelarEdicion}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={guardando}>
                                {guardando ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AgentLayout>
    );
};

export default MisTurnos;
