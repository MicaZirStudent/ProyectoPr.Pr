import { useState } from 'react';
import { MAX_PDF_MB, pdfDemasiadoGrande } from '../utils/publicacionMedia';

const esPdf = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
const esFoto = (file) => /image\/(png|jpeg|jpg|webp)/i.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);

// Campos de adjuntos de una publicación: documentos legales (PDF) y fotos. Ambos son obligatorios.
const PublicacionMediaFields = ({ documentos, fotos, onChange }) => {
    const [aviso, setAviso] = useState('');

    const agregarDocumentos = (e) => {
        const archivos = Array.from(e.target.files || []);
        const pdfs = archivos.filter(esPdf);
        const grandes = pdfs.filter(pdfDemasiadoGrande);
        const validos = pdfs.filter((file) => !pdfDemasiadoGrande(file));

        if (pdfs.length < archivos.length) {
            setAviso('Solo se aceptan archivos en formato PDF.');
        } else if (grandes.length) {
            setAviso(`"${grandes[0].name}" supera el máximo de ${MAX_PDF_MB} MB.`);
        } else {
            setAviso('');
        }

        onChange('documentos', [...documentos, ...validos.map((file) => ({ file, name: file.name }))]);
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
                <label>Escrituras y documentos legales (PDF) *</label>
                <p className="field-hint">
                    Adjuntá al menos un PDF. Podés sumar varios, de hasta {MAX_PDF_MB} MB cada uno.
                </p>
                <label className="file-drop">
                    <input type="file" accept=".pdf,application/pdf" multiple onChange={agregarDocumentos} />
                    <span>Elegir PDFs</span>
                </label>
                {aviso && <p className="alert alert-error file-aviso">{aviso}</p>}
                {documentos.length > 0 && (
                    <ul className="file-list">
                        {documentos.map((doc, index) => (
                            <li key={doc._id || `${doc.name}-${index}`}>
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
                <label>Fotos del inmueble *</label>
                <p className="field-hint">Adjuntá al menos una foto. Formatos: .png, .jpg, .jpeg, .webp</p>
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
