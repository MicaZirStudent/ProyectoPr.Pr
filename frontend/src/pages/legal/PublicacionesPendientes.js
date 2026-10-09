import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import LegalLayout from '../../components/LegalLayout';
import SinFoto from '../../components/SinFoto';
import ListaDocumentos from '../../components/ListaDocumentos';
import ModalConfirmacion from '../../components/ModalConfirmacion';
import { API_URL } from '../../utils/http';
import { encabezadoAuth } from '../../utils/sesion';
import './PublicacionesPendientes.css';

const TABS = [
    { key: 'pendientes', label: 'Pendientes' },
    { key: 'aprobadas', label: 'Aprobadas' },
    { key: 'observadas', label: 'Observadas' }
];

const VACIO_POR_TAB = {
    pendientes: 'No hay publicaciones pendientes de revisión',
    aprobadas: 'Todavía no aprobaste ninguna publicación',
    observadas: 'Todavía no observaste ninguna publicación'
};

// Paso anterior del flujo para cada pestaña (coincide con la regla del backend)
const REVERSION_POR_TAB = {
    pendientes: {
        boton: 'Devolver a borrador',
        mensaje: 'La publicación vuelve a Borrador y el agente podrá editarla y reenviarla.'
    },
    aprobadas: {
        boton: 'Volver a revisión',
        mensaje: 'La publicación deja de mostrarse en el catálogo y vuelve a quedar pendiente de revisión.'
    },
    observadas: {
        boton: 'Volver a revisión',
        mensaje: 'La observación queda sin efecto y la publicación vuelve a quedar pendiente de revisión.'
    }
};

const LIMITE_RESUMEN = 140;

const formatearFecha = (fechaISO) => (fechaISO ? new Date(fechaISO).toLocaleDateString('es-AR') : '—');

