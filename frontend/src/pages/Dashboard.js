import { useNavigate } from 'react-router-dom';
import AgentLayout from '../components/AgentLayout';
import { BuildingIcon } from '../components/Icons';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    return (
        <AgentLayout>
            <section className="dash-hero">
                <h1>Bienvenido, {usuario?.nombre}</h1>
                <p>Seleccioná una opción para comenzar a gestionar tu cartera.</p>
            </section>

            <div className="dashboard-cards">
                <div className="dash-card" onClick={() => navigate('/mis-publicaciones')}>
                    <span className="dash-card-icono">
                        <BuildingIcon size={22} />
                    </span>
                    <h2>Mis publicaciones</h2>
                    <p>Editá y gestioná tus propiedades activas y borradores</p>
                </div>
                <div className="dash-card" onClick={() => navigate('/crear-publicacion')}>
                    <span className="dash-card-icono">+</span>
                    <h2>Agregar nueva propiedad</h2>
                    <p>Cargá una nueva propiedad al sistema</p>
                </div>
                <div className="dash-card" onClick={() => navigate('/mis-turnos')}>
                    <span className="dash-card-icono">◷</span>
                    <h2>Mis turnos</h2>
                    <p>Revisá y editá las visitas agendadas</p>
                </div>
                {usuario?.rol === 'Administrador' && (
                    <div className="dash-card" onClick={() => navigate('/gestion-usuarios')}>
                        <span className="dash-card-icono">👤</span>
                        <h2>Gestión de usuarios</h2>
                        <p>Altas, modificaciones y bajas de cuentas internas</p>
                    </div>
                )}
            </div>
        </AgentLayout>
    );
};

export default Dashboard;
