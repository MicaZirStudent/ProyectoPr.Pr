const esPdf = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
const esFoto = (file) => /image\/(png|jpeg|jpg|webp)/i.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);

const PublicacionMediaFields = ({ documentos, fotos, onChange }) => {
    const agregarDocumentos = (e) => {
        const nuevos = Array.from(e.target.files || [])
            .filter(esPdf)
            .map((file) => ({ file, name: file.name }));
        onChange('documentos', [...documentos, ...nuevos]);
        e.target.value = '';
    };

    const agregarFotos = (e) => {
        const nuevas = Array.from(e.target.files || [])
            .filter(esFoto)
            .map((file) => ({
                file,
                name: file.name,
                preview: URL.createObjectURL(file)
            }));
        onChange('fotos', [...fotos, ...nuevas]);
        e.target.value = '';
    };

    const quitarDocumento = (index) => {
        onChange('documentos', documentos.filter((_, i) => i !== index));
    };

    const quitarFoto = (index) => {
        const item = fotos[index];
        if (item?.preview?.startsWith('blob:')) {
            URL.revokeObjectURL(item.preview);
        }
        onChange('fotos', fotos.filter((_, i) => i !== index));
    };

    return (
        <div className="form-card" style={{ marginTop: '1.25rem' }}>
            <h2 className="form-section-title">Documentos y fotos</h2>

            <div className="field">
                <label>Escrituras y documentos legales (PDF)</label>
                <p className="field-hint">Podés adjuntar varios archivos. Solo se acepta formato .pdf</p>
                <label className="file-drop">
                    <input type="file" accept=".pdf,application/pdf" multiple onChange={agregarDocumentos} />
                    <span>Elegir PDFs</span>
                </label>
                {documentos.length > 0 && (
                    <ul className="file-list">
                        {documentos.map((doc, index) => (
                            <li key={`${doc.name}-${index}`}>
                                <span>{doc.name}</span>
                                <button type="button" className="file-remove" onClick={() => quitarDocumento(index)}>
                                    Quitar
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="field">
                <label>Fotos del inmueble</label>
                <p className="field-hint">Podés adjuntar varias imágenes. Formatos: .png, .jpg, .jpeg, .webp</p>
                <label className="file-drop">
                    <input type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" multiple onChange={agregarFotos} />
                    <span>Elegir fotos</span>
                </label>
                {fotos.length > 0 && (
                    <div className="photo-preview-grid">
                        {fotos.map((foto, index) => (
                            <figure key={`${foto.name}-${index}`} className="photo-preview">
                                <img src={foto.preview} alt={foto.name} />
                                <button type="button" className="file-remove" onClick={() => quitarFoto(index)}>
                                    Quitar
                                </button>
                            </figure>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicacionMediaFields;
