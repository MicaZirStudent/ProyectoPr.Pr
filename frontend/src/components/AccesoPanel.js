import { useNavigate } from 'react-router-dom';
import { haySesion, obtenerUsuario, panelDeRol } from '../utils/sesion';

// Botón del encabezado público: con sesión iniciada lleva al panel (sin cerrar la sesión),
// sin sesión lleva al login.
const AccesoPanel = ({ destino }) => {
    const navigate = useNavigate();

    if (!haySesion()) {
        return (
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/login')}>
                Iniciar sesión
            </button>
        );
    }

    return (
        <button
            type="button"
            className="btn btn-ghost btn-back"
            onClick={() => navigate(destino || panelDeRol(obtenerUsuario().rol))}
        >
            Volver al panel
        </button>
    );
};

export default AccesoPanel;
