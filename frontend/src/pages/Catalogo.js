import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Brand from '../components/Brand';
import { BuildingIcon } from '../components/Icons';
import ModalContacto from '../components/ModalContacto';
import './Catalogo.css';

const AMBIENTES_OPCIONES = ['1', '2', '3', '4', '4+'];

const FILTROS_INICIALES = {
    tipoOperacion: '',
    tipoPropiedad: '',
    ambientes: '',
    precioDesde: '',
    precioHasta: '',
    moneda: 'USD'
};

const formatearPrecio = (precio, moneda) => {
    const simbolo = moneda === 'ARS' ? 'AR$' : 'US$';
    return `${simbolo} ${Number(precio || 0).toLocaleString('es-AR')}`;
};

const Catalogo = () => {
    const navigate = useNavigate();
    const [filtros, setFiltros] = useState(FILTROS_INICIALES);
    const [propiedades, setPropiedades] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [contactoPub, setContactoPub] = useState(null);

    const buscar = useCallback(async (filtrosActuales) => {
        setCargando(true);
        setError('');
        try {
            const params = {};
            if (filtrosActuales.tipoOperacion) params.tipo_operacion = filtrosActuales.tipoOperacion;
            if (filtrosActuales.tipoPropiedad) params.tipo_propiedad = filtrosActuales.tipoPropiedad;
            if (filtrosActuales.ambientes) params.ambientes = filtrosActuales.ambientes;
            if (filtrosActuales.precioDesde) params.precio_desde = filtrosActuales.precioDesde;
            if (filtrosActuales.precioHasta) params.precio_hasta = filtrosActuales.precioHasta;
            if (filtrosActuales.moneda) params.moneda = filtrosActuales.moneda;

            const respuesta = await axios.get('http://localhost:3001/api/publicaciones/publicas', { params });
            setPropiedades(respuesta.data.propiedades || []);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'No se pudieron cargar las propiedades');
            setPropiedades([]);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        buscar(FILTROS_INICIALES);
    }, [buscar]);

    const handleFiltroChange = (e) => {
        setFiltros({ ...filtros, [e.target.name]: e.target.value });
    };

    const handleBuscar = (e) => {
        e.preventDefault();
        buscar(filtros);
    };

    return (
        <div className="catalogo-wrap">
            <header className="catalogo-header">
                <Brand compact />
                <button type="button" className="btn btn-ghost" onClick={() => navigate('/login')}>
                    Iniciar sesión
                </button>
            </header>

            <form className="catalogo-filtros" onSubmit={handleBuscar}>
                <div className="catalogo-campo">
                    <label>Operación</label>
                    <select name="tipoOperacion" value={filtros.tipoOperacion} onChange={handleFiltroChange}>
                        <option value="">Todas</option>
                        <option value="venta">Venta</option>
                        <option value="alquiler">Alquiler</option>
                    </select>
                </div>

                <div className="catalogo-campo">
                    <label>Tipo de propiedad</label>
                    <select name="tipoPropiedad" value={filtros.tipoPropiedad} onChange={handleFiltroChange}>
                        <option value="">Todas</option>
                        <option value="casa">Casa</option>
                        <option value="departamento">Departamento</option>
                        <option value="local">Local</option>
                    </select>
                </div>

                <div className="catalogo-campo">
                    <label>Ambientes</label>
                    <select name="ambientes" value={filtros.ambientes} onChange={handleFiltroChange}>
                        <option value="">Todos</option>
                        {AMBIENTES_OPCIONES.map((op) => (
                            <option key={op} value={op}>{op}</option>
                        ))}
                    </select>
                </div>

                <div className="catalogo-campo catalogo-precio">
                    <label>Precio</label>
                    <div className="catalogo-precio-inputs">
                        <input
                            type="number"
                            name="precioDesde"
                            value={filtros.precioDesde}
                            onChange={handleFiltroChange}
                            placeholder="Desde"
                            min="0"
                        />
                        <input
                            type="number"
                            name="precioHasta"
                            value={filtros.precioHasta}
                            onChange={handleFiltroChange}
                            placeholder="Hasta"
                            min="0"
                        />
                        <select name="moneda" value={filtros.moneda} onChange={handleFiltroChange}>
                            <option value="USD">USD</option>
                            <option value="ARS">ARS</option>
                        </select>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary catalogo-buscar">Buscar</button>
            </form>

            <main className="catalogo-resultados">
                {cargando ? (
                    <div className="catalogo-spinner-wrap">
                        <span className="catalogo-spinner" role="status" aria-label="Cargando" />
                    </div>
                ) : error ? (
                    <p className="catalogo-vacio">{error}</p>
                ) : propiedades.length === 0 ? (
                    <p className="catalogo-vacio">No se encontraron propiedades</p>
                ) : (
                    <div className="catalogo-lista">
                        {propiedades.map((pub) => (
                            <article className="catalogo-card" key={pub._id}>
                                <div className="catalogo-card-media">
                                    {pub.imagenes && pub.imagenes.length > 0 ? (
                                        <img src={pub.imagenes[0]} alt={pub.titulo} />
                                    ) : (
                                        <div className="catalogo-card-sinfoto">
                                            <BuildingIcon size={42} stroke={1.5} />
                                        </div>
                                    )}
                                </div>
                                <div className="catalogo-card-info">
                                    <div className="catalogo-card-badges">
                                        <span className="catalogo-badge-operacion">{pub.tipo_operacion}</span>
                                        {pub.tipo_propiedad && <span className="catalogo-badge-tipo">{pub.tipo_propiedad}</span>}
                                    </div>
                                    <p className="catalogo-card-precio">{formatearPrecio(pub.precio, filtros.moneda)}</p>
                                    <h2 className="catalogo-card-titulo">{pub.titulo}</h2>
                                    <p className="catalogo-card-direccion">{pub.direccion}</p>
                                    <p className="catalogo-card-meta">
                                        {[pub.superficie && `${pub.superficie} m²`, pub.ambientes && `${pub.ambientes} amb.`]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                    {pub.descripcion && <p className="catalogo-card-descripcion">{pub.descripcion}</p>}
                                    {pub.agente && <p className="catalogo-card-agente">Agente: {pub.agente}</p>}
                                    <div className="catalogo-card-acciones">
                                        <button type="button" className="btn btn-navy" onClick={() => setContactoPub(pub)}>
                                            Contactar
                                        </button>
                                        <button type="button" className="btn btn-soft" onClick={() => navigate(`/propiedad/${pub._id}`)}>
                                            Ver más
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>

            {contactoPub && (
                <ModalContacto
                    publicacion={contactoPub}
                    onClose={() => setContactoPub(null)}
                />
            )}
        </div>
    );
};

export default Catalogo;
