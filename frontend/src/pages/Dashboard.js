import { useNavigate } from 'react-router-dom';
import AgentLayout from '../components/AgentLayout';
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
                    <span className="dash-card-icono">▣</span>
                    <h2>Mis publicaciones</h2>
                    <p>Editá y gestioná tus propiedades activas y borradores</p>
                </div>
                <div className="dash-card" onClick={() => navigate('/crear-publicacion')}>
                    <span className="dash-card-icono">+</span>
                    <h2>Agregar nueva propiedad</h2>
                    <p>Cargá una nueva propiedad al sistema</p>
                </div>
                <div className="dash-card is-static">
                    <span className="dash-card-icono">◷</span>
                    <h2>Mis turnos</h2>
                    <p>Revisá las visitas agendadas</p>
                </div>
            </div>
        </AgentLayout>
    );
};

export default Dashboard;
