import PocketBase from "pocketbase";

export const POCKETBASE_URL = "http://127.0.0.1:8090";

export const pb = new PocketBase(POCKETBASE_URL);

/**
 * Retourne l'URL publique d'un fichier PocketBase.
 * @param record  L'objet record retourné par PocketBase (doit avoir id et collectionId/collectionName)
 * @param filename Le nom du fichier (champ `image` par exemple)
 */
export function getFileUrl(
    record: { id: string; collectionId?: string; collectionName?: string },
    filename: string,
): string {
    if (!filename) return "";
    const collection = record.collectionName ?? record.collectionId ?? "";
    if (!collection) return "";
    return `${POCKETBASE_URL}/api/files/${collection}/${record.id}/${filename}`;
}
