import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Brand from '../components/Brand';
import { BuildingIcon } from '../components/Icons';
import ImageLightbox from '../components/ImageLightbox';
import './FichaPublicacion.css';

const MINIATURAS_VISIBLES = 4;

const FichaPublicacion = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [publicacion, setPublicacion] = useState(null);
    const [cantidadHorarios, setCantidadHorarios] = useState(0);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);
    const [lightboxIndex, setLightboxIndex] = useState(null);

    useEffect(() => {
        const cargar = async () => {
            try {
                const [pubResp, horResp] = await Promise.all([
                    axios.get(`http://localhost:3001/api/publicaciones/publicas/${id}`),
                    axios.get(`http://localhost:3001/api/turnos/horarios/${id}`)
                ]);
                setPublicacion(pubResp.data.propiedad);
                setCantidadHorarios(horResp.data.horarios.length);
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
            <div className="ficha-wrap">
                <p className="ficha-mensaje">Cargando propiedad...</p>
            </div>
        );
    }

    if (error || !publicacion) {
        return (
            <div className="ficha-wrap">
                <p className="ficha-error">{error || 'Propiedad no encontrada'}</p>
            </div>
        );
    }

    const imagenes = Array.isArray(publicacion.imagenes) ? publicacion.imagenes : [];
    const miniaturas = imagenes.slice(1, 1 + MINIATURAS_VISIBLES);
    const restantes = imagenes.length - 1 - MINIATURAS_VISIBLES;
    const simboloMoneda = publicacion.moneda === 'ARS' ? 'AR$' : 'US$';

    return (
        <div className="ficha-wrap">
            <header className="ficha-header">
                <button type="button" className="ficha-brand" onClick={() => navigate('/')}>
                    <Brand compact />
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>
                    ← Volver al catálogo
                </button>
            </header>

            <div className="ficha-contenido">
                <div className="ficha-galeria">
                    {imagenes.length > 0 ? (
                        <>
                            <button type="button" className="ficha-foto-principal" onClick={() => setLightboxIndex(0)}>
                                <img src={imagenes[0]} alt={publicacion.titulo} />
                            </button>
                            {miniaturas.length > 0 && (
                                <div className="ficha-miniaturas">
                                    {miniaturas.map((img, i) => (
                                        <button
                                            type="button"
                                            key={i}
                                            className="ficha-miniatura"
                                            onClick={() => setLightboxIndex(i + 1)}
                                        >
                                            <img src={img} alt={`${publicacion.titulo} ${i + 2}`} />
                                            {i === miniaturas.length - 1 && restantes > 0 && (
                                                <span className="ficha-miniatura-mas">+{restantes}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {imagenes.length > 1 && (
                                <button type="button" className="ficha-ver-todas" onClick={() => setLightboxIndex(0)}>
                                    Ver todas las fotos ({imagenes.length})
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="ficha-sin-foto">
                            <BuildingIcon size={54} stroke={1.4} />
                            <span>Sin fotos</span>
                        </div>
                    )}
                </div>

                <div className="ficha-info">
                    <div className="ficha-badges">
                        <span className="ficha-badge-operacion">{publicacion.tipo_operacion}</span>
                        {publicacion.tipo_propiedad && <span className="ficha-badge-tipo">{publicacion.tipo_propiedad}</span>}
                    </div>

                    <p className="ficha-precio">
                        {simboloMoneda} {Number(publicacion.precio || 0).toLocaleString('es-AR')}
                    </p>

                    <h1 className="ficha-titulo">{publicacion.titulo}</h1>
                    <p className="ficha-direccion">{publicacion.direccion}</p>

                    {(publicacion.superficie || publicacion.ambientes) && (
                        <div className="ficha-caracteristicas">
                            {publicacion.superficie && (
                                <div className="ficha-caracteristica">
                                    <span className="ficha-caracteristica-valor">{publicacion.superficie} m²</span>
                                    <span className="ficha-caracteristica-label">Superficie</span>
                                </div>
                            )}
                            {publicacion.ambientes && (
                                <div className="ficha-caracteristica">
                                    <span className="ficha-caracteristica-valor">{publicacion.ambientes}</span>
                                    <span className="ficha-caracteristica-label">Ambientes</span>
                                </div>
                            )}
                        </div>
                    )}

                    {publicacion.descripcion && (
                        <>
                            <h2 className="ficha-seccion-titulo">Descripción</h2>
                            <p className="ficha-descripcion">{publicacion.descripcion}</p>
                        </>
                    )}

                    {publicacion.agente && <p className="ficha-agente">Agente: {publicacion.agente}</p>}

                    <div className="ficha-card-turno">
                        <h2 className="ficha-seccion-titulo">Visitar la propiedad</h2>
                        <p className="ficha-turno-info">
                            {cantidadHorarios > 0
                                ? `${cantidadHorarios} turnos disponibles en los próximos días`
                                : 'El agente todavía no cargó horarios disponibles'}
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled={cantidadHorarios === 0}
                            onClick={() => navigate(`/propiedad/${id}/solicitar-turno`)}
                        >
                            Solicitar turno
                        </button>
                    </div>
                </div>
            </div>

            {lightboxIndex !== null && (
                <ImageLightbox
                    imagenes={imagenes}
                    indiceInicial={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </div>
    );
};

export default FichaPublicacion;
