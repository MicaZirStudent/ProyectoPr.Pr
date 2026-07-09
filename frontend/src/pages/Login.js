// Importamos useState para manejar los campos del formulario
import { useState } from 'react';

// Importamos axios para hablarle al backend
import axios from 'axios';

// Importamos useNavigate para redirigir después del login
import { useNavigate } from 'react-router-dom';

// Importamos el logo
import logo from '../assets/logo.jpg';

// Importamos los estilos
import './Login.css';

const Login = () => {
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const respuesta = await axios.post('http://localhost:3001/api/auth/login', {
                correoElectronico: correo,
                contrasena: contrasena
            });
            localStorage.setItem('token', respuesta.data.token);
            localStorage.setItem('usuario', JSON.stringify(respuesta.data.usuario));
            navigate('/dashboard');
        } catch (error) {
            setError('Usuario o contraseña incorrectos');
        }
    };

    return (
        <div className="login-wrap">
            <div className="login-card">
                <div className="login-logo-area">
                    <img src={logo} alt="Solution logo" className="login-logo-img" />
                </div>
                <h1 className="login-title">Iniciar sesión</h1>
                <p className="login-subtitle">Ingresá con tu cuenta institucional</p>
                {error && <p className="login-error">{error}</p>}
                <form onSubmit={handleLogin}>
                    <div className="login-field">
                        <label>Correo electrónico</label>
                        <input
                            type="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            placeholder="nombre@solution.com"
                            required
                        />
                    </div>
                    <div className="login-field">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <a className="login-forgot" href="/recuperar">¿Olvidaste tu contraseña?</a>
                    <button type="submit" className="login-btn">Ingresar</button>
                </form>
                <p className="login-footer">Sistema de gestión inmobiliaria — uso interno</p>
            </div>
        </div>
    );
};

export default Login;