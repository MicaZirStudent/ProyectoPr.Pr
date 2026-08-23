import { BuildingIcon } from './Icons';

const PropertyPhoto = ({ fotos = [], alt = 'Propiedad' }) => {
    const primera = fotos[0]?.preview || fotos[0];

    return (
        <div className="property-photo">
            {primera ? (
                <img src={primera} alt={alt} />
            ) : (
                <div className="property-placeholder">
                    <BuildingIcon size={42} stroke={1.6} />
                </div>
            )}
        </div>
    );
};

export default PropertyPhoto;
