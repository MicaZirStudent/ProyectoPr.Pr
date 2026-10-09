import PublicacionMediaFields from './PublicacionMediaFields';

export const FORMULARIO_VACIO = {
    titulo: '',
    descripcion: '',
    tipoOperacion: 'venta',
    tipoPropiedad: '',
    precio: '',
    moneda: 'USD',
    direccion: '',
    superficie: '',
    ambientes: '',
    documentos: [],
    fotos: []
};

// Validación previa al envío de los adjuntos obligatorios (el backend vuelve a validar)
export const validarAdjuntos = ({ fotos, documentos }) => {
    if (fotos.length === 0) return 'Agregá al menos una foto del inmueble';
    if (documentos.length === 0) return 'Adjuntá al menos un documento legal en PDF';
    return '';
};

// Formulario compartido por "Nueva publicación" y "Editar publicación"
const FormularioPublicacion = ({
    form,
    onChange,
    onMediaChange,
    onSubmit,
    onCancelar,
    error,
    exito,
    aviso,
    guardando,
    textoGuardar
}) => (
    <form onSubmit={onSubmit} className="crear-form">
        {aviso && <p className="alert alert-aviso">{aviso}</p>}
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        {exito && <p className="alert alert-ok" role="status">{exito}</p>}

        <div className="form-card">
            <h2 className="form-section-title">Datos de la propiedad</h2>

            <div className="field">
                <label htmlFor="pub-titulo">Título *</label>
                <input
                    id="pub-titulo"
                    type="text"
                    name="titulo"
                    value={form.titulo}
                    onChange={onChange}
                    placeholder="Ej: Casa con jardín en Fisherton"
                    required
                />
            </div>

            <div className="field">
                <label htmlFor="pub-descripcion">Descripción *</label>
                <textarea
                    id="pub-descripcion"
                    name="descripcion"
                    value={form.descripcion}
                    onChange={onChange}
                    placeholder="Describí la propiedad..."
                    rows={4}
                    required
                />
            </div>

            <div className="field-row">
                <div className="field">
                    <label htmlFor="pub-operacion">Tipo de operación *</label>
                    <select id="pub-operacion" name="tipoOperacion" value={form.tipoOperacion} onChange={onChange}>
                        <option value="venta">Venta</option>
                        <option value="alquiler">Alquiler</option>
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="pub-tipo">Tipo de propiedad</label>
                    <select id="pub-tipo" name="tipoPropiedad" value={form.tipoPropiedad} onChange={onChange}>
                        <option value="">Sin especificar</option>
                        <option value="casa">Casa</option>
                        <option value="departamento">Departamento</option>
                        <option value="local">Local</option>
                    </select>
                </div>
            </div>

            <div className="field-row">
                <div className="field">
                    <label htmlFor="pub-precio">Precio *</label>
                    <input
                        id="pub-precio"
                        type="number"
                        name="precio"
                        value={form.precio}
                        onChange={onChange}
                        placeholder="Ej: 150000"
                        min="1"
                        required
                    />
                </div>
                <div className="field">
                    <label htmlFor="pub-moneda">Moneda *</label>
                    <select id="pub-moneda" name="moneda" value={form.moneda} onChange={onChange}>
                        <option value="USD">USD</option>
                        <option value="ARS">ARS</option>
                    </select>
                </div>
            </div>

            <div className="field">
                <label htmlFor="pub-direccion">Dirección *</label>
                <input
                    id="pub-direccion"
                    type="text"
                    name="direccion"
                    value={form.direccion}
                    onChange={onChange}
                    placeholder="Ej: Av. Vélez Sársfield 1234, Rosario"
                    required
                />
            </div>

            <div className="field-row">
                <div className="field">
                    <label htmlFor="pub-superficie">Superficie (m²) *</label>
                    <input
                        id="pub-superficie"
                        type="number"
                        name="superficie"
                        value={form.superficie}
                        onChange={onChange}
                        placeholder="Ej: 200"
                        min="1"
                        required
                    />
                </div>
                <div className="field">
                    <label htmlFor="pub-ambientes">Ambientes *</label>
                    <input
                        id="pub-ambientes"
                        type="number"
                        name="ambientes"
                        value={form.ambientes}
                        onChange={onChange}
                        placeholder="Ej: 4"
                        min="1"
                        step="1"
                        required
                    />
                </div>
            </div>
        </div>

        <PublicacionMediaFields
            documentos={form.documentos}
            fotos={form.fotos}
            onChange={onMediaChange}
        />

        <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onCancelar}>
                Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Guardando...' : textoGuardar}
            </button>
        </div>
    </form>
);

export default FormularioPublicacion;
