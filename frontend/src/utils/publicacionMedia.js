const storageKey = (id) => `solution_pub_media_${id}`;

const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

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