const PublicacionesPendientes = () => {
    const [tab, setTab] = useState('pendientes');
    const [publicaciones, setPublicaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');

    const [pubObservar, setPubObservar] = useState(null);
    const [comentarios, setComentarios] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [errorModal, setErrorModal] = useState('');
    const [pubComentarios, setPubComentarios] = useState(null);

    // Acción pendiente de confirmar: { tipo: 'aprobar' | 'revertir' | 'eliminar', pub }
    const [accion, setAccion] = useState(null);
    const [procesando, setProcesando] = useState(false);
    const [errorAccion, setErrorAccion] = useState('');

    const cargar = useCallback(async (tabActual) => {
        setCargando(true);
        setError('');
        try {
            const url = tabActual === 'pendientes'
                ? `${API_URL}/api/publicaciones/pendientes-revision`
                : `${API_URL}/api/publicaciones/historial?tipo=${tabActual}`;
            const { data } = await axios.get(url, encabezadoAuth());
            setPublicaciones(data);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'No se pudieron cargar las publicaciones');
            setPublicaciones([]);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar(tab);
    }, [tab, cargar]);

    const cambiarTab = (nuevoTab) => {
        setExito('');
        setTab(nuevoTab);
    };

    // ---------- Observar ----------

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
                `${API_URL}/api/publicaciones/${pubObservar._id}/observar`,
                { comentarios: comentarios.trim() },
                encabezadoAuth()
            );
            cerrarObservar();
            setExito('Observación registrada. Se notificó al agente.');
            await cargar(tab);
        } catch (err) {
            setErrorModal(err.response?.data?.mensaje || 'No se pudo registrar la observación');
        } finally {
            setEnviando(false);
        }
    };

    // ---------- Aprobar / revertir / eliminar (con confirmación) ----------

    const pedirConfirmacion = (tipo, pub) => {
        setErrorAccion('');
        setAccion({ tipo, pub });
    };

    const ejecutarAccion = async () => {
        const { tipo, pub } = accion;
        const base = `${API_URL}/api/publicaciones/${pub._id}`;
        setProcesando(true);
        setErrorAccion('');
        try {
            let respuesta;
            if (tipo === 'aprobar') {
                respuesta = await axios.patch(`${base}/aprobar`, {}, encabezadoAuth());
            } else if (tipo === 'revertir') {
                respuesta = await axios.patch(`${base}/revertir-estado`, {}, encabezadoAuth());
            } else {
                respuesta = await axios.delete(base, encabezadoAuth());
            }
            setAccion(null);
            setExito(respuesta.data.mensaje);
            await cargar(tab);
        } catch (err) {
            setErrorAccion(err.response?.data?.mensaje || 'No se pudo completar la acción');
        } finally {
            setProcesando(false);
        }
    };

    const configuracionConfirmacion = () => {
        if (!accion) return null;
        const { tipo, pub } = accion;
        if (tipo === 'aprobar') {
            return {
                titulo: 'Aprobar publicación',
                mensaje: 'La publicación se mostrará en el catálogo público y se notificará al agente.',
                textoConfirmar: 'Aprobar',
                variante: 'success',
                detalle: pub.titulo
            };
        }
        if (tipo === 'revertir') {
            return {
                titulo: 'Devolver a estado anterior',
                mensaje: REVERSION_POR_TAB[tab].mensaje,
                textoConfirmar: REVERSION_POR_TAB[tab].boton,
                variante: 'warning',
                detalle: `${pub.titulo} · Estado actual: ${pub.estado}`
            };
        }
        return {
            titulo: 'Eliminar publicación',
            mensaje: 'Se eliminarán la publicación, sus documentos, horarios y turnos. El agente será notificado. Esta acción no se puede deshacer.',
            textoConfirmar: 'Eliminar',
            variante: 'danger',
            detalle: pub.titulo
        };
    };

    const confirmacion = configuracionConfirmacion();

    return (
        <LegalLayout title="Publicaciones" subtitle="Revisá, aprobá y gestioná las propiedades">
            <div className="legal-tabs" role="tablist">
                {TABS.map((t) => (
                    <button
                        type="button"
                        key={t.key}
                        role="tab"
                        aria-selected={tab === t.key}
                        className={`legal-tab ${tab === t.key ? 'activo' : ''}`}
                        onClick={() => cambiarTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {error && <p className="alert alert-error" role="alert">{error}</p>}
            {exito && <p className="alert alert-ok" role="status">{exito}</p>}

            {cargando ? (
                <p className="empty-state">Cargando publicaciones...</p>
            ) : publicaciones.length === 0 ? (
                <p className="empty-state">{VACIO_POR_TAB[tab]}</p>
            ) : (
                <div className="legal-lista">
                    {publicaciones.map((pub) => (
                        <article className="legal-card" key={pub._id}>
                            <div className="legal-card-media">
                                {pub.imagenes && pub.imagenes.length > 0 ? (
                                    <img src={pub.imagenes[0]} alt={pub.titulo} />
                                ) : (
                                    <SinFoto />
                                )}
                            </div>
                            <div className="legal-card-info">
                                <h2 className="legal-card-titulo">{pub.titulo}</h2>
                                <p className="legal-card-direccion">{pub.direccion}</p>
                                <p className="legal-card-meta">
                                    {pub.moneda === 'ARS' ? 'AR$' : 'US$'} {Number(pub.precio || 0).toLocaleString('es-AR')}
                                    {pub.superficie ? ` · ${pub.superficie} m²` : ''}
                                    {pub.ambientes ? ` · ${pub.ambientes} amb.` : ''}
                                </p>
                                <p className="legal-card-agente">
                                    Agente: {pub.id_agente ? `${pub.id_agente.nombre} ${pub.id_agente.apellido}` : '—'}
                                </p>
                                {pub.descripcion && <p className="legal-card-descripcion">{pub.descripcion}</p>}

                                <div className="legal-card-docs">
                                    <span className="legal-card-docs-titulo">Documentación</span>
                                    <ListaDocumentos idPublicacion={pub._id} documentos={pub.documentos} />
                                </div>

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

                                <div className="legal-card-acciones">
                                    {tab === 'pendientes' && (
                                        <>
                                            <button type="button" className="btn btn-success" onClick={() => pedirConfirmacion('aprobar', pub)}>
                                                Aprobar
                                            </button>
                                            <button type="button" className="btn btn-warning" onClick={() => abrirObservar(pub)}>
                                                Observar
                                            </button>
                                        </>
                                    )}
                                    <button type="button" className="btn btn-outline btn-back" onClick={() => pedirConfirmacion('revertir', pub)}>
                                        {REVERSION_POR_TAB[tab].boton}
                                    </button>
                                    <button type="button" className="btn btn-outline btn-eliminar" onClick={() => pedirConfirmacion('eliminar', pub)}>
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {pubObservar && (
                <div className="legal-modal-overlay" onClick={cerrarObservar}>
                    <div className="legal-modal modal-panel" onClick={(e) => e.stopPropagation()}>
                        <h2 className="legal-titulo">Agregar observaciones</h2>
                        <p className="legal-subtitulo">{pubObservar.titulo}</p>
                        <form onSubmit={enviarObservacion}>
                            {errorModal && <p className="alert alert-error">{errorModal}</p>}
                            <div className="field">
                                <label htmlFor="obs-comentarios">Comentarios *</label>
                                <textarea
                                    id="obs-comentarios"
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
                    <div className="legal-modal modal-panel" onClick={(e) => e.stopPropagation()}>
                        <h2 className="legal-titulo">Comentarios</h2>
                        <p className="legal-subtitulo">{pubComentarios.titulo}</p>
                        <p className="legal-card-comentarios-completo">{pubComentarios.comentarios_legal}</p>
                        <div className="legal-acciones">
                            <button type="button" className="btn btn-primary" onClick={() => setPubComentarios(null)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmacion && (
                <ModalConfirmacion
                    {...confirmacion}
                    procesando={procesando}
                    error={errorAccion}
                    onConfirmar={ejecutarAccion}
                    onCancelar={() => setAccion(null)}
                />
            )}
        </LegalLayout>
    );
};

export default PublicacionesPendientes;
