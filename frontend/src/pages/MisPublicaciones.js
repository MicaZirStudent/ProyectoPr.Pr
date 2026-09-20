import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AgentLayout from '../components/AgentLayout';
import { withPublicacionMedia } from '../utils/publicacionMedia';
import './MisPublicaciones.css';

const MisPublicaciones = () => {
    const [publicaciones, setPublicaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [imagenActual, setImagenActual] = useState({});
    const [verComentariosPub, setVerComentariosPub] = useState(null);
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
            if (error.response?.status === 401) navigate('/login');
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
            if (error.response?.status === 401) navigate('/login');
            alert('No se pudo enviar a revisión');
        }
    };

    const eliminarPublicacion = async (idPublicacion, estaPublicada) => {
        const mensaje = estaPublicada
            ? '¿Estás seguro que querés eliminar esta publicación? Ya está publicada y dejará de verse en el catálogo.'
            : '¿Estás seguro que querés eliminar esta publicación?';
        if (!window.confirm(mensaje)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3001/api/publicaciones/${idPublicacion}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            obtenerPublicaciones();
        } catch (error) {
            if (error.response?.status === 401) return navigate('/login');
            alert(error.response?.data?.mensaje || 'No se pudo eliminar la publicación');
        }
    };

    const colorEstado = (estado) => {
        const colores = {
            borrador: '#9CA3AF',
            Borrador: '#9CA3AF',
            en_revision: '#F59E0B',
            'En revision': '#F59E0B',
            'Enviada a revision': '#F59E0B',
            observada: '#EF4444',
            Observada: '#EF4444',
            publicada: '#1a2b4a',
            Publicada: '#1a2b4a',
            dada_de_baja: '#6B7280',
            'Dada de baja': '#6B7280'
        };
        return colores[estado] || '#9CA3AF';
    };

    const idDe = (pub) => pub._id || pub.idPublicacion;
    const estadoDe = (pub) => pub.estado || pub.estadoPublicacion || '';
    const imagenesDe = (pub) => withPublicacionMedia(pub).fotos.map((foto) => foto.preview || foto).filter(Boolean);

    const cambiarImagen = (idPublicacion, delta, totalImagenes) => {
        setImagenActual((prev) => {
            const actual = prev[idPublicacion] || 0;
            const siguiente = Math.min(Math.max(actual + delta, 0), totalImagenes - 1);
            return { ...prev, [idPublicacion]: siguiente };
        });
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
            <div className="mis-publicaciones">
                {cargando ? (
                    <p className="empty-state">Cargando publicaciones...</p>
                ) : publicaciones.length === 0 ? (
                    <p className="empty-state">No tenés publicaciones todavía. ¡Creá una!</p>
                ) : (
                    <div className="property-grid">
                        {publicaciones.map((pub) => {
                            const id = idDe(pub);
                            const imagenes = imagenesDe(pub);
                            const indice = Math.min(imagenActual[id] || 0, Math.max(imagenes.length - 1, 0));

                            return (
                                <article className="property-card" key={id}>
                                    <div className="property-media">
                                        {imagenes.length > 0 ? (
                                            <img className="property-img" src={imagenes[indice]} alt={pub.titulo} />
                                        ) : (
                                            <div className="property-sin-foto">Sin foto</div>
                                        )}

                                        <div className="property-badges">
                                            <span className="property-op">{pub.tipo_operacion || pub.tipoOperacion}</span>
                                            <span className="estado-badge" style={{ backgroundColor: colorEstado(estadoDe(pub)) }}>
                                                {String(estadoDe(pub)).replace(/_/g, ' ')}
                                            </span>
                                        </div>

                                        {imagenes.length > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="property-nav property-nav-prev"
                                                    onClick={() => cambiarImagen(id, -1, imagenes.length)}
                                                    disabled={indice === 0}
                                                    aria-label="Imagen anterior"
                                                >
                                                    ‹
                                                </button>
                                                <button
                                                    type="button"
                                                    className="property-nav property-nav-next"
                                                    onClick={() => cambiarImagen(id, 1, imagenes.length)}
                                                    disabled={indice === imagenes.length - 1}
                                                    aria-label="Imagen siguiente"
                                                >
                                                    ›
                                                </button>
                                                <span className="property-indicador">{indice + 1}/{imagenes.length}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="property-body">
                                        {estadoDe(pub) === 'Observada' && (
                                            <div className="property-banner-observada">
                                                <span>⚠ Tiene observaciones</span>
                                                <button type="button" onClick={() => setVerComentariosPub(pub)}>
                                                    Ver comentarios
                                                </button>
                                            </div>
                                        )}
                                        <h2>{pub.titulo}</h2>
                                        <p className="property-meta">
                                            {[pub.direccion, pub.superficie && `${pub.superficie} m²`, pub.superficieM2 && `${pub.superficieM2} m²`, pub.ambientes && `${pub.ambientes} amb.`]
                                                .filter(Boolean)
                                                .join(' · ') || 'Datos de ficha pendientes'}
                                        </p>
                                        <p className="property-price">
                                            {pub.moneda === 'ARS' ? 'AR$' : 'US$'} {Number(pub.precio || pub.precioPublicacion || 0).toLocaleString('es-AR')}
                                        </p>
                                        <div className="property-actions">
                                            {(estadoDe(pub) === 'Borrador' || estadoDe(pub) === 'Observada') && (
                                                <button className="btn btn-soft" onClick={() => navigate(`/editar-publicacion/${id}`)}>
                                                    Editar
                                                </button>
                                            )}
                                            {estadoDe(pub) === 'Observada' && (
                                                <button className="btn btn-outline" onClick={() => setVerComentariosPub(pub)}>
                                                    Ver comentarios
                                                </button>
                                            )}
                                            {estadoDe(pub) === 'Borrador' && (
                                                <button className="btn btn-navy" onClick={() => enviarARevision(id)}>
                                                    Enviar a revisión
                                                </button>
                                            )}
                                            {(estadoDe(pub) === 'Borrador' || estadoDe(pub) === 'Publicada') && (
                                                <button className="btn btn-danger" onClick={() => eliminarPublicacion(id, estadoDe(pub) === 'Publicada')}>
                                                    Eliminar
                                                </button>
                                            )}
                                            {estadoDe(pub) === 'Publicada' && (
                                                <>
                                                    <button className="btn btn-navy" onClick={() => navigate(`/propiedad/${id}`)}>Ver</button>
                                                    <button className="btn btn-soft" onClick={() => navigate(`/gestionar-disponibilidad/${id}`)}>
                                                        Gestionar disponibilidad
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {verComentariosPub && (
                <div className="obs-modal-fondo" onClick={() => setVerComentariosPub(null)}>
                    <div className="obs-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="obs-modal-titulo">Observaciones del Área Legal</h2>
                        <p className="obs-modal-subtitulo">{verComentariosPub.titulo}</p>
                        <p className="obs-modal-texto">
                            {verComentariosPub.comentarios_legal || 'No se registraron comentarios.'}
                        </p>
                        <div className="obs-modal-botones">
                            <button type="button" className="btn btn-outline" onClick={() => setVerComentariosPub(null)}>
                                Cerrar
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => navigate(`/editar-publicacion/${idDe(verComentariosPub)}`)}
                            >
                                Editar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AgentLayout>
    );
};

export default MisPublicaciones;
