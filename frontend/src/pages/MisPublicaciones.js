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
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setPublicaciones(respuesta.data);
            setCargando(false);
        } catch (error) {
            if (error.response?.status === 401) {
                navigate('/');
            }
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
            borrador: '#9CA3AF',
            en_revision: '#F59E0B',
            observada: '#EF4444',
            publicada: '#1a2b4a',
            dada_de_baja: '#6B7280'
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
                        <article className="property-card" key={pub.idPublicacion}>
                            <div className="property-media">
                                <span className="property-op">{pub.tipoOperacion}</span>
                                <span className="estado-badge" style={{ backgroundColor: colorEstado(pub.estadoPublicacion) }}>
                                    {pub.estadoPublicacion.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="property-body">
                                <h2>{pub.titulo}</h2>
                                {pub.direccion && <p className="property-meta">{pub.direccion}</p>}
                                <p className="property-meta">
                                    {[pub.superficieM2 && `${pub.superficieM2} m²`, pub.ambientes && `${pub.ambientes} amb.`]
                                        .filter(Boolean)
                                        .join(' · ') || 'Datos de ficha pendientes'}
                                </p>
                                <p className="property-price">${Number(pub.precioPublicacion).toLocaleString('es-AR')}</p>
                                <div className="property-actions">
                                    {(pub.estadoPublicacion === 'borrador' || pub.estadoPublicacion === 'observada') && (
                                        <button className="btn btn-soft" onClick={() => navigate(`/editar-publicacion/${pub.idPublicacion}`)}>
                                            Editar
                                        </button>
                                    )}
                                    {pub.estadoPublicacion === 'borrador' && (
                                        <button className="btn btn-navy" onClick={() => enviarARevision(pub.idPublicacion)}>
                                            Enviar a revisión
                                        </button>
                                    )}
                                    {pub.estadoPublicacion === 'publicada' && (
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
