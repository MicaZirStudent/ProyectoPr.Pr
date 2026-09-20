import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import AgentLayout from '../components/AgentLayout';
import PublicacionMediaFields from '../components/PublicacionMediaFields';
import { withPublicacionMedia, persistPublicacionMedia, fotosADataUrls } from '../utils/publicacionMedia';
import './CrearPublicacion.css';

const EditarPublicacion = () => {
    const { id } = useParams();
    const [form, setForm] = useState({
        titulo: '',
        descripcion: '',
        tipoOperacion: 'venta',
        tipoPropiedad: '',
        precio: '',
        direccion: '',
        superficie: '',
        ambientes: '',
        documentos: [],
        fotos: []
    });
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        obtenerPublicacion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const obtenerPublicacion = async () => {
        try {
            const token = localStorage.getItem('token');
            const respuesta = await axios.get(`http://localhost:3001/api/publicaciones/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const pub = withPublicacionMedia(respuesta.data);
            setForm({
                titulo: pub.titulo,
                descripcion: pub.descripcion || '',
                tipoOperacion: (pub.tipo_operacion || 'venta').toLowerCase(),
                tipoPropiedad: pub.tipo_propiedad ? pub.tipo_propiedad.toLowerCase() : '',
                precio: pub.precio ?? '',
                direccion: pub.direccion,
                superficie: pub.superficie ?? '',
                ambientes: pub.ambientes ?? '',
                documentos: pub.documentos || [],
                fotos: pub.fotos || []
            });
            setCargando(false);
        } catch (error) {
            if (error.response?.status === 401) navigate('/login');
            if (error.response?.status === 404) navigate('/mis-publicaciones');
            setCargando(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleMediaChange = (campo, valor) => {
        setForm({ ...form, [campo]: valor });
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');
        setGuardando(true);

        try {
            const token = localStorage.getItem('token');
            const { documentos, fotos, ...payload } = form;
            const imagenes = await fotosADataUrls(fotos);
            await axios.put(`http://localhost:3001/api/publicaciones/${id}`, { ...payload, imagenes }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await persistPublicacionMedia(id, documentos, fotos);
            setExito('Publicación actualizada correctamente');
            setTimeout(() => {
                navigate('/mis-publicaciones');
            }, 1500);
        } catch (error) {
            if (error.response?.status === 401) navigate('/login');
            if (error.response?.status === 403) {
                setError('No se puede editar una publicación en este estado');
            } else {
                setError('Complete todos los campos obligatorios');
            }
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return (
            <AgentLayout title="Editar publicación">
                <p className="empty-state">Cargando...</p>
            </AgentLayout>
        );
    }

    return (
        <AgentLayout
            title="Editar publicación"
            subtitle="Modificá los datos de la propiedad"
            actions={
                <button type="button" className="btn btn-outline" onClick={() => navigate('/mis-publicaciones')}>
                    ← Volver
                </button>
            }
        >
            <form onSubmit={handleGuardar} className="crear-form">
                {error && <p className="alert alert-error">{error}</p>}
                {exito && <p className="alert alert-ok">{exito}</p>}

                <div className="form-card">
                    <h2 className="form-section-title">Datos de la propiedad</h2>

                    <div className="field">
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

                    <div className="field">
                        <label>Descripción</label>
                        <textarea
                            name="descripcion"
                            value={form.descripcion}
                            onChange={handleChange}
                            placeholder="Describí la propiedad..."
                            rows={4}
                        />
                    </div>

                    <div className="field-row">
                        <div className="field">
                            <label>Tipo de operación *</label>
                            <select name="tipoOperacion" value={form.tipoOperacion} onChange={handleChange}>
                                <option value="venta">Venta</option>
                                <option value="alquiler">Alquiler</option>
                            </select>
                        </div>
                        <div className="field">
                            <label>Tipo de propiedad</label>
                            <select name="tipoPropiedad" value={form.tipoPropiedad} onChange={handleChange}>
                                <option value="">Sin especificar</option>
                                <option value="casa">Casa</option>
                                <option value="departamento">Departamento</option>
                                <option value="local">Local</option>
                            </select>
                        </div>
                    </div>

                    <div className="field-row">
                        <div className="field">
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

                    <div className="field">
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

                    <div className="field-row">
                        <div className="field">
                            <label>Superficie (m²)</label>
                            <input
                                type="number"
                                name="superficie"
                                value={form.superficie}
                                onChange={handleChange}
                                placeholder="Ej: 200"
                            />
                        </div>
                        <div className="field">
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

                <PublicacionMediaFields
                    documentos={form.documentos}
                    fotos={form.fotos}
                    onChange={handleMediaChange}
                />

                <div className="form-actions">
                    <button type="button" className="btn btn-outline" onClick={() => navigate('/mis-publicaciones')}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </form>
        </AgentLayout>
    );
};

export default EditarPublicacion;
