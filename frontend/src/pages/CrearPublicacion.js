import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AgentLayout from '../components/AgentLayout';
import PublicacionMediaFields from '../components/PublicacionMediaFields';
import { persistPublicacionMedia, fotosADataUrls } from '../utils/publicacionMedia';
import './CrearPublicacion.css';

const CrearPublicacion = () => {
    const [form, setForm] = useState({
        titulo: '',
        descripcion: '',
        tipoOperacion: 'venta',
        tipoPropiedad: '',
        precio: '',
        moneda: 'USD',
        direccion: '',
        superficie: '',
        ambientes: '',
        documentos: [],
        fotos: []
    });
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [guardando, setGuardando] = useState(false);
    const navigate = useNavigate();

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
            const respuesta = await axios.post('http://localhost:3001/api/publicaciones/crear', { ...payload, imagenes }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (respuesta.data?.idPublicacion) {
                await persistPublicacionMedia(respuesta.data.idPublicacion, documentos, fotos);
            }
            setExito('Publicación guardada correctamente');
            setTimeout(() => {
                navigate('/mis-publicaciones');
            }, 1500);
        } catch (error) {
            if (error.response?.status === 401) {
                navigate('/login');
                return;
            }
            if (error.response?.status === 413) {
                setError('Las fotos son demasiado pesadas. Sacá alguna e intentá de nuevo.');
            } else {
                setError(error.response?.data?.mensaje || 'Complete todos los campos obligatorios');
            }
        } finally {
            setGuardando(false);
        }
    };

    return (
        <AgentLayout
            title="Nueva publicación"
            subtitle="Completá los datos de la propiedad"
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
                        <div className="field">
                            <label>Moneda *</label>
                            <select name="moneda" value={form.moneda} onChange={handleChange}>
                                <option value="USD">USD</option>
                                <option value="ARS">ARS</option>
                            </select>
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
                        {guardando ? 'Guardando...' : 'Guardar borrador'}
                    </button>
                </div>
            </form>
        </AgentLayout>
    );
};

export default CrearPublicacion;
