import markLight from '../assets/brand/solution-mark-light.png';
import markNavy from '../assets/brand/solution-mark.png';
import wordmarkBeige from '../assets/brand/solution-wordmark-beige.png';
import wordmarkNavy from '../assets/brand/solution-wordmark-navy.png';

// onLight: usar la versión azul del logo cuando va sobre fondo claro
const Brand = ({ compact = false, onLight = false }) => (
    <div className={`brand ${compact ? 'brand-compact' : ''} ${onLight ? 'brand-on-light' : ''}`}>
        <img className="brand-mark" src={onLight ? markNavy : markLight} alt="" aria-hidden="true" />
        <span className="brand-text">
            <img className="brand-wordmark" src={onLight ? wordmarkNavy : wordmarkBeige} alt="SOLUTION" />
            <span className="brand-tag">Inmobiliaria</span>
        </span>
    </div>
);

export default Brand;
