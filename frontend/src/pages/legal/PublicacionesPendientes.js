import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LegalLayout from '../../components/LegalLayout';
import './PublicacionesPendientes.css';

const TABS = [
    { key: 'pendientes', label: 'Pendientes' },
    { key: 'aprobadas', label: 'Aprobadas' },
    { key: 'observadas', label: 'Observadas' }
];

const LIMITE_RESUMEN = 140;

const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '—';
    return new Date(fechaISO).toLocaleDateString('es-AR');
};

const PublicacionesPendientes = () => {
    const navigate = useNavigate();
    const sesion = JSON.parse(localStorage.getItem('usuario') || 'null');

    const [tab, setTab] = useState('pendientes');
    const [publicaciones, setPublicaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    const [pubObservar, setPubObservar] = useState(null);
    const [comentarios, setComentarios] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [errorModal, setErrorModal] = useState('');

    const [pubComentarios, setPubComentarios] = useState(null);

    const auth = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const cargar = async (tabActual) => {
        setCargando(true);
        setError('');
        try {
            let respuesta;
            if (tabActual === 'pendientes') {
                respuesta = await axios.get('http://localhost:3001/api/publicaciones/pendientes-revision', auth());
            } else {
                const tipo = tabActual === 'aprobadas' ? 'aprobadas' : 'observadas';
                respuesta = await axios.get(`http://localhost:3001/api/publicaciones/historial?tipo=${tipo}`, auth());
            }
            setPublicaciones(respuesta.data);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/login');
                return;
            }
            setError(err.response?.data?.mensaje || 'No se pudieron cargar las publicaciones');
            setPublicaciones([]);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (sesion?.rol !== 'Area legal') {
            navigate('/dashboard');
            return;
        }
        cargar(tab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    const abrirObservar = (pub) => {
        setPubObservar(pub);
        setComentarios('');
        setErrorModal('');
    };

    const cerrarObservar = () => {
        setPubObservar(null);
        setComentarios('');
        setErrorModal('');
    };

    const enviarObservacion = async (e) => {
        e.preventDefault();
        if (!comentarios.trim()) {
            setErrorModal('Ingresá un comentario para continuar');
            return;
        }
        setEnviando(true);
        try {
            await axios.patch(
                `http://localhost:3001/api/publicaciones/${pubObservar._id}/observar`,
                { comentarios: comentarios.trim() },
                auth()
            );
            cerrarObservar();
            await cargar('pendientes');
        } catch (err) {
            setErrorModal(err.response?.data?.mensaje || 'No se pudo registrar la observación');
        } finally {
            setEnviando(false);
        }
    };

    const aprobar = async (pub) => {
        if (!window.confirm('¿Aprobar esta publicación?')) return;
        try {
            await axios.patch(`http://localhost:3001/api/publicaciones/${pub._id}/aprobar`, {}, auth());
            await cargar('pendientes');
        } catch (err) {
            alert(err.response?.data?.mensaje || 'No se pudo aprobar la publicación');
        }
    };

    return (
        <LegalLayout title="Publicaciones" subtitle="Revisá y aprobá las propiedades">
            <div className="legal-tabs">
                {TABS.map((t) => (
                    <button
                        type="button"
                        key={t.key}
                        className={`legal-tab ${tab === t.key ? 'activo' : ''}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {error && <p className="alert alert-error">{error}</p>}

            {cargando ? (
                <p className="empty-state">Cargando publicaciones...</p>
            ) : publicaciones.length === 0 ? (
                <p className="empty-state">
                    {tab === 'pendientes' && 'No hay publicaciones pendientes de revisión'}
                    {tab === 'aprobadas' && 'Todavía no aprobaste ninguna publicación'}
                    {tab === 'observadas' && 'Todavía no observaste ninguna publicación'}
                </p>
            ) : (
                <div className="legal-lista">
                    {publicaciones.map((pub) => (
                        <article className="legal-card" key={pub._id}>
                            <div className="legal-card-media">
                                {pub.imagenes && pub.imagenes.length > 0 ? (
                                    <img src={pub.imagenes[0]} alt={pub.titulo} />
                                ) : (
                                    <div className="legal-card-sinfoto">Sin foto</div>
                                )}
                            </div>
                            <div className="legal-card-info">
                                <h2 className="legal-card-titulo">{pub.titulo}</h2>
                                <p className="legal-card-direccion">{pub.direccion}</p>
                                <p className="legal-card-meta">
                                    ${Number(pub.precio || 0).toLocaleString('es-AR')}
                                    {pub.superficie ? ` · ${pub.superficie} m²` : ''}
                                    {pub.ambientes ? ` · ${pub.ambientes} amb.` : ''}
                                </p>
                                <p className="legal-card-agente">
                                    Agente: {pub.id_agente ? `${pub.id_agente.nombre} ${pub.id_agente.apellido}` : '—'}
                                </p>
                                {pub.descripcion && <p className="legal-card-descripcion">{pub.descripcion}</p>}

                                {tab === 'aprobadas' && (
                                    <p className="legal-card-fecha">Aprobada el: {formatearFecha(pub.fecha_revision || pub.updatedAt)}</p>
                                )}

                                {tab === 'observadas' && (
                                    <div className="legal-card-comentarios">
                                        <p className="legal-card-comentarios-texto">
                                            {(pub.comentarios_legal || '').slice(0, LIMITE_RESUMEN)}
                                            {(pub.comentarios_legal || '').length > LIMITE_RESUMEN ? '…' : ''}
                                        </p>
                                        {(pub.comentarios_legal || '').length > LIMITE_RESUMEN && (
                                            <button type="button" className="btn btn-soft" onClick={() => setPubComentarios(pub)}>
                                                Ver comentarios
                                            </button>
                                        )}
                                    </div>
                                )}

                                {tab === 'pendientes' && (
                                    <div className="legal-card-acciones">
                                        <button type="button" className="btn btn-warning" onClick={() => abrirObservar(pub)}>
                                            Observar
                                        </button>
                                        <button type="button" className="btn btn-success" onClick={() => aprobar(pub)}>
                                            Aprobar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {pubObservar && (
                <div className="legal-modal-overlay" onClick={cerrarObservar}>
                    <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="legal-titulo">Agregar observaciones</h2>
                        <p className="legal-subtitulo">{pubObservar.titulo}</p>
                        <form onSubmit={enviarObservacion}>
                            {errorModal && <p className="alert alert-error">{errorModal}</p>}
                            <div className="field">
                                <label>Comentarios *</label>
                                <textarea
                                    rows={6}
                                    value={comentarios}
                                    onChange={(e) => setComentarios(e.target.value)}
                                    placeholder="Detallá qué debe corregir el agente..."
                                />
                            </div>
                            <div className="legal-acciones">
                                <button type="button" className="btn btn-outline" onClick={cerrarObservar}>Cancelar</button>
                                <button type="submit" className="btn btn-warning" disabled={enviando}>
                                    {enviando ? 'Enviando...' : 'Enviar observación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {pubComentarios && (
                <div className="legal-modal-overlay" onClick={() => setPubComentarios(null)}>
                    <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="legal-titulo">Comentarios</h2>
                        <p className="legal-subtitulo">{pubComentarios.titulo}</p>
                        <p className="legal-card-comentarios-completo">{pubComentarios.comentarios_legal}</p>
                        <div className="legal-acciones">
                            <button type="button" className="btn btn-primary" onClick={() => setPubComentarios(null)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </LegalLayout>
    );
};

export default PublicacionesPendientes;
