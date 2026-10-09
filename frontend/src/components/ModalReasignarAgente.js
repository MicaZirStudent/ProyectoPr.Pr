import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/http';
import { ROLES, encabezadoAuth } from '../utils/sesion';

// Diálogo del administrador para asignar una publicación a otro agente activo
const ModalReasignarAgente = ({ publicacion, onCancelar, onReasignada }) => {
    const idActual = String(publicacion.id_agente?._id || publicacion.id_agente || '');
    const nombreActual = publicacion.id_agente?.nombre
        ? `${publicacion.id_agente.nombre} ${publicacion.id_agente.apellido}`
        : 'Sin agente';

    const [agentes, setAgentes] = useState([]);
    const [seleccion, setSeleccion] = useState('');
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargar = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/api/usuarios`, encabezadoAuth());
                setAgentes(data.filter((u) => u.rol === ROLES.AGENTE && u.estado === 'Activo' && String(u._id) !== idActual));
            } catch (err) {
                setError(err.response?.data?.mensaje || 'No se pudieron cargar los agentes');
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [idActual]);

    useEffect(() => {
        const conEscape = (e) => {
            if (e.key === 'Escape' && !guardando) onCancelar();
        };
        window.addEventListener('keydown', conEscape);
        return () => window.removeEventListener('keydown', conEscape);
    }, [onCancelar, guardando]);

    const reasignar = async (e) => {
        e.preventDefault();
        if (!seleccion) {
            setError('Seleccioná el agente al que vas a asignar la publicación');
            return;
        }
        setGuardando(true);
        setError('');
        try {
            const { data } = await axios.patch(
                `${API_URL}/api/publicaciones/${publicacion._id}/reasignar`,
                { idAgente: seleccion },
                encabezadoAuth()
            );
            await onReasignada(data.mensaje);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'No se pudo reasignar la publicación');
            setGuardando(false);
        }
    };

    return (
        <div className="confirm-fondo" onClick={() => !guardando && onCancelar()}>
            <form
                className="confirm-modal modal-panel"
                role="dialog"
                aria-labelledby="reasignar-titulo"
                onClick={(e) => e.stopPropagation()}
                onSubmit={reasignar}
            >
                <h2 id="reasignar-titulo">Cambiar agente</h2>
                <p className="confirm-mensaje">
                    El agente nuevo recibirá un aviso de asignación y el actual, un aviso de baja.
                </p>
                <p className="confirm-detalle">
                    {publicacion.titulo} · Agente actual: {nombreActual}
                </p>

                {cargando ? (
                    <p className="confirm-mensaje">Cargando agentes...</p>
                ) : agentes.length === 0 ? (
                    <p className="alert alert-error">No hay otros agentes activos para asignar.</p>
                ) : (
                    <div className="field">
                        <label htmlFor="reasignar-agente">Nuevo agente *</label>
                        <select
                            id="reasignar-agente"
                            value={seleccion}
                            onChange={(e) => { setSeleccion(e.target.value); setError(''); }}
                        >
                            <option value="">Seleccioná un agente</option>
                            {agentes.map((agente) => (
                                <option key={agente._id} value={agente._id}>
                                    {agente.nombre} {agente.apellido} — {agente.email}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {error && <p className="alert alert-error" role="alert">{error}</p>}

                <div className="confirm-acciones">
                    <button type="button" className="btn btn-outline" onClick={onCancelar} disabled={guardando}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={guardando || cargando || agentes.length === 0}>
                        {guardando ? 'Reasignando...' : 'Reasignar'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ModalReasignarAgente;
