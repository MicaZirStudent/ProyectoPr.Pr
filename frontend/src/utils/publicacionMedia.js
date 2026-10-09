// Utilidades para preparar fotos y documentos PDF antes de enviarlos al backend.

export const MAX_PDF_MB = 5;
const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;

const MAX_LADO_PX = 1600;
const CALIDAD_JPEG = 0.8;

export const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

// Las fotos de celular pueden pesar varios MB: se redimensionan y comprimen en el navegador
const comprimirImagen = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                let { width, height } = img;
                if (width > MAX_LADO_PX || height > MAX_LADO_PX) {
                    const escala = MAX_LADO_PX / Math.max(width, height);
                    width = Math.round(width * escala);
                    height = Math.round(height * escala);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', CALIDAD_JPEG));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });

// Convierte la lista de fotos del formulario en data URLs listas para guardar
export const fotosADataUrls = async (fotos = []) => {
    const convertidas = await Promise.all(
        fotos.map(async (item) => {
            if (typeof item.preview === 'string' && item.preview.startsWith('data:')) {
                return item.preview;
            }
            if (item.file) {
                try {
                    return await comprimirImagen(item.file);
                } catch {
                    return fileToDataUrl(item.file);
                }
            }
            return null;
        })
    );
    return convertidas.filter(Boolean);
};

// Documentos ya guardados viajan solo con su _id; los nuevos con nombre y contenido PDF
export const documentosAPayload = async (documentos = []) => Promise.all(
    documentos.map(async (doc) => (doc._id
        ? { _id: doc._id }
        : { nombre: doc.name, contenido: await fileToDataUrl(doc.file) }))
);

export const pdfDemasiadoGrande = (file) => file.size > MAX_PDF_BYTES;

// Fotos guardadas en la publicación → formato que usa el formulario
export const fotosDesdeImagenes = (imagenes = []) => imagenes.map((preview, i) => ({ name: `foto-${i + 1}`, preview }));

// Documentos devueltos por el backend → formato que usa el formulario
export const documentosDesdeBackend = (documentos = []) => documentos.map((doc) => ({ _id: doc._id, name: doc.nombre }));

export const dataUrlABlob = (dataUrl) => {
    const [cabecera, base64] = dataUrl.split(',');
    const tipo = cabecera.match(/data:([^;]+)/)?.[1] || 'application/octet-stream';
    const binario = atob(base64);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) {
        bytes[i] = binario.charCodeAt(i);
    }
    return new Blob([bytes], { type: tipo });
};
