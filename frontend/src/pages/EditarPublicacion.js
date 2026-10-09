import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import AgentLayout from '../components/AgentLayout';
import FormularioPublicacion, { FORMULARIO_VACIO, validarAdjuntos } from '../components/FormularioPublicacion';
import {
    documentosAPayload,
    documentosDesdeBackend,
    fotosADataUrls,
    fotosDesdeImagenes
} from '../utils/publicacionMedia';
import { API_URL } from '../utils/http';
import { ROLES, encabezadoAuth, esRol } from '../utils/sesion';
import './CrearPublicacion.css';

const EditarPublicacion = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const esAdmin = esRol(ROLES.ADMIN);
    const [form, setForm] = useState(FORMULARIO_VACIO);
    const [estado, setEstado] = useState('');
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [cargando, setCargando] = useState(true);

    const volver = () => navigate('/mis-publicaciones');

    useEffect(() => {
        const cargar = async () => {
            try {
                const { data: pub } = await axios.get(`${API_URL}/api/publicaciones/${id}`, encabezadoAuth());
                setEstado(pub.estado);
                setForm({
                    titulo: pub.titulo,
                    descripcion: pub.descripcion || '',
                    tipoOperacion: (pub.tipo_operacion || 'venta').toLowerCase(),
                    tipoPropiedad: pub.tipo_propiedad ? pub.tipo_propiedad.toLowerCase() : '',
                    precio: pub.precio ?? '',
                    moneda: ['USD', 'ARS'].includes(pub.moneda) ? pub.moneda : 'USD',
                    direccion: pub.direccion,
                    superficie: pub.superficie ?? '',
                    ambientes: pub.ambientes ?? '',
                    documentos: documentosDesdeBackend(pub.documentos),
                    fotos: fotosDesdeImagenes(pub.imagenes)
                });
            } catch (err) {
                if (err.response?.status === 404) {
                    navigate('/mis-publicaciones', { replace: true });
                    return;
                }
                setError(err.response?.data?.mensaje || 'No se pudo cargar la publicación');
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [id, navigate]);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleMediaChange = (campo, valor) => {
        setForm((prev) => ({ ...prev, [campo]: valor }));
        setError('');
    };

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
            await axios.put(`${API_URL}/api/publicaciones/${id}`, payload, encabezadoAuth());
            setExito('Publicación actualizada correctamente');
            setTimeout(volver, 1500);
        } catch (err) {
            if (err.response?.status === 413) {
                setError('Los archivos son demasiado pesados. Quitá alguno e intentá de nuevo.');
            } else {
                setError(err.response?.data?.mensaje || 'No se pudo actualizar la publicación');
            }
        } finally {
            setGuardando(false);
        }
    };

    const encabezado = {
        title: 'Editar publicación',
        subtitle: esAdmin && estado ? `Estado actual: ${estado}` : 'Modificá los datos de la propiedad',
        actions: (
            <button type="button" className="btn btn-outline btn-back" onClick={volver}>
                Volver
            </button>
        )
    };

    if (cargando) {
        return (
            <AgentLayout {...encabezado}>
                <p className="empty-state">Cargando...</p>
            </AgentLayout>
        );
    }

    return (
        <AgentLayout {...encabezado}>
            <FormularioPublicacion
                form={form}
                onChange={handleChange}
                onMediaChange={handleMediaChange}
                onSubmit={handleGuardar}
                onCancelar={volver}
                error={error}
                exito={exito}
                aviso={esAdmin ? 'Como administrador, los cambios se guardan sin modificar el estado de la publicación.' : ''}
                guardando={guardando}
                textoGuardar="Guardar cambios"
            />
        </AgentLayout>
    );
};

export default EditarPublicacion;
