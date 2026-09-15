// useParams lee el id de la URL, por ejemplo /propiedad/1
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './SolicitarTurno.css';

const FichaPublicacion = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [publicacion, setPublicacion] = useState(null);
    const [cantidadHorarios, setCantidadHorarios] = useState(0);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);

    // Cuando abre la pantalla, pedimos al backend los datos de esa propiedad
    useEffect(() => {
        const cargar = async () => {
            try {
                const respuesta = await axios.get(`http://localhost:3001/api/turnos/horarios/${id}`);
                setPublicacion(respuesta.data.publicacion);
                setCantidadHorarios(respuesta.data.horarios.length);
            } catch (err) {
                setError(err.response?.data?.mensaje || 'No se pudo cargar la propiedad');
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [id]);

    if (cargando) {
        return (
            <div className="turno-wrap">
                <p className="turno-mensaje">Cargando propiedad...</p>
            </div>
        );
    }

    if (error || !publicacion) {
        return (
            <div className="turno-wrap">
                <p className="turno-error">{error || 'Propiedad no encontrada'}</p>
            </div>
        );
    }

    return (
        <div className="turno-wrap">
            <div className="turno-header">
                <div>
                    <h1 className="turno-titulo">{publicacion.titulo}</h1>
                    <p className="turno-subtitulo">Ficha de la propiedad</p>
                </div>
            </div>

            <div className="turno-card">
                <h2 className="turno-seccion-titulo">Datos de la propiedad</h2>
                <p className="turno-dato"><strong>Dirección:</strong> {publicacion.direccion}</p>
                <p className="turno-dato">
                    <strong>Horarios de visita:</strong>{' '}
                    {cantidadHorarios > 0
                        ? `${cantidadHorarios} turnos disponibles en los próximos días`
                        : 'El agente todavía no cargó horarios disponibles'}
                </p>

                <div className="turno-botones">
                    <button
                        type="button"
                        className="btn-guardar"
                        disabled={cantidadHorarios === 0}
                        onClick={() => navigate(`/propiedad/${id}/solicitar-turno`)}
                    >
                        Solicitar Turno
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FichaPublicacion;
