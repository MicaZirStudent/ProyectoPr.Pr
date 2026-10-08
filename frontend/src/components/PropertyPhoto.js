import SinFoto from './SinFoto';

const PropertyPhoto = ({ fotos = [], alt = 'Propiedad' }) => {
    const primera = fotos[0]?.preview || fotos[0];

    return (
        <div className="property-photo">
            {primera ? <img src={primera} alt={alt} /> : <SinFoto />}
        </div>
    );
};

export default PropertyPhoto;
