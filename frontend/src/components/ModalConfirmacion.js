import { useEffect } from 'react';

// Diálogo de confirmación reutilizable para acciones sensibles (eliminar, revertir, aprobar...)
const ModalConfirmacion = ({
    titulo,
    mensaje,
    detalle,
    textoConfirmar = 'Confirmar',
    variante = 'primary',
    procesando = false,
    error = '',
    onConfirmar,
    onCancelar
}) => {
    useEffect(() => {
        const conEscape = (e) => {
            if (e.key === 'Escape' && !procesando) onCancelar();
        };
        window.addEventListener('keydown', conEscape);
        return () => window.removeEventListener('keydown', conEscape);
    }, [onCancelar, procesando]);

    return (
        <div className="confirm-fondo" onClick={() => !procesando && onCancelar()}>
            <div
                className={`confirm-modal modal-panel confirm-${variante}`}
                role="alertdialog"
                aria-labelledby="confirm-titulo"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="confirm-titulo">{titulo}</h2>
                {mensaje && <p className="confirm-mensaje">{mensaje}</p>}
                {detalle && <p className="confirm-detalle">{detalle}</p>}
                {error && <p className="alert alert-error">{error}</p>}
                <div className="confirm-acciones">
                    <button type="button" className="btn btn-outline" onClick={onCancelar} disabled={procesando}>
                        Cancelar
                    </button>
                    <button type="button" className={`btn btn-${variante}`} onClick={onConfirmar} disabled={procesando}>
                        {procesando ? 'Procesando...' : textoConfirmar}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalConfirmacion;
