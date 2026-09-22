import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Brand from '../components/Brand';
import './Login.css';

const RecuperarContrasena = () => {
    const [email, setEmail] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [enviando, setEnviando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEnviando(true);
        setMensaje('');
        try {
            const respuesta = await axios.post('http://localhost:3001/api/auth/recuperar', {
                email: email.trim()
            });
            setMensaje(respuesta.data.mensaje);
        } catch (error) {
            setMensaje('Si el correo ingresado está registrado, recibirás un enlace de restablecimiento en breve');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="login-wrap">
            <section className="login-panel" style={{ gridColumn: '1 / -1' }}>
                <div className="login-card">
                    <Brand compact />
                    <h1 className="login-title">Recuperar contraseña</h1>
                    <p className="login-subtitle">Ingresá el correo de tu cuenta interna</p>
                    {mensaje && <p className="alert alert-ok">{mensaje}</p>}
                    <form onSubmit={handleSubmit}>
                        <div className="field">
                            <label>Correo electrónico</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nombre@solution.com"
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={enviando}>
                            {enviando ? 'Enviando...' : 'Enviar'}
                        </button>
                    </form>
                    <p className="login-footer">
                        <Link to="/login">Volver al inicio de sesión</Link>
                    </p>
                </div>
            </section>
        </div>
    );
};

export default RecuperarContrasena;
