// Importamos el sistema de rutas de react-router-dom
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importamos todas las pantallas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MisPublicaciones from './pages/MisPublicaciones';
import CrearPublicacion from './pages/CrearPublicacion';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Pantalla de login */}
                <Route path="/" element={<Login />} />

                {/* Dashboard principal */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Mis publicaciones */}
                <Route path="/mis-publicaciones" element={<MisPublicaciones />} />

                {/* Crear publicación */}
                <Route path="/crear-publicacion" element={<CrearPublicacion />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;