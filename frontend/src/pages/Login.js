// Importamos useState, un "hook" de React que nos permite guardar datos que cambian
// Por ejemplo, lo que el usuario va escribiendo en los campos del formulario
import { useState } from 'react';

// Importamos axios, la librería que usamos para hablarle al backend
import axios from 'axios';

// Importamos useNavigate, que nos permite redirigir al usuario a otra pantalla
import { useNavigate } from 'react-router-dom';

// Definimos el componente Login, que es básicamente una función que devuelve HTML
const Login = () => {

    // Creamos dos "estados": uno para el email y otro para la contraseña
    // Cada vez que el usuario escribe algo, el estado se actualiza automáticamente
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');

    // Estado para mostrar mensajes de error si el login falla
    const [error, setError] = useState('');

    // Hook que nos permite navegar a otra pantalla después del login exitoso
    const navigate = useNavigate();

    // Función que se ejecuta cuando el usuario presiona "Ingresar"
    const handleLogin = async (e) => {

        // Evitamos que el formulario recargue la página (comportamiento por defecto del HTML)
        e.preventDefault();

        try {
            // Le mandamos los datos al backend usando axios
            // Esto es equivalente a lo que probamos en Thunder Client
            const respuesta = await axios.post('http://localhost:3001/api/auth/login', {
                correoElectronico: correo,
                contrasena: contrasena
            });

            // Si el login fue exitoso, guardamos el token en localStorage
            // Así lo podemos usar en las próximas peticiones sin pedir login de nuevo
            localStorage.setItem('token', respuesta.data.token);

            // También guardamos los datos básicos del usuario
            localStorage.setItem('usuario', JSON.stringify(respuesta.data.usuario));

            // Redirigimos al dashboard (lo creamos después)
            navigate('/dashboard');

        } catch (error) {
            // Si el backend respondió con error, mostramos el mensaje
            setError('Usuario o contraseña incorrectos');
        }
    };

    // Lo que el componente muestra en pantalla
    return (
        <div>
            <h1>RE/MAX — Iniciar Sesión</h1>

            {/* Si hay un error, lo mostramos en rojo */}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* Formulario de login */}
            <form onSubmit={handleLogin}>

                <div>
                    <label>Usuario (Email):</label>
                    {/* Cada vez que el usuario escribe, actualizamos el estado "correo" */}
                    <input
                        type="email"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        placeholder="Ingresá tu correo"
                        required
                    />
                </div>

                <div>
                    <label>Contraseña:</label>
                    {/* Igual pero para la contraseña */}
                    <input
                        type="password"
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        placeholder="Ingresá tu contraseña"
                        required
                    />
                </div>

                {/* Enlace para recuperar contraseña (CU-12, lo conectamos después) */}
                <p>¿Olvidaste tu contraseña? <a href="/recuperar">Hacé clic acá</a></p>

                <button type="submit">Ingresar</button>

            </form>
        </div>
    );
};

// Exportamos el componente para poder usarlo en App.js
export default Login;