import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Brand from '../components/Brand';
import './Login.css';

const RestablecerContrasena = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [guardando, setGuardando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');

        if (password !== confirmar) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setGuardando(true);
        try {
            const respuesta = await axios.post('http://localhost:3001/api/auth/restablecer', {
                token,
                password,
                confirmarPassword: confirmar
            });
            setExito(respuesta.data.mensaje);
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'El enlace no es válido, expiró o ya fue utilizado');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="login-wrap">
            <section className="login-panel" style={{ gridColumn: '1 / -1' }}>
                <div className="login-card">
                    <Brand compact />
                    <h1 className="login-title">Nueva contraseña</h1>
                    <p className="login-subtitle">Elegí una contraseña y confirmala</p>
                    {error && <p className="alert alert-error">{error}</p>}
                    {exito && <p className="alert alert-ok">{exito}</p>}
                    <form onSubmit={handleSubmit}>
                        <div className="field">
                            <label>Nueva contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="field">
                            <label>Confirmar contraseña</label>
                            <input
                                type="password"
                                value={confirmar}
                                onChange={(e) => setConfirmar(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={guardando || !!exito}>
                            {guardando ? 'Actualizando...' : 'Actualizar contraseña'}
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

export default RestablecerContrasena;
