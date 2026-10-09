import { useState } from 'react';
import axios from 'axios';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Brand from '../components/Brand';
import logoLight from '../assets/brand/solution-logo-light.png';
import { API_URL } from '../utils/http';
import { guardarSesion, haySesion, obtenerUsuario, panelDeRol } from '../utils/sesion';
import './Login.css';

const Login = () => {
    const [correo, setCorreo] = useState('');
    const [contraseña, setContraseña] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [params] = useSearchParams();
    const sesionExpirada = params.get('sesion') === 'expirada';

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const respuesta = await axios.post(`${API_URL}/api/auth/login`, {
                email: correo.trim().toLowerCase(),
                password: contraseña
            });
            const { token, usuario } = respuesta.data;
            guardarSesion(token, usuario);
            sessionStorage.setItem('mostrarAvisosLogin', '1');
            if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                Notification.requestPermission();
            }
            // Si venía de una pantalla protegida, vuelve a ella; si no, a su panel
            navigate(location.state?.desde || panelDeRol(usuario.rol), { replace: true });
        } catch (error) {
            if (!error.response) {
                setError('No se pudo conectar con el servidor. ¿Está el backend en marcha?');
            } else if (error.response.status === 500) {
                setError('Error del servidor o de la base de datos. Revisá la terminal del backend.');
            } else {
                setError('Usuario o contraseña incorrectos');
            }
        }
    };

    // Con la sesión iniciada no tiene sentido volver a loguearse
    if (haySesion()) {
        return <Navigate to={panelDeRol(obtenerUsuario().rol)} replace />;
    }

    return (
        <div className="login-wrap">
            <section className="login-hero">
                <img className="login-hero-logo" src={logoLight} alt="SOLUTION" />
                <div className="login-hero-copy">
                    <p className="login-hero-kicker">Panel interno</p>
                    <h2>Cada propiedad, bajo control.</h2>
                    <p>Publicaciones, revisiones legales y visitas en un solo lugar.</p>
                </div>
            </section>

            <section className="login-panel">
                <div className="login-card">
                    <Brand compact onLight />
                    <h1 className="login-title">Iniciar sesión</h1>
                    <p className="login-subtitle">Ingresá con tu cuenta institucional</p>
                    {sesionExpirada && !error && (
                        <p className="alert alert-error">Tu sesión expiró por inactividad. Ingresá nuevamente.</p>
                    )}
                    {error && <p className="alert alert-error">{error}</p>}
                    <form onSubmit={handleLogin}>
                        <div className="field">
                            <label>Correo electrónico</label>
                            <input
                                type="email"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                placeholder="nombre@solution.com"
                                required
                            />
                        </div>
                        <div className="field">
                            <label>Contraseña</label>
                            <input
                                type="password"
                                value={contraseña}
                                onChange={(e) => setContraseña(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <Link className="login-forgot" to="/recuperar">¿Olvidaste tu contraseña?</Link>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Ingresar</button>
                    </form>
                    <button
                        type="button"
                        className="btn btn-outline btn-back"
                        style={{ width: '100%', marginTop: '0.9rem' }}
                        onClick={() => navigate('/')}
                    >
                        Volver al catálogo
                    </button>
                    <p className="login-footer">Sistema de gestión inmobiliaria — uso interno</p>
                </div>
            </section>
        </div>
    );
};

export default Login;