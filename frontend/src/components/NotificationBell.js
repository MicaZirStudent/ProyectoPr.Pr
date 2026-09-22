import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './NotificationBell.css';

const destinoDeTipo = (tipo, mensaje) => {
    const texto = `${tipo || ''} ${mensaje || ''}`.toLowerCase();
    if (texto.includes('turno')) return '/mis-turnos';
    if (texto.includes('revision') || texto.includes('revisión')) return '/legal/publicaciones';
    return '/mis-publicaciones';
};

const resumenPendientes = (pendientes) => {
    const texto = pendientes.map((n) => `${n.tipo || ''} ${n.mensaje || ''}`).join(' ').toLowerCase();
    const hayTurno = texto.includes('turno');
    const hayRevision = texto.includes('revision') || texto.includes('revisión');
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

const NotificationBell = () => {
    const navigate = useNavigate();
    const [abierto, setAbierto] = useState(false);
    const [avisoLogin, setAvisoLogin] = useState(false);
    const [avisoExtra, setAvisoExtra] = useState('');
    const [items, setItems] = useState([]);
    const caja = useRef(null);

    const auth = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const cargar = async () => {
        const token = localStorage.getItem('token');
        if (!token) return [];
        try {
            const respuesta = await axios.get('http://localhost:3001/api/notificaciones', auth());
            const lista = respuesta.data || [];
            setItems(lista);
            return lista;
        } catch {
            return [];
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
                    setAvisoLogin(true);
                    setAvisoExtra(resumen);
                    emitirAvisoNavegador('SOLUTION — aviso', resumen);
                }
            }
        };
        iniciar();
        const id = setInterval(cargar, 20000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const cerrar = (e) => {
            if (avisoLogin) return;
            if (caja.current && !caja.current.contains(e.target)) {
                setAbierto(false);
            }
        };
        document.addEventListener('mousedown', cerrar);
        return () => document.removeEventListener('mousedown', cerrar);
    }, [avisoLogin]);

    useEffect(() => {
        if (!avisoExtra) {
            return undefined;
        }
        const id = setTimeout(() => setAvisoExtra(''), 12000);
        return () => clearTimeout(id);
    }, [avisoExtra]);

    const noLeidas = items.filter((n) => !n.leida).length;
    const pendientes = items.filter((n) => !n.leida);

    const abrirUna = async (item) => {
        try {
            if (!item.leida) {
                await axios.patch(`http://localhost:3001/api/notificaciones/${item._id}/leer`, {}, auth());
                setItems((prev) => prev.map((n) => (n._id === item._id ? { ...n, leida: true } : n)));
            }
        } catch {
            /* igual navegamos */
        }
        setAvisoLogin(false);
        setAvisoExtra('');
        setAbierto(false);
        navigate(destinoDeTipo(item.tipo, item.mensaje));
    };

    const leerTodas = async () => {
        try {
            await axios.patch('http://localhost:3001/api/notificaciones/leer-todas', {}, auth());
            setItems((prev) => prev.map((n) => ({ ...n, leida: true })));
        } catch {
            /* noop */
        }
    };

    return (
        <div className="notif" ref={caja}>
            <button
                type="button"
                className="notif-btn"
                onClick={() => setAbierto((v) => !v)}
                aria-label="Notificaciones"
            >
                🔔
                {noLeidas > 0 && <span className="notif-badge">{noLeidas > 9 ? '9+' : noLeidas}</span>}
            </button>
            {abierto && !avisoLogin && (
                <div className="notif-panel">
                    <div className="notif-panel-head">
                        <strong>Notificaciones</strong>
                        {noLeidas > 0 && (
                            <button type="button" className="notif-leer" onClick={leerTodas}>
                                Marcar leídas
                            </button>
                        )}
                    </div>
                    {items.length === 0 ? (
                        <p className="notif-vacio">No hay avisos por ahora</p>
                    ) : (
                        <ul className="notif-lista">
                            {items.map((item) => (
                                <li key={item._id}>
                                    <button
                                        type="button"
                                        className={`notif-item ${item.leida ? '' : 'is-nueva'}`}
                                        onClick={() => abrirUna(item)}
                                    >
                                        <span>{item.mensaje}</span>
                                        <small>
                                            {item.fecha
                                                ? new Date(item.fecha).toLocaleString('es-AR', {
                                                    dateStyle: 'short',
                                                    timeStyle: 'short'
                                                })
                                                : ''}
                                        </small>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {avisoExtra && (
                <div className="notif-toast" role="status">
                    <strong>¡Atención!</strong>
                    <span>{avisoExtra}</span>
                    <button type="button" className="notif-toast-cerrar" onClick={() => setAvisoExtra('')}>
                        Cerrar
                    </button>
                </div>
            )}

            {avisoLogin && (
                <div className="notif-modal-fondo" role="dialog" aria-labelledby="notif-modal-titulo">
                    <div className="notif-modal">
                        <h2 id="notif-modal-titulo">Tenés avisos pendientes</h2>
                        <p className="notif-modal-intro">
                            {pendientes.length === 1
                                ? 'Hay 1 notificación nueva al ingresar.'
                                : `Hay ${pendientes.length} notificaciones nuevas al ingresar.`}
                        </p>
                        <ul className="notif-lista">
                            {pendientes.map((item) => (
                                <li key={item._id}>
                                    <button
                                        type="button"
                                        className="notif-item is-nueva"
                                        onClick={() => abrirUna(item)}
                                    >
                                        <span>{item.mensaje}</span>
                                        <small>
                                            {item.fecha
                                                ? new Date(item.fecha).toLocaleString('es-AR', {
                                                    dateStyle: 'short',
                                                    timeStyle: 'short'
                                                })
                                                : ''}
                                        </small>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="notif-modal-acciones">
                            <button type="button" className="btn btn-outline" onClick={() => setAvisoLogin(false)}>
                                Ver más tarde
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
