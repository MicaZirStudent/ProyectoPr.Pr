// Importamos useState para manejar los campos del formulario
import { useState } from 'react';

// Importamos axios para hablarle al backend
import axios from 'axios';

// Importamos useNavigate para redirigir después de guardar
import { useNavigate } from 'react-router-dom';

// Importamos los estilos
import './CrearPublicacion.css';

const CrearPublicacion = () => {

    // Estado para cada campo del formulario
    const [form, setForm] = useState({
        titulo: '',
        descripcion: '',
        tipoOperacion: 'venta',
        precio: '',
        direccion: '',
        superficie: '',
        ambientes: ''
    });

    // Estado para mensajes de error o éxito
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');

    // Estado para saber si está guardando (deshabilitar el botón mientras espera)
    const [guardando, setGuardando] = useState(false);

    const navigate = useNavigate();

    // Función genérica para actualizar cualquier campo del formulario
    // En vez de hacer un handler por cada campo, usamos el name del input
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Función que se ejecuta al presionar "Guardar Borrador"
    const handleGuardar = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');
        setGuardando(true);

        try {
            const token = localStorage.getItem('token');

            await axios.post('http://localhost:3001/api/publicaciones/crear', form, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setExito('Publicación guardada correctamente');

            // Esperamos 1.5 segundos y redirigimos a mis publicaciones
            setTimeout(() => {
                navigate('/mis-publicaciones');
            }, 1500);

        } catch (error) {
            if (error.response?.status === 401) {
                navigate('/');
            }
            setError('Complete todos los campos obligatorios');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="crear-wrap">
            <div className="crear-header">
                <div>
                    <h1 className="crear-titulo">Nueva Publicación</h1>
                    <p className="crear-subtitulo">Completá los datos de la propiedad</p>
                </div>
                <button className="btn-volver" onClick={() => navigate('/mis-publicaciones')}>← Volver</button>
            </div>

            <form onSubmit={handleGuardar} className="crear-form">

                {/* Mensajes de error o éxito */}
                {error && <p className="crear-error">{error}</p>}
                {exito && <p className="crear-exito">{exito}</p>}

                {/* Sección datos públicos */}
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

                {/* Botones */}
                <div className="crear-botones">
                    <button type="button" className="btn-cancelar" onClick={() => navigate('/mis-publicaciones')}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-guardar" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar Borrador'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default CrearPublicacion;