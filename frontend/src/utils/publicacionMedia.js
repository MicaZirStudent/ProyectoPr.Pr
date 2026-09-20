const storageKey = (id) => `solution_pub_media_${id}`;

export const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const MAX_LADO_PX = 1600;
const CALIDAD_JPEG = 0.8;

// Las fotos reales (cámara de celular) pueden pesar varios MB cada una y romper
// el límite del body del servidor. Las redimensionamos y comprimimos en el navegador
// antes de mandarlas como data URL.
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
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', CALIDAD_JPEG));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });

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

export const persistPublicacionMedia = async (id, documentos = [], fotos = []) => {
    const fotosData = await Promise.all(
        fotos.map(async (item) => {
            if (typeof item.preview === 'string' && item.preview.startsWith('data:')) {
                return { name: item.name, preview: item.preview };
            }
            if (item.file) {
                return { name: item.name || item.file.name, preview: await fileToDataUrl(item.file) };
            }
            return null;
        })
    );

    const payload = {
        documentos: documentos.map((item) => ({ name: item.name })),
        fotos: fotosData.filter(Boolean)
    };

    try {
        localStorage.setItem(storageKey(id), JSON.stringify(payload));
    } catch {
        try {
            localStorage.setItem(
                storageKey(id),
                JSON.stringify({ documentos: payload.documentos, fotos: payload.fotos.slice(0, 4) })
            );
        } catch {
            /* quota exceeded */
        }
    }
};

export const getPublicacionMedia = (id) => {
    try {
        const raw = localStorage.getItem(storageKey(id));
        if (!raw) return { documentos: [], fotos: [] };
        const parsed = JSON.parse(raw);
        return {
            documentos: parsed.documentos || [],
            fotos: parsed.fotos || []
        };
    } catch {
        return { documentos: [], fotos: [] };
    }
};

export const withPublicacionMedia = (pub) => {
    const media = getPublicacionMedia(pub._id || pub.idPublicacion);
    const fotos = Array.isArray(pub.imagenes) && pub.imagenes.length
        ? pub.imagenes.map((preview, i) => ({ name: `foto-${i + 1}`, preview }))
        : media.fotos;
    return {
        ...pub,
        fotos,
        documentos: media.documentos
    };
};
