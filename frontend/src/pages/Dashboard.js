import { useNavigate } from 'react-router-dom';
import AgentLayout from '../components/AgentLayout';
import { ROLES, obtenerUsuario } from '../utils/sesion';
import './Dashboard.css';

const OPCIONES_POR_ROL = {
    [ROLES.AGENTE]: [
        {
            path: '/mis-publicaciones',
            titulo: 'Mis publicaciones',
            texto: 'Editá y gestioná tus propiedades activas y borradores'
        },
        {
            path: '/crear-publicacion',
            titulo: 'Agregar nueva propiedad',
            texto: 'Cargá una nueva propiedad con sus fotos y documentación'
        },
        {
            path: '/mis-turnos',
            titulo: 'Mis turnos',
            texto: 'Revisá y editá las visitas agendadas'
        }
    ],
    [ROLES.ADMIN]: [
        {
            path: '/mis-publicaciones',
            titulo: 'Publicaciones',
            texto: 'Consultá y editá todas las publicaciones, en cualquier estado'
        },
        {
            path: '/gestion-usuarios',
            titulo: 'Gestión de usuarios',
            texto: 'Altas, modificaciones y bajas de cuentas internas'
        }
    ]
};

const Dashboard = () => {
    const navigate = useNavigate();
    const usuario = obtenerUsuario();
    const esAdmin = usuario?.rol === ROLES.ADMIN;
    const opciones = OPCIONES_POR_ROL[usuario?.rol] || OPCIONES_POR_ROL[ROLES.AGENTE];

    return (
        <AgentLayout>
            <section className="dash-hero">
                <p className="dash-hero-kicker">{esAdmin ? 'Panel de administración' : 'Panel del agente'}</p>
                <h1>Bienvenido, {usuario?.nombre}</h1>
                <p>Seleccioná una opción para comenzar a gestionar {esAdmin ? 'el sistema' : 'tu cartera'}.</p>
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
