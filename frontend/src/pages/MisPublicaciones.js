import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AgentLayout from '../components/AgentLayout';
import './MisPublicaciones.css';

const MisPublicaciones = () => {
    const [publicaciones, setPublicaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        obtenerPublicaciones();
    }, []);

    const obtenerPublicaciones = async () => {
        try {
            const token = localStorage.getItem('token');
            const respuesta = await axios.get('http://localhost:3001/api/publicaciones/mis-publicaciones', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPublicaciones(respuesta.data);
            setCargando(false);
        } catch (error) {
            if (error.response?.status === 401) navigate('/');
            setCargando(false);
        }
    };

    const enviarARevision = async (idPublicacion) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:3001/api/publicaciones/${idPublicacion}/enviar-revision`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            obtenerPublicaciones();
        } catch (error) {
            if (error.response?.status === 401) navigate('/');
            alert('No se pudo enviar a revisión');
        }
    };

    const colorEstado = (estado) => {
        const colores = {
            'Borrador': '#9CA3AF',
            'En revision': '#F59E0B',
            'Observada': '#EF4444',
            'Publicada': '#1a2b4a',
            'Dada de baja': '#6B7280'
        };
        return colores[estado] || '#9CA3AF';
    };

    return (
        <AgentLayout
            title="Mis publicaciones"
            subtitle="Gestioná tus propiedades"
            actions={
                <button className="btn btn-primary" onClick={() => navigate('/crear-publicacion')}>
                    + Nueva publicación
                </button>
            }
        >
            {cargando ? (
                <p className="empty-state">Cargando publicaciones...</p>
            ) : publicaciones.length === 0 ? (
                <p className="empty-state">No tenés publicaciones todavía. ¡Creá una!</p>
            ) : (
                <div className="property-grid">
                    {publicaciones.map((pub) => (
                        <article className="property-card" key={pub._id}>
                            <div className="property-media">
                                <span className="property-op">{pub.tipo_operacion}</span>
                                <span className="estado-badge" style={{ backgroundColor: colorEstado(pub.estado) }}>
                                    {pub.estado}
                                </span>
                            </div>
                            <div className="property-body">
                                <h2>{pub.titulo}</h2>
                                {pub.direccion && <p className="property-meta">{pub.direccion}</p>}
                                <p className="property-meta">
                                    {[pub.superficie && `${pub.superficie} m²`, pub.ambientes && `${pub.ambientes} amb.`]
                                        .filter(Boolean)
                                        .join(' · ') || 'Datos de ficha pendientes'}
                                </p>
                                <p className="property-price">${Number(pub.precio).toLocaleString('es-AR')}</p>
                                <div className="property-actions">
                                    {(pub.estado === 'Borrador' || pub.estado === 'Observada') && (
                                        <button className="btn btn-soft" onClick={() => navigate(`/editar-publicacion/${pub._id}`)}>
                                            Editar
                                        </button>
                                    )}
                                    {pub.estado === 'Borrador' && (
                                        <button className="btn btn-navy" onClick={() => enviarARevision(pub._id)}>
                                            Enviar a revisión
                                        </button>
                                    )}
                                    {pub.estado === 'Publicada' && (
                                        <button className="btn btn-navy">Ver</button>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </AgentLayout>
    );
};

export default MisPublicaciones;
