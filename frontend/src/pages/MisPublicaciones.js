import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AgentLayout from '../components/AgentLayout';
import SinFoto from '../components/SinFoto';
import ModalConfirmacion from '../components/ModalConfirmacion';
import ModalReasignarAgente from '../components/ModalReasignarAgente';
import { API_URL } from '../utils/http';
import { ROLES, encabezadoAuth, esRol } from '../utils/sesion';
import './MisPublicaciones.css';

const COLORES_ESTADO = {
    Borrador: '#5d6b7c',
    'En revision': '#b97a12',
    'Enviada a revision': '#b97a12',
    Observada: '#b8402d',
    Publicada: '#44693f',
    'Dada de baja': '#3d4d61'
};

const formatearPrecio = (pub) => `${pub.moneda === 'ARS' ? 'AR$' : 'US$'} ${Number(pub.precio || 0).toLocaleString('es-AR')}`;

const MisPublicaciones = () => {
    const navigate = useNavigate();
    const esAdmin = esRol(ROLES.ADMIN);

    const [publicaciones, setPublicaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [aReasignar, setAReasignar] = useState(null);
    const [imagenActual, setImagenActual] = useState({});
    const [verComentariosPub, setVerComentariosPub] = useState(null);
    const [aEliminar, setAEliminar] = useState(null);
    const [procesando, setProcesando] = useState(false);

    const obtenerPublicaciones = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/publicaciones/mis-publicaciones`, encabezadoAuth());
            setPublicaciones(data);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'No se pudieron cargar las publicaciones');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        obtenerPublicaciones();
    }, [obtenerPublicaciones]);

    const enviarARevision = async (idPublicacion) => {
        setError('');
        try {
            await axios.patch(`${API_URL}/api/publicaciones/${idPublicacion}/enviar-revision`, {}, encabezadoAuth());
            await obtenerPublicaciones();
        } catch (err) {
            setError(err.response?.data?.mensaje || 'No se pudo enviar a revisión');
        }
    };

    const confirmarEliminar = async () => {
        setProcesando(true);
        setError('');
        setExito('');
        try {
            const { data } = await axios.delete(`${API_URL}/api/publicaciones/${aEliminar._id}`, encabezadoAuth());
            setAEliminar(null);
            setExito(esAdmin ? `${data.mensaje}. Se notificó al agente.` : data.mensaje);
            await obtenerPublicaciones();
        } catch (err) {
            setAEliminar(null);
            setError(err.response?.data?.mensaje || 'No se pudo eliminar la publicación');
        } finally {
            setProcesando(false);
        }
    };

    const cambiarImagen = (idPublicacion, delta, totalImagenes) => {
        setImagenActual((prev) => {
            const actual = prev[idPublicacion] || 0;
            const siguiente = Math.min(Math.max(actual + delta, 0), totalImagenes - 1);
            return { ...prev, [idPublicacion]: siguiente };
        });
    };

    const verFicha = (id) => navigate(`/propiedad/${id}`, { state: { desde: '/mis-publicaciones' } });
    const editar = (id) => navigate(`/editar-publicacion/${id}`);

    // Acciones disponibles según rol y estado
    const accionesDe = (pub) => {
        const id = pub._id;
        const estado = pub.estado;

        if (esAdmin) {
            return (
                <>
                    <button type="button" className="btn btn-navy" onClick={() => editar(id)}>Editar</button>
                    {estado === 'Publicada' && (
                        <button type="button" className="btn btn-soft" onClick={() => verFicha(id)}>Ver</button>
                    )}
                    <button type="button" className="btn btn-soft" onClick={() => { setExito(''); setAReasignar(pub); }}>
                        Cambiar agente
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => setAEliminar(pub)}>
                        Eliminar
                    </button>
                </>
            );
        }

        return (
            <>
                {(estado === 'Borrador' || estado === 'Observada') && (
                    <button type="button" className="btn btn-soft" onClick={() => editar(id)}>Editar</button>
                )}
                {estado === 'Observada' && (
                    <button type="button" className="btn btn-outline" onClick={() => setVerComentariosPub(pub)}>
                        Ver comentarios
                    </button>
                )}
                {estado === 'Borrador' && (
                    <button type="button" className="btn btn-navy" onClick={() => enviarARevision(id)}>
                        Enviar a revisión
                    </button>
                )}
                {estado === 'Publicada' && (
                    <>
                        <button type="button" className="btn btn-navy" onClick={() => verFicha(id)}>Ver</button>
                        <button type="button" className="btn btn-soft" onClick={() => navigate(`/gestionar-disponibilidad/${id}`)}>
                            Gestionar disponibilidad
                        </button>
                    </>
                )}
                {(estado === 'Borrador' || estado === 'Publicada') && (
                    <button type="button" className="btn btn-danger" onClick={() => setAEliminar(pub)}>
                        Eliminar
                    </button>
                )}
            </>
        );
    };

    return (
        <AgentLayout
            title={esAdmin ? 'Publicaciones' : 'Mis publicaciones'}
            subtitle={esAdmin ? 'Todas las publicaciones del sistema, en cualquier estado' : 'Gestioná tus propiedades'}
            actions={!esAdmin && (
                <button type="button" className="btn btn-primary" onClick={() => navigate('/crear-publicacion')}>
                    Nueva publicación
                </button>
            )}
        >
            {error && <p className="alert alert-error" role="alert">{error}</p>}
            {exito && <p className="alert alert-ok" role="status">{exito}</p>}

            <div className="mis-publicaciones">
                {cargando ? (
                    <p className="empty-state">Cargando publicaciones...</p>
                ) : publicaciones.length === 0 ? (
                    <p className="empty-state">
                        {esAdmin ? 'Todavía no hay publicaciones cargadas.' : 'No tenés publicaciones todavía. ¡Creá una!'}
                    </p>
                ) : (
                    <div className="property-grid">
                        {publicaciones.map((pub) => {
                            const id = pub._id;
                            const imagenes = Array.isArray(pub.imagenes) ? pub.imagenes : [];
                            const indice = Math.min(imagenActual[id] || 0, Math.max(imagenes.length - 1, 0));
                            const agente = pub.id_agente?.nombre ? `${pub.id_agente.nombre} ${pub.id_agente.apellido}` : null;

                            return (
                                <article className="property-card" key={id}>
                                    <div className="property-media">
                                        {imagenes.length > 0 ? (
                                            <img className="property-img" src={imagenes[indice]} alt={pub.titulo} />
                                        ) : (
                                            <SinFoto />
                                        )}

                                        <div className="property-badges">
                                            <span className="property-op">{pub.tipo_operacion}</span>
                                            <span className="estado-badge" style={{ backgroundColor: COLORES_ESTADO[pub.estado] || '#5d6b7c' }}>
                                                {pub.estado}
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
                                                    <span className="chevron chevron-izq" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="property-nav property-nav-next"
                                                    onClick={() => cambiarImagen(id, 1, imagenes.length)}
                                                    disabled={indice === imagenes.length - 1}
                                                    aria-label="Imagen siguiente"
                                                >
                                                    <span className="chevron" />
                                                </button>
                                                <span className="property-indicador">{indice + 1}/{imagenes.length}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="property-body">
                                        {pub.estado === 'Observada' && !esAdmin && (
                                            <div className="property-banner-observada">
                                                <span>Tiene observaciones del Área Legal</span>
                                                <button type="button" onClick={() => setVerComentariosPub(pub)}>
                                                    Ver comentarios
                                                </button>
                                            </div>
                                        )}
                                        <h2>{pub.titulo}</h2>
                                        <p className="property-meta">
                                            {[pub.direccion, pub.superficie && `${pub.superficie} m²`, pub.ambientes && `${pub.ambientes} amb.`]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                        {esAdmin && agente && <p className="property-agente">Agente: {agente}</p>}
                                        <p className="property-price">{formatearPrecio(pub)}</p>
                                        <div className="property-actions">{accionesDe(pub)}</div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {verComentariosPub && (
                <div className="obs-modal-fondo" onClick={() => setVerComentariosPub(null)}>
                    <div className="obs-modal modal-panel" onClick={(e) => e.stopPropagation()}>
                        <h2 className="obs-modal-titulo">Observaciones del Área Legal</h2>
                        <p className="obs-modal-subtitulo">{verComentariosPub.titulo}</p>
                        <p className="obs-modal-texto">
                            {verComentariosPub.comentarios_legal || 'No se registraron comentarios.'}
                        </p>
                        <div className="obs-modal-botones">
                            <button type="button" className="btn btn-outline" onClick={() => setVerComentariosPub(null)}>
                                Cerrar
                            </button>
                            <button type="button" className="btn btn-primary" onClick={() => editar(verComentariosPub._id)}>
                                Editar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {aEliminar && (
                <ModalConfirmacion
                    titulo="Eliminar publicación"
                    mensaje={[
                        aEliminar.estado === 'Publicada' && 'La publicación ya está visible en el catálogo y dejará de mostrarse.',
                        esAdmin && 'Se eliminarán también sus documentos, horarios y turnos, y se notificará al agente.',
                        'Esta acción no se puede deshacer.'
                    ].filter(Boolean).join(' ')}
                    detalle={aEliminar.titulo}
                    textoConfirmar="Eliminar"
                    variante="danger"
                    procesando={procesando}
                    onConfirmar={confirmarEliminar}
                    onCancelar={() => setAEliminar(null)}
                />
            )}
            {aReasignar && (
                <ModalReasignarAgente
                    publicacion={aReasignar}
                    onCancelar={() => setAReasignar(null)}
                    onReasignada={async (mensaje) => {
                        setAReasignar(null);
                        setExito(`${mensaje}. Se notificó a ambos agentes.`);
                        await obtenerPublicaciones();
                    }}
                />
            )}
        </AgentLayout>
    );
};

export default MisPublicaciones;
