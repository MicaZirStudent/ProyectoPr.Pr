import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AgentLayout from '../components/AgentLayout';
import './GestionUsuarios.css';

const ROLES = ['Agente', 'Area legal', 'Administrador'];
const VACIO = {
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: 'Agente',
    estado: 'Activo'
};

const GestionUsuarios = () => {
    const navigate = useNavigate();
    const sesion = JSON.parse(localStorage.getItem('usuario') || 'null');
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState(VACIO);
    const [editandoId, setEditandoId] = useState(null);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [aEliminar, setAEliminar] = useState(null);

    const auth = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const cargar = async () => {
        try {
            const respuesta = await axios.get('http://localhost:3001/api/usuarios', auth());
            setUsuarios(respuesta.data);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/login');
                return;
            }
            setError(err.response?.data?.mensaje || 'No se pudieron cargar los usuarios');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (sesion?.rol !== 'Administrador') {
            navigate('/dashboard');
            return;
        }
        cargar();
    }, []);

    const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
        setExito('');
    };

    const cancelarForm = () => {
        setForm(VACIO);
        setEditandoId(null);
        setError('');
        setExito('');
    };

    const guardar = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');

        if (!form.nombre.trim() || !form.apellido.trim() || !form.email.trim() || !form.rol) {
            setError('Complete todos los campos obligatorios');
            return;
        }

        if (!editandoId && !form.password.trim()) {
            setError('Complete todos los campos obligatorios');
            return;
        }

        setGuardando(true);
        try {
            if (editandoId) {
                const payload = {
                    nombre: form.nombre,
                    apellido: form.apellido,
                    email: form.email,
                    rol: form.rol,
                    estado: form.estado
                };
                if (form.password.trim()) {
                    payload.password = form.password;
                }
                const respuesta = await axios.put(`http://localhost:3001/api/usuarios/${editandoId}`, payload, auth());
                setExito(respuesta.data.mensaje);
            } else {
                const respuesta = await axios.post('http://localhost:3001/api/usuarios', {
                    nombre: form.nombre,
                    apellido: form.apellido,
                    email: form.email,
                    password: form.password,
                    rol: form.rol
                }, auth());
                setExito(respuesta.data.mensaje);
            }
            setForm(VACIO);
            setEditandoId(null);
            await cargar();
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/login');
                return;
            }
            setError(err.response?.data?.mensaje || 'Complete todos los campos obligatorios');
        } finally {
            setGuardando(false);
        }
    };

    const empezarEdicion = (usuario) => {
        setEditandoId(usuario._id);
        setForm({
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            password: '',
            rol: usuario.rol,
            estado: usuario.estado || 'Activo'
        });
        setError('');
        setExito('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmarEliminar = async () => {
        if (!aEliminar) {
            return;
        }
        setError('');
        setExito('');
        try {
            const respuesta = await axios.delete(`http://localhost:3001/api/usuarios/${aEliminar._id}`, auth());
            setExito(respuesta.data.mensaje);
            setAEliminar(null);
            if (editandoId === aEliminar._id) {
                cancelarForm();
            }
            await cargar();
        } catch (err) {
            setAEliminar(null);
            setError(err.response?.data?.mensaje || 'No se pudo eliminar el usuario');
        }
    };

    return (
        <AgentLayout
            title="Gestión de usuarios"
            subtitle="Alta, modificación y baja de cuentas internas"
        >
            {error && <p className="usr-error">{error}</p>}
            {exito && <p className="usr-exito">{exito}</p>}

            <form className="usr-card" onSubmit={guardar}>
                <h2 className="usr-seccion">{editandoId ? 'Modificar usuario' : 'Alta de usuario'}</h2>
                <div className="usr-grid">
                    <div className="field">
                        <label>Nombre *</label>
                        <input name="nombre" value={form.nombre} onChange={onChange} />
                    </div>
                    <div className="field">
                        <label>Apellido *</label>
                        <input name="apellido" value={form.apellido} onChange={onChange} />
                    </div>
                    <div className="field">
                        <label>Correo electrónico *</label>
                        <input name="email" type="email" autoComplete="off" value={form.email} onChange={onChange} />
                    </div>
                    <div className="field">
                        <label>{editandoId ? 'Nueva contraseña (opcional)' : 'Contraseña inicial *'}</label>
                        <input name="password" type="password" autoComplete="new-password" value={form.password} onChange={onChange} />
                    </div>
                    <div className="field">
                        <label>Rol *</label>
                        <select name="rol" value={form.rol} onChange={onChange}>
                            {ROLES.map((rol) => (
                                <option key={rol} value={rol}>{rol}</option>
                            ))}
                        </select>
                    </div>
                    {editandoId && (
                        <div className="field">
                            <label>Estado *</label>
                            <select name="estado" value={form.estado} onChange={onChange}>
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </div>
                    )}
                </div>
                <div className="usr-botones">
                    <button type="button" className="btn btn-outline" onClick={cancelarForm}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </form>

            <div className="usr-card">
                <h2 className="usr-seccion">Usuarios</h2>
                {cargando ? (
                    <p className="empty-state">Cargando usuarios...</p>
                ) : (
                    <div className="usr-tabla-wrap">
                        <table className="usr-tabla">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Apellido</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map((usuario) => (
                                    <tr key={usuario._id}>
                                        <td>{usuario.nombre}</td>
                                        <td>{usuario.apellido}</td>
                                        <td>{usuario.rol}</td>
                                        <td>{usuario.estado}</td>
                                        <td className="usr-acciones">
                                            <button type="button" className="btn btn-soft" onClick={() => empezarEdicion(usuario)}>
                                                Modificar
                                            </button>
                                            <button type="button" className="btn btn-outline" onClick={() => setAEliminar(usuario)}>
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {aEliminar && (
                <div className="usr-modal-fondo">
                    <div className="usr-modal">
                        <p>¿Está seguro que desea eliminar este usuario?</p>
                        <p className="usr-modal-nombre">{aEliminar.nombre} {aEliminar.apellido}</p>
                        <div className="usr-botones">
                            <button type="button" className="btn btn-outline" onClick={() => setAEliminar(null)}>Cancelar</button>
                            <button type="button" className="btn btn-primary" onClick={confirmarEliminar}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </AgentLayout>
    );
};

export default GestionUsuarios;
