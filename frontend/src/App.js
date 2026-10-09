import { BrowserRouter, Routes, Route } from 'react-router-dom';

import RutaProtegida from './components/RutaProtegida';
import SesionActiva from './components/SesionActiva';
import { ROLES } from './utils/sesion';

import Login from './pages/Login';
import Catalogo from './pages/Catalogo';
import Dashboard from './pages/Dashboard';
import MisPublicaciones from './pages/MisPublicaciones';
import CrearPublicacion from './pages/CrearPublicacion';
import EditarPublicacion from './pages/EditarPublicacion';
import FichaPublicacion from './pages/FichaPublicacion';
import SolicitarTurno from './pages/SolicitarTurno';
import GestionarDisponibilidad from './pages/GestionarDisponibilidad';
import MisTurnos from './pages/MisTurnos';
import GestionUsuarios from './pages/GestionUsuarios';
import PublicacionesPendientes from './pages/legal/PublicacionesPendientes';
import RecuperarContrasena from './pages/RecuperarContrasena';
import RestablecerContrasena from './pages/RestablecerContrasena';

const { AGENTE, LEGAL, ADMIN } = ROLES;

// Envuelve una pantalla interna con el control de sesión y de roles
const protegida = (elemento, roles) => <RutaProtegida roles={roles}>{elemento}</RutaProtegida>;

const App = () => {
    return (
        <BrowserRouter>
            <SesionActiva />
            <Routes>
                {/* Públicas: catálogo, ficha y solicitud de turno (el cliente no inicia sesión) */}
                <Route path="/" element={<Catalogo />} />
                <Route path="/catalogo" element={<Catalogo />} />
                <Route path="/propiedad/:id" element={<FichaPublicacion />} />
                <Route path="/propiedad/:id/solicitar-turno" element={<SolicitarTurno />} />

                {/* Acceso */}
                <Route path="/login" element={<Login />} />
                <Route path="/recuperar" element={<RecuperarContrasena />} />
                <Route path="/restablecer/:token" element={<RestablecerContrasena />} />

                {/* Agente y Administrador */}
                <Route path="/dashboard" element={protegida(<Dashboard />, [AGENTE, ADMIN])} />
                <Route path="/mis-publicaciones" element={protegida(<MisPublicaciones />, [AGENTE, ADMIN])} />
                <Route path="/editar-publicacion/:id" element={protegida(<EditarPublicacion />, [AGENTE, ADMIN])} />

                {/* Solo Agente: cargar propiedades y gestionar turnos */}
                <Route path="/crear-publicacion" element={protegida(<CrearPublicacion />, [AGENTE])} />
                <Route path="/gestionar-disponibilidad/:id" element={protegida(<GestionarDisponibilidad />, [AGENTE])} />
                <Route path="/mis-turnos" element={protegida(<MisTurnos />, [AGENTE])} />

                {/* Solo Administrador */}
                <Route path="/gestion-usuarios" element={protegida(<GestionUsuarios />, [ADMIN])} />

                {/* Área Legal: revisión, aprobación, observación, reversión y baja de publicaciones */}
                <Route path="/legal/publicaciones" element={protegida(<PublicacionesPendientes />, [LEGAL])} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
