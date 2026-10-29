import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './NotificationBell.css';
import { API_URL } from '../utils/http';
import { encabezadoAuth, haySesion } from '../utils/sesion';
import { createPortal } from 'react-dom';

// Las notificaciones viejas no tienen "tipo": lo deducimos del mensaje
const tipoDe = (item) => {
    if (item.tipo) return item.tipo;
    const texto = String(item.mensaje || '').toLowerCase();
    if (texto.includes('turno')) return 'turno';
    if (texto.includes('se te asignó')) return 'asignada';
    if (texto.includes('se te dio de baja')) return 'desasignada';
    if (texto.includes('eliminó') || texto.includes('dio de baja')) return 'eliminada';
    if (texto.includes('devolvió') || texto.includes('volvió a quedar')) return 'devuelta';
    if (texto.includes('aprobada')) return 'aprobada';
    if (texto.includes('observaciones')) return 'observada';
    if (texto.includes('revision') || texto.includes('revisión')) return 'revision';
    return 'aviso';
};

const ETIQUETAS = {
    turno: 'Turno',
    revision: 'Revisión',
    aprobada: 'Aprobada',
    observada: 'Observada',
    devuelta: 'Devuelta',
    eliminada: 'Eliminada',
    asignada: 'Asignada',
    desasignada: 'Reasignada',
    aviso: 'Aviso'
};

const destinoDeTipo = (tipo) => {
    if (tipo === 'turno') return '/mis-turnos';
    if (tipo === 'revision') return '/legal/publicaciones';
    return '/mis-publicaciones';
};

const formatearFecha = (fecha) => (fecha
    ? new Date(fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
    : '');

const resumenPendientes = (pendientes) => {
    const tipos = pendientes.map(tipoDe);
    const hayTurno = tipos.includes('turno');
    const hayRevision = tipos.includes('revision');
    if (hayTurno && hayRevision) {
        return 'Hay turnos nuevos y publicaciones pendientes de revisión.';
    }
    if (hayTurno) {
        return 'Te solicitaron un turno de visita. Revisalo en Mis turnos.';
    }
    if (hayRevision) {
        return 'Hay publicaciones pendientes de revisión en Área Legal.';
    }
    if (pendientes.length === 1) {
        return pendientes[0].mensaje;
    }
    return `Tenés ${pendientes.length} avisos pendientes.`;
};

const emitirAvisoNavegador = (titulo, cuerpo) => {
    if (typeof Notification === 'undefined') {
        return;
    }
    const mostrar = () => {
        try {
            new Notification(titulo, { body: cuerpo });
        } catch {
            /* algunos navegadores bloquean esto sin HTTPS */
        }
    };
    if (Notification.permission === 'granted') {
        mostrar();
        return;
    }
    if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permiso) => {
            if (permiso === 'granted') {
                mostrar();
            }
        });
    }
};

const ItemNotificacion = ({ item, esNueva, onAbrir }) => {
    const tipo = tipoDe(item);
    return (
        <li>
            <button
                type="button"
                className={`notif-item notif-${tipo} ${esNueva ? 'is-nueva' : ''}`}
                onClick={() => onAbrir(item)}
            >
                <span className="notif-item-head">
                    <span className="notif-tipo">{ETIQUETAS[tipo]}</span>
                    {esNueva && <span className="notif-nueva">Nueva</span>}
                    <small>{formatearFecha(item.fecha)}</small>
                </span>
                <span className="notif-mensaje">{item.mensaje}</span>
                <span className="notif-ir">Ver detalle</span>
            </button>
        </li>
    );
};

