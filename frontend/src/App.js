// Importamos el sistema de rutas de react-router-dom
// BrowserRouter envuelve toda la app, Routes agrupa las rutas, Route define cada una
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importamos las pantallas que creamos
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const App = () => {
    return (
        // BrowserRouter habilita la navegación entre pantallas
        <BrowserRouter>
            <Routes>
                {/* Cuando el usuario entra a "/" muestra el Login */}
                <Route path="/" element={<Login />} />

                {/* Cuando el usuario entra a "/dashboard" muestra el Dashboard */}
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;