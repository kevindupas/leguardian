// src/hooks/useZoneDrawing.ts
import { Coordinate, findBestInsertionIndex } from '@/utils/geoUtils';
import { useState, useCallback } from 'react';

export const useZoneDrawing = () => {
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [zoneCoordinates, setZoneCoordinates] = useState<Coordinate[]>([]);

    const startDrawing = useCallback(() => {
        setIsDrawingMode(true);
        setZoneCoordinates([]);
    }, []);

    const stopDrawing = useCallback(() => {
        setIsDrawingMode(false);
        setZoneCoordinates([]);
    }, []);

    const addPoint = useCallback((coordinate: Coordinate) => {
        setZoneCoordinates((prev) => {
            // Si on a moins de 3 points, on ajoute simplement à la fin
            if (prev.length < 3) {
                return [...prev, coordinate];
            }
            // Sinon, on utilise l'algo intelligent pour insérer au bon endroit
            const index = findBestInsertionIndex(prev, coordinate);
            const newCoords = [...prev];
            newCoords.splice(index, 0, coordinate);
            return newCoords;
        });
    }, []);

    const updatePoint = useCallback((index: number, newCoordinate: Coordinate) => {
        setZoneCoordinates((prev) => {
            const newCoords = [...prev];
            newCoords[index] = newCoordinate;
            return newCoords;
        });
    }, []);

    const resetZone = useCallback(() => {
        setZoneCoordinates([]);
    }, []);

    return {
        isDrawingMode,
        zoneCoordinates,
        startDrawing,
        stopDrawing,
        addPoint,
        updatePoint,
        resetZone,
        hasEnoughPoints: zoneCoordinates.length >= 3
    };
};