import { Navigate, useLocation } from 'react-router-dom';
import { haySesion, obtenerUsuario, panelDeRol } from '../utils/sesion';

// Protege una pantalla interna: sin sesión lleva al login y,
// si el rol no tiene permiso, lo devuelve a su propio panel.
const RutaProtegida = ({ roles, children }) => {
    const location = useLocation();

    if (!haySesion()) {
        return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
    }

    const { rol } = obtenerUsuario();
    if (roles && !roles.includes(rol)) {
        return <Navigate to={panelDeRol(rol)} replace />;
    }

    return children;
};

export default RutaProtegida;
