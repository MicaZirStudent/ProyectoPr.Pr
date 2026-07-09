import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.jpg';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    const cerrarSesion = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/');
    };

    return (
        <div className="dashboard-wrap">
            {/* Navbar */}
            <nav className="dashboard-nav">
                <img src={logo} alt="Solution logo" className="nav-logo" />
                <div className="nav-info">
                    <span className="nav-nombre">{usuario?.nombre} {usuario?.apellido}</span>
                    <span className="nav-rol">{usuario?.rol}</span>
                </div>
                <button className="nav-btn-cerrar" onClick={cerrarSesion}>Cerrar sesión</button>
            </nav>

            {/* Contenido */}
            <main className="dashboard-main">
                <h1 className="dashboard-titulo">Bienvenido, {usuario?.nombre}!</h1>
                <p className="dashboard-subtitulo">Seleccioná una opción para comenzar</p>

                <div className="dashboard-cards">
                    <div className="dash-card">
                        <span className="dash-card-icono">🏠</span>
                        <h2>Mis publicaciones</h2>
                        <p>Gestioná tus propiedades activas y borradores</p>
                    </div>
                    <div className="dash-card">
                        <span className="dash-card-icono">📋</span>
                        <h2>Nueva publicación</h2>
                        <p>Cargá una nueva propiedad al sistema</p>
                    </div>
                    <div className="dash-card">
                        <span className="dash-card-icono">📅</span>
                        <h2>Mis turnos</h2>
                        <p>Revisá las visitas agendadas</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;