// Importamos hooks de React
import { useState, useEffect } from 'react';

// Importamos axios para hablarle al backend
import axios from 'axios';

// Importamos useNavigate para navegar entre pantallas
import { useNavigate } from 'react-router-dom';

// Importamos los estilos
import './MisPublicaciones.css';

const MisPublicaciones = () => {

    // Estado para guardar la lista de publicaciones
    const [publicaciones, setPublicaciones] = useState([]);

    // Estado para mostrar un mensaje si no hay publicaciones
    const [cargando, setCargando] = useState(true);

    const navigate = useNavigate();

    // useEffect se ejecuta cuando el componente carga por primera vez
    // Es el equivalente a "cuando la pantalla abre, traé los datos"
    useEffect(() => {
        obtenerPublicaciones();
    }, []);

    const obtenerPublicaciones = async () => {
        try {
            // Sacamos el token del localStorage para mandarlo en el header
            const token = localStorage.getItem('token');

            const respuesta = await axios.get('http://localhost:3001/api/publicaciones/mis-publicaciones', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setPublicaciones(respuesta.data);
            setCargando(false);

        } catch (error) {
            // Si el token expiró, mandamos al login
            if (error.response?.status === 401) {
                navigate('/');
            }
            setCargando(false);
        }
    };

    // Función para el color del estado de la publicación
    const colorEstado = (estado) => {
        const colores = {
            borrador: '#9CA3AF',
            en_revision: '#F59E0B',
            observada: '#EF4444',
            publicada: '#2D6A4F',
            dada_de_baja: '#6B7280'
        };
        return colores[estado] || '#9CA3AF';
    };

    return (
        <div className="mispub-wrap">

            {/* Header */}
            <div className="mispub-header">
                <div>
                    <h1 className="mispub-titulo">Mis Publicaciones</h1>
                    <p className="mispub-subtitulo">Gestioná tus propiedades</p>
                </div>
                <div className="mispub-acciones">
                    <button className="btn-volver" onClick={() => navigate('/dashboard')}>← Volver</button>
                    <button className="btn-nueva" onClick={() => navigate('/crear-publicacion')}>+ Nueva Publicación</button>
                </div>
            </div>

            {/* Contenido */}
            {cargando ? (
                <p className="mispub-mensaje">Cargando publicaciones...</p>
            ) : publicaciones.length === 0 ? (
                <p className="mispub-mensaje">No tenés publicaciones todavía. ¡Creá una!</p>
            ) : (
                <div className="mispub-tabla-wrap">
                    <table className="mispub-tabla">
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Tipo</th>
                                <th>Precio</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {publicaciones.map((pub) => (
                                <tr key={pub.idPublicacion}>
                                    <td>{pub.titulo}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{pub.tipoOperacion}</td>
                                    <td>${Number(pub.precioPublicacion).toLocaleString('es-AR')}</td>
                                    <td>
                                        <span className="estado-badge" style={{ backgroundColor: colorEstado(pub.estadoPublicacion) }}>
                                            {pub.estadoPublicacion.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="acciones-cell">
                                        {(pub.estadoPublicacion === 'borrador' || pub.estadoPublicacion === 'observada') && (
                                            <button className="btn-accion editar" onClick={() => navigate(`/editar-publicacion/${pub.idPublicacion}`)}>Editar</button>
                                        )}
                                        {pub.estadoPublicacion === 'borrador' && (
                                            <button className="btn-accion enviar">Enviar a revisión</button>
                                        )}
                                        {pub.estadoPublicacion === 'publicada' && (
                                            <button className="btn-accion ver">Ver</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MisPublicaciones;