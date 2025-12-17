// src/utils/geoUtils.ts

export interface Coordinate {
    latitude: number;
    longitude: number;
}

// Calcule la distance au carré entre deux points (suffisant pour comparer)
const getSqDistance = (p1: Coordinate, p2: Coordinate) => {
    return Math.pow(p1.latitude - p2.latitude, 2) + Math.pow(p1.longitude - p2.longitude, 2);
};

// Trouve le meilleur index pour insérer un point sans croiser les lignes
// On cherche l'arête (le segment entre deux points) la plus proche du nouveau clic
export const findBestInsertionIndex = (coordinates: Coordinate[], newPoint: Coordinate): number => {
    if (coordinates.length < 3) return coordinates.length;

    let minDistance = Infinity;
    let bestIndex = coordinates.length;

    for (let i = 0; i < coordinates.length; i++) {
        const p1 = coordinates[i];
        const p2 = coordinates[(i + 1) % coordinates.length]; // Le point suivant (ou le premier si on est au bout)

        // On projette grossièrement pour voir si le point est "entre" ce segment
        // C'est une simplification : on regarde la somme des distances P1->New->P2
        // Si New est sur le segment, dist(P1, New) + dist(New, P2) == dist(P1, P2)
        // On cherche donc l'augmentation de périmètre minimale
        const currentDist = Math.sqrt(getSqDistance(p1, p2));
        const newPathDist = Math.sqrt(getSqDistance(p1, newPoint)) + Math.sqrt(getSqDistance(newPoint, p2));

        const addedDistance = newPathDist - currentDist;

        if (addedDistance < minDistance) {
            minDistance = addedDistance;
            bestIndex = i + 1;
        }
    }

    return bestIndex;
};