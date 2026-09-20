import { useEffect, useState } from 'react';
import './ImageLightbox.css';

const ImageLightbox = ({ imagenes, indiceInicial = 0, onClose }) => {
    const [indice, setIndice] = useState(indiceInicial);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') setIndice((i) => Math.max(i - 1, 0));
            if (e.key === 'ArrowRight') setIndice((i) => Math.min(i + 1, imagenes.length - 1));
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [imagenes.length, onClose]);

    if (!imagenes || imagenes.length === 0) return null;

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <button type="button" className="lightbox-cerrar" onClick={onClose} aria-label="Cerrar">×</button>

            <div className="lightbox-contenido" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="lightbox-nav lightbox-nav-prev"
                    onClick={() => setIndice((i) => Math.max(i - 1, 0))}
                    disabled={indice === 0}
                    aria-label="Imagen anterior"
                >
                    ‹
                </button>

                <img className="lightbox-img" src={imagenes[indice]} alt={`Foto ${indice + 1} de ${imagenes.length}`} />

                <button
                    type="button"
                    className="lightbox-nav lightbox-nav-next"
                    onClick={() => setIndice((i) => Math.min(i + 1, imagenes.length - 1))}
                    disabled={indice === imagenes.length - 1}
                    aria-label="Imagen siguiente"
                >
                    ›
                </button>
            </div>

            {imagenes.length > 1 && (
                <div className="lightbox-miniaturas" onClick={(e) => e.stopPropagation()}>
                    {imagenes.map((img, i) => (
                        <button
                            type="button"
                            key={i}
                            className={`lightbox-miniatura ${i === indice ? 'activa' : ''}`}
                            onClick={() => setIndice(i)}
                        >
                            <img src={img} alt={`Miniatura ${i + 1}`} />
                        </button>
                    ))}
                </div>
            )}

            <span className="lightbox-indicador">{indice + 1} / {imagenes.length}</span>
        </div>
    );
};

export default ImageLightbox;
