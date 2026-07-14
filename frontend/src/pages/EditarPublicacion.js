// Importamos hooks de React
import { useState, useEffect } from 'react';

// Importamos axios para hablarle al backend
import axios from 'axios';

// Importamos useNavigate y useParams
// useParams nos permite leer el id de la URL, por ejemplo /editar-publicacion/1
import { useNavigate, useParams } from 'react-router-dom';

// Importamos los estilos (reutilizamos el CSS de CrearPublicacion)
import './CrearPublicacion.css';

const EditarPublicacion = () => {

    // Leemos el id de la publicación desde la URL
    const { id } = useParams();

    // Estado del formulario, arranca vacío y se llena cuando cargamos los datos
    const [form, setForm] = useState({
        titulo: '',
        descripcion: '',
        tipoOperacion: 'venta',
        precio: '',
        direccion: '',
        superficie: '',
        ambientes: ''
    });

    // Estados para mensajes y loading
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [cargando, setCargando] = useState(true);

    const navigate = useNavigate();

    // Cuando el componente carga, traemos los datos actuales de la publicación
    useEffect(() => {
        obtenerPublicacion();
    }, []);

    const obtenerPublicacion = async () => {
        try {
            const token = localStorage.getItem('token');

            const respuesta = await axios.get(`http://localhost:3001/api/publicaciones/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const pub = respuesta.data;

            // Pre-cargamos el formulario con los datos que ya tiene la publicación
            setForm({
                titulo: pub.titulo,
                descripcion: pub.descripcion || '',
                tipoOperacion: pub.tipoOperacion,
                precio: pub.precioPublicacion,
                direccion: pub.direccion,
                superficie: pub.superficieM2 || '',
                ambientes: pub.ambientes || ''
            });

            setCargando(false);

        } catch (error) {
            if (error.response?.status === 401) navigate('/');
            if (error.response?.status === 404) navigate('/mis-publicaciones');
            setCargando(false);
        }
    };

    // Función genérica para actualizar cualquier campo del formulario
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Función que se ejecuta al presionar "Guardar"
    const handleGuardar = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');
        setGuardando(true);

        try {
            const token = localStorage.getItem('token');

            await axios.put(`http://localhost:3001/api/publicaciones/${id}`, form, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setExito('Publicación actualizada correctamente');

            // Redirigimos a mis publicaciones después de 1.5 segundos
            setTimeout(() => {
                navigate('/mis-publicaciones');
            }, 1500);

        } catch (error) {
            if (error.response?.status === 401) navigate('/');
            if (error.response?.status === 403) {
                setError('No se puede editar una publicación en este estado');
            } else {
                setError('Complete todos los campos obligatorios');
            }
        } finally {
            setGuardando(false);
        }
    };

    // Mientras carga los datos mostramos un mensaje
    if (cargando) {
        return <div className="crear-wrap"><p style={{ color: '#9CA3AF' }}>Cargando...</p></div>;
    }

    return (
        <div className="crear-wrap">
            <div className="crear-header">
                <div>
                    <h1 className="crear-titulo">Editar Publicación</h1>
                    <p className="crear-subtitulo">Modificá los datos de la propiedad</p>
                </div>
                <button className="btn-volver" onClick={() => navigate('/mis-publicaciones')}>← Volver</button>
            </div>

            <form onSubmit={handleGuardar} className="crear-form">

                {error && <p className="crear-error">{error}</p>}
                {exito && <p className="crear-exito">{exito}</p>}

                <div className="crear-seccion">
                    <h2 className="crear-seccion-titulo">Datos de la propiedad</h2>

                    <div className="crear-field">
                        <label>Título *</label>
                        <input
                            type="text"
                            name="titulo"
                            value={form.titulo}
                            onChange={handleChange}
                            placeholder="Ej: Casa con jardín en Fisherton"
                            required
                        />
                    </div>

                    <div className="crear-field">
                        <label>Descripción</label>
                        <textarea
                            name="descripcion"
                            value={form.descripcion}
                            onChange={handleChange}
                            placeholder="Describí la propiedad..."
                            rows={4}
                        />
                    </div>

                    <div className="crear-fila">
                        <div className="crear-field">
                            <label>Tipo de operación *</label>
                            <select name="tipoOperacion" value={form.tipoOperacion} onChange={handleChange}>
                                <option value="venta">Venta</option>
                                <option value="alquiler">Alquiler</option>
                            </select>
                        </div>
                        <div className="crear-field">
                            <label>Precio *</label>
                            <input
                                type="number"
                                name="precio"
                                value={form.precio}
                                onChange={handleChange}
                                placeholder="Ej: 150000"
                                required
                            />
                        </div>
                    </div>

                    <div className="crear-field">
                        <label>Dirección *</label>
                        <input
                            type="text"
                            name="direccion"
                            value={form.direccion}
                            onChange={handleChange}
                            placeholder="Ej: Av. Vélez Sársfield 1234, Rosario"
                            required
                        />
                    </div>

                    <div className="crear-fila">
                        <div className="crear-field">
                            <label>Superficie (m²)</label>
                            <input
                                type="number"
                                name="superficie"
                                value={form.superficie}
                                onChange={handleChange}
                                placeholder="Ej: 200"
                            />
                        </div>
                        <div className="crear-field">
                            <label>Ambientes</label>
                            <input
                                type="number"
                                name="ambientes"
                                value={form.ambientes}
                                onChange={handleChange}
                                placeholder="Ej: 4"
                            />
                        </div>
                    </div>
                </div>

                <div className="crear-botones">
                    <button type="button" className="btn-cancelar" onClick={() => navigate('/mis-publicaciones')}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-guardar" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default EditarPublicacion;