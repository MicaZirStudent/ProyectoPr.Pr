import markLight from '../assets/brand/solution-mark-light.png';

// Placeholder para propiedades sin fotos: usa la casa del logo en lugar de un ícono genérico
const SinFoto = ({ texto = 'Sin fotos', className = '' }) => (
    <div className={`sin-foto ${className}`}>
        <img src={markLight} alt="" aria-hidden="true" />
        <span>{texto}</span>
    </div>
);

export default SinFoto;
