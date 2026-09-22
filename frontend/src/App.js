// Importamos el sistema de rutas de react-router-dom
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importamos todas las pantallas
import Login from './pages/Login';
import Catalogo from './pages/Catalogo';
import Dashboard from './pages/Dashboard';
import MisPublicaciones from './pages/MisPublicaciones';
import CrearPublicacion from './pages/CrearPublicacion';
import EditarPublicacion from './pages/EditarPublicacion';
import FichaPublicacion from './pages/FichaPublicacion';
import SolicitarTurno from './pages/SolicitarTurno';
import GestionarDisponibilidad from './pages/GestionarDisponibilidad';
import GestionUsuarios from './pages/GestionUsuarios';
import PublicacionesPendientes from './pages/legal/PublicacionesPendientes';
import RecuperarContrasena from './pages/RecuperarContrasena';
import RestablecerContrasena from './pages/RestablecerContrasena';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Catálogo público de propiedades — página de inicio (sin login) */}
                <Route path="/" element={<Catalogo />} />
                <Route path="/catalogo" element={<Catalogo />} />

                {/* Pantalla de login */}
                <Route path="/login" element={<Login />} />
                <Route path="/recuperar" element={<RecuperarContrasena />} />
                <Route path="/restablecer/:token" element={<RestablecerContrasena />} />

                {/* Dashboard principal */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Mis publicaciones */}
                <Route path="/mis-publicaciones" element={<MisPublicaciones />} />

                {/* Crear publicación */}
                <Route path="/crear-publicacion" element={<CrearPublicacion />} />

                {/* Editar publicación — el :id es dinámico, cambia según la publicación */}
                <Route path="/editar-publicacion/:id" element={<EditarPublicacion />} />

                {/* Ficha pública de una propiedad publicada (el cliente no inicia sesión) */}
                <Route path="/propiedad/:id" element={<FichaPublicacion />} />

                {/* Formulario CU-09: solicitar turno de visita */}
                <Route path="/propiedad/:id/solicitar-turno" element={<SolicitarTurno />} />
                <Route path="/gestionar-disponibilidad/:id" element={<GestionarDisponibilidad />} />
                <Route path="/gestion-usuarios" element={<GestionUsuarios />} />

                {/* Panel Área Legal: revisión, aprobación y observación de publicaciones */}
                <Route path="/legal/publicaciones" element={<PublicacionesPendientes />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;