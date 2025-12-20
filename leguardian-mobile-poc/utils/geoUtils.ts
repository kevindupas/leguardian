// src/utils/geoUtils.ts

export interface Coordinate {
    latitude: number;
    longitude: number;
}

// Distance au carré (plus rapide que la racine carrée pour comparer)
const getSqDistance = (p1: Coordinate, p2: Coordinate) => {
    return Math.pow(p1.latitude - p2.latitude, 2) + Math.pow(p1.longitude - p2.longitude, 2);
};

export const findBestInsertionIndex = (coordinates: Coordinate[], newPoint: Coordinate): number => {
    if (!coordinates || coordinates.length < 3) return coordinates.length;

    let minAddedDistance = Infinity;
    let bestIndex = coordinates.length;

    for (let i = 0; i < coordinates.length; i++) {
        const p1 = coordinates[i];
        const p2 = coordinates[(i + 1) % coordinates.length]; // Le point suivant (boucle sur le premier à la fin)

        // Distance actuelle du segment p1 -> p2
        const currentDist = Math.sqrt(getSqDistance(p1, p2));

        // Nouvelle distance si on insère le point entre p1 et p2 : p1 -> newPoint -> p2
        const newPathDist = Math.sqrt(getSqDistance(p1, newPoint)) + Math.sqrt(getSqDistance(newPoint, p2));

        // De combien on rallonge le chemin ?
        const addedDistance = newPathDist - currentDist;

        if (addedDistance < minAddedDistance) {
            minAddedDistance = addedDistance;
            bestIndex = i + 1;
        }
    }

    return bestIndex;
};