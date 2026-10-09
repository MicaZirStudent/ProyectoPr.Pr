import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AgentLayout from '../components/AgentLayout';
import FormularioPublicacion, { FORMULARIO_VACIO, validarAdjuntos } from '../components/FormularioPublicacion';
import { documentosAPayload, fotosADataUrls } from '../utils/publicacionMedia';
import { API_URL } from '../utils/http';
import { encabezadoAuth } from '../utils/sesion';
import './CrearPublicacion.css';

const CrearPublicacion = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState(FORMULARIO_VACIO);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [guardando, setGuardando] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleMediaChange = (campo, valor) => {
        setForm((prev) => ({ ...prev, [campo]: valor }));
        setError('');
    };

    const volver = () => navigate('/mis-publicaciones');

    const handleGuardar = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');

        const errorAdjuntos = validarAdjuntos(form);
        if (errorAdjuntos) {
            setError(errorAdjuntos);
            return;
        }

        setGuardando(true);
        try {
            const { documentos, fotos, ...datos } = form;
            const payload = {
                ...datos,
                imagenes: await fotosADataUrls(fotos),
                documentos: await documentosAPayload(documentos)
            };
            await axios.post(`${API_URL}/api/publicaciones/crear`, payload, encabezadoAuth());
            setExito('Publicación guardada correctamente');
            setTimeout(volver, 1500);
        } catch (err) {
            if (err.response?.status === 413) {
                setError('Los archivos son demasiado pesados. Quitá alguno e intentá de nuevo.');
            } else {
                setError(err.response?.data?.mensaje || 'No se pudo guardar la publicación');
            }
        } finally {
            setGuardando(false);
        }
    };

    return (
        <AgentLayout
            title="Nueva publicación"
            subtitle="Completá los datos de la propiedad"
            actions={
                <button type="button" className="btn btn-outline btn-back" onClick={volver}>
                    Volver
                </button>
            }
        >
            <FormularioPublicacion
                form={form}
                onChange={handleChange}
                onMediaChange={handleMediaChange}
                onSubmit={handleGuardar}
                onCancelar={volver}
                error={error}
                exito={exito}
                guardando={guardando}
                textoGuardar="Guardar borrador"
            />
        </AgentLayout>
    );
};

export default CrearPublicacion;
