// Importamos useNavigate para poder redirigir al usuario
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {

    const navigate = useNavigate();

    // Recuperamos los datos del usuario que guardamos en localStorage al hacer login
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    // Función para cerrar sesión
    const cerrarSesion = () => {
        // Borramos el token y los datos del usuario del localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');

        // Redirigimos al login
        navigate('/');
    };

    return (
        <div>
            <h1>Bienvenido, {usuario?.nombre} {usuario?.apellido}</h1>
            <p>Rol: {usuario?.rol}</p>
            <button onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
    );
};

export default Dashboard;