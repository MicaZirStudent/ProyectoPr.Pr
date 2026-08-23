const Brand = ({ compact = false }) => (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
        <span className="brand-mark" aria-hidden="true">S</span>
        <span className="brand-text">
            <span className="brand-name">SOLUTION</span>
            {!compact && <span className="brand-tag">Inmobiliaria</span>}
        </span>
    </div>
);

export default Brand;