const NotificationBell = () => {
    const navigate = useNavigate();
    const [abierto, setAbierto] = useState(false);
    const [avisoLogin, setAvisoLogin] = useState(false);
    const [avisoExtra, setAvisoExtra] = useState('');
    const [items, setItems] = useState([]);
    // Ids que estaban sin leer al momento de abrir: se resaltan aunque ya se marcaron como leídas
    const [recienLeidas, setRecienLeidas] = useState([]);
    const [itemsLogin, setItemsLogin] = useState([]);
    const caja = useRef(null);

    // Consulta periódica: no extiende la sesión (eso lo hace la navegación del usuario)
    const cargar = async () => {
        if (!haySesion()) return [];
        try {
            const respuesta = await axios.get(`${API_URL}/api/notificaciones`, {
                headers: { ...encabezadoAuth().headers, 'X-Sin-Renovar': '1' }
            });
            const lista = respuesta.data || [];
            setItems(lista);
            return lista;
        } catch {
            return [];
        }
    };

    // Abrir las notificaciones = leerlas: se marcan en el servidor y se actualiza el contador
    const marcarComoLeidas = async (lista) => {
        const ids = lista.filter((n) => !n.leida).map((n) => n._id);
        if (ids.length === 0) return;
        setItems((prev) => prev.map((n) => (ids.includes(n._id) ? { ...n, leida: true } : n)));
        try {
            await axios.patch(`${API_URL}/api/notificaciones/leer-todas`, {}, encabezadoAuth());
        } catch {
            /* si falla, el próximo refresco vuelve a traer el estado real */
        }
    };

    useEffect(() => {
        const iniciar = async () => {
            const lista = await cargar();
            const venirDeLogin = sessionStorage.getItem('mostrarAvisosLogin') === '1';
            if (venirDeLogin) {
                sessionStorage.removeItem('mostrarAvisosLogin');
                const pendientesLogin = lista.filter((n) => !n.leida);
                if (pendientesLogin.length > 0) {
                    const resumen = resumenPendientes(pendientesLogin);
                    setItemsLogin(pendientesLogin);
                    setAvisoLogin(true);
                    setAvisoExtra(resumen);
                    emitirAvisoNavegador('SOLUTION — aviso', resumen);
                    marcarComoLeidas(pendientesLogin);
                }
            }
        };
        iniciar();
        const id = setInterval(cargar, 20000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const cerrar = (e) => {
            if (avisoLogin) return;
            if (caja.current && !caja.current.contains(e.target)) {
                setAbierto(false);
            }
        };
        const conEscape = (e) => {
            if (e.key === 'Escape') setAbierto(false);
        };
        document.addEventListener('mousedown', cerrar);
        document.addEventListener('keydown', conEscape);
        return () => {
            document.removeEventListener('mousedown', cerrar);
            document.removeEventListener('keydown', conEscape);
        };
    }, [avisoLogin]);

    useEffect(() => {
        if (!avisoExtra) {
            return undefined;
        }
        const id = setTimeout(() => setAvisoExtra(''), 12000);
        return () => clearTimeout(id);
    }, [avisoExtra]);

    const noLeidas = items.filter((n) => !n.leida).length;

    const alternarPanel = () => {
        if (abierto) {
            setAbierto(false);
            return;
        }
        setRecienLeidas(items.filter((n) => !n.leida).map((n) => n._id));
        setAbierto(true);
        marcarComoLeidas(items);
    };

    const abrirUna = async (item) => {
        if (!item.leida) {
            setItems((prev) => prev.map((n) => (n._id === item._id ? { ...n, leida: true } : n)));
            try {
                await axios.patch(`${API_URL}/api/notificaciones/${item._id}/leer`, {}, encabezadoAuth());
            } catch {
                /* igual navegamos */
            }
        }
        setAvisoLogin(false);
        setAvisoExtra('');
        setAbierto(false);
        navigate(destinoDeTipo(tipoDe(item)));
    };

    return (
        <div className="notif" ref={caja}>
            <button
                type="button"
                className={`notif-btn ${noLeidas > 0 ? 'tiene-nuevas' : ''} ${abierto ? 'is-open' : ''}`}
                onClick={alternarPanel}
                aria-expanded={abierto}
                aria-label={noLeidas > 0 ? `Avisos, ${noLeidas} sin leer` : 'Avisos'}
            >
                <span>Avisos</span>
                <span className="notif-badge">{noLeidas > 9 ? '9+' : noLeidas}</span>
            </button>
            {abierto && !avisoLogin && (
                <div className="notif-panel" role="dialog" aria-label="Avisos">
                    <div className="notif-panel-head">
                        <strong>Avisos</strong>
                        <span>
                            {recienLeidas.length > 0
                                ? `${recienLeidas.length} nuevo${recienLeidas.length === 1 ? '' : 's'}`
                                : 'Todo al día'}
                        </span>
                    </div>
                    {items.length === 0 ? (
                        <p className="notif-vacio">No hay avisos por ahora</p>
                    ) : (
                        <ul className="notif-lista">
                            {items.map((item) => (
                                <ItemNotificacion
                                    key={item._id}
                                    item={item}
                                    esNueva={recienLeidas.includes(item._id) || !item.leida}
                                    onAbrir={abrirUna}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            )}

                        {avisoExtra && !avisoLogin && createPortal(
                <div className="notif-toast" role="status">
                    <strong>Atención</strong>
                    <span>{avisoExtra}</span>
                    <button type="button" className="notif-toast-cerrar" onClick={() => setAvisoExtra('')}>
                        Cerrar
                    </button>
                </div>,
                document.body
            )}

                        {avisoLogin && createPortal(
                <div className="notif-modal-fondo" role="dialog" aria-labelledby="notif-modal-titulo">
                    <div className="notif-modal modal-panel">
                        <h2 id="notif-modal-titulo">Tenés avisos nuevos</h2>
                        <p className="notif-modal-intro">
                            {itemsLogin.length === 1
                                ? 'Llegó 1 notificación mientras no estabas.'
                                : `Llegaron ${itemsLogin.length} notificaciones mientras no estabas.`}
                        </p>
                        <ul className="notif-lista">
                            {itemsLogin.map((item) => (
                                <ItemNotificacion key={item._id} item={item} esNueva onAbrir={abrirUna} />
                            ))}
                        </ul>
                        <div className="notif-modal-acciones">
                            <button
                                type="button"
                                className="btn btn-navy"
                                onClick={() => { setAvisoLogin(false); setAvisoExtra(''); }}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default NotificationBell;