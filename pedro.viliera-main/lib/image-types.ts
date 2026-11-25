/**
 * Formatos aceitos pelo Image Lab (frontend e backend usam este mesmo arquivo).
 * A detecção olha os primeiros bytes do arquivo, então funciona mesmo quando o
 * navegador/sistema informa o tipo vazio ou fora do padrão (ex.: "image/jpg",
 * "image/x-png", "application/octet-stream").
 */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

/** Valor do atributo `accept` do <input type="file">: extensões + tipos MIME. */
export const IMAGE_ACCEPT_ATTR = '.jpeg,.jpg,.png,.webp,image/jpeg,image/png,image/webp';

export const IMAGE_FORMATS_LABEL = 'JPEG, JPG, PNG ou WEBP';

/** Quantidade de bytes necessária para identificar os três formatos. */
export const IMAGE_SIGNATURE_BYTES = 12;

export function detectImageMime(bytes: Uint8Array): AcceptedImageType | null {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return 'image/png';
  // WEBP: "RIFF" .... "WEBP"
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'image/webp';
  return null;
}

/** Extensão do arquivo para o tipo MIME (usada nos downloads). */
export function extensionForMime(mime?: string) {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'png';
}
