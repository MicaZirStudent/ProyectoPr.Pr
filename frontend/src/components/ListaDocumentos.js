import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/http';
import { encabezadoAuth } from '../utils/sesion';
import { dataUrlABlob } from '../utils/publicacionMedia';

// Lista de PDFs adjuntos a una publicación; al hacer clic se abren en una pestaña nueva
const ListaDocumentos = ({ idPublicacion, documentos = [] }) => {
    const [abriendo, setAbriendo] = useState(null);
    const [error, setError] = useState('');

    if (documentos.length === 0) {
        return <p className="doc-vacio">Sin documentación adjunta</p>;
    }

    const abrir = async (doc) => {
        setError('');
        setAbriendo(doc._id);
        // La pestaña se abre antes de la petición para que el navegador no la bloquee
        const pestania = window.open('', '_blank');
        try {
            const { data } = await axios.get(
                `${API_URL}/api/publicaciones/${idPublicacion}/documentos/${doc._id}`,
                encabezadoAuth()
            );
            const url = URL.createObjectURL(dataUrlABlob(data.contenido));
            if (pestania) {
                pestania.location.href = url;
            } else {
                window.open(url, '_blank');
            }
        } catch {
            pestania?.close();
            setError('No se pudo abrir el documento');
        } finally {
            setAbriendo(null);
        }
    };

    return (
        <>
            <ul className="doc-lista">
                {documentos.map((doc) => (
                    <li key={doc._id}>
                        <button
                            type="button"
                            className="doc-chip"
                            onClick={() => abrir(doc)}
                            disabled={abriendo === doc._id}
                            title={`Abrir ${doc.nombre}`}
                        >
                            <span>{doc.nombre}</span>
                        </button>
                    </li>
                ))}
            </ul>
            {error && <p className="alert alert-error">{error}</p>}
        </>
    );
};

export default ListaDocumentos;
