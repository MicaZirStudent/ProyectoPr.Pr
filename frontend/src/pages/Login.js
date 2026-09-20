import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';
import { SquareIcon } from '../components/Icons';
import './Login.css';

const Login = () => {
    const [correo, setCorreo] = useState('');
    const [contraseña, setContraseña] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const respuesta = await axios.post('http://localhost:3001/api/auth/login', {
                email: correo,
                password: contraseña
            });
            localStorage.setItem('token', respuesta.data.token);
            localStorage.setItem('usuario', JSON.stringify(respuesta.data.usuario));
            if (respuesta.data.usuario?.rol === 'Area legal') {
                navigate('/legal/publicaciones');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            setError('Usuario o contraseña incorrectos');
        }
    };

    return (
        <div className="login-wrap">
            <section className="login-hero">
                <span className="login-hero-mark" aria-hidden="true">
                    <SquareIcon size={28} stroke={1.7} />
                </span>
                <div className="login-hero-copy">
                    <h2>Gestión de Propiedades</h2>
                    <p>Accedé al panel interno de SOLUTION para administrar publicaciones, revisiones y visitas.</p>
                </div>
            </section>

            <section className="login-panel">
                <div className="login-card">
                    <Brand compact />
                    <h1 className="login-title">Iniciar sesión</h1>
                    <p className="login-subtitle">Ingresá con tu cuenta institucional</p>
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
                        <a className="login-forgot" href="/recuperar">¿Olvidaste tu contraseña?</a>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Ingresar</button>
                    </form>
                    <button
                        type="button"
                        className="btn btn-outline"
                        style={{ width: '100%', marginTop: '0.9rem' }}
                        onClick={() => navigate('/')}
                    >
                        ← Volver al catálogo
                    </button>
                    <p className="login-footer">Sistema de gestión inmobiliaria — uso interno</p>
                </div>
            </section>
        </div>
    );
};

export default Login;