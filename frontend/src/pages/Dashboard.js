import { useNavigate } from 'react-router-dom';
import AgentLayout from '../components/AgentLayout';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    const opciones = [
        {
            path: '/mis-publicaciones',
            titulo: 'Mis publicaciones',
            texto: 'Editá y gestioná tus propiedades activas y borradores'
        },
        {
            path: '/crear-publicacion',
            titulo: 'Agregar nueva propiedad',
            texto: 'Cargá una nueva propiedad al sistema'
        },
        {
            path: '/mis-turnos',
            titulo: 'Mis turnos',
            texto: 'Revisá y editá las visitas agendadas'
        }
    ];

    if (usuario?.rol === 'Administrador') {
        opciones.push({
            path: '/gestion-usuarios',
            titulo: 'Gestión de usuarios',
            texto: 'Altas, modificaciones y bajas de cuentas internas'
        });
    }

    return (
        <AgentLayout>
            <section className="dash-hero">
                <p className="dash-hero-kicker">Panel del {usuario?.rol === 'Administrador' ? 'administrador' : 'agente'}</p>
                <h1>Bienvenido, {usuario?.nombre}</h1>
                <p>Seleccioná una opción para comenzar a gestionar tu cartera.</p>
            </section>

            <div className="dashboard-cards">
                {opciones.map((opcion, index) => (
                    <button type="button" key={opcion.path} className="dash-card" onClick={() => navigate(opcion.path)}>
                        <span className="dash-card-num">{String(index + 1).padStart(2, '0')}</span>
                        <h2>{opcion.titulo}</h2>
                        <p>{opcion.texto}</p>
                        <span className="dash-card-ir">Ingresar</span>
                    </button>
                ))}
            </div>
        </AgentLayout>
    );
};

export default Dashboard;
