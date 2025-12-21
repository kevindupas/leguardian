// src/hooks/useZoneDrawing.ts
import { Coordinate, findBestInsertionIndex } from '@/utils/geoUtils';
import { useState, useCallback } from 'react';

export type DrawingType = 'polygon' | 'circle';

export const useZoneDrawing = () => {
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [drawingType, setDrawingType] = useState<DrawingType>('polygon');
    const [zoneCoordinates, setZoneCoordinates] = useState<Coordinate[]>([]);
    const [circleCenter, setCircleCenter] = useState<Coordinate | null>(null);
    const [circleRadius, setCircleRadius] = useState(1000);

    const startDrawing = useCallback((type: DrawingType = 'polygon') => {
        setIsDrawingMode(true);
        setDrawingType(type);
        setZoneCoordinates([]);
        setCircleCenter(null);
    }, []);

    const stopDrawing = useCallback(() => {
        setIsDrawingMode(false);
        setZoneCoordinates([]);
        setCircleCenter(null);
    }, []);

    const addPoint = useCallback((coordinate: Coordinate) => {
        if (drawingType === 'circle') {
            setCircleCenter(coordinate);
        } else {
            setZoneCoordinates((prev) => {
                if (prev.length < 3) return [...prev, coordinate];
                const index = findBestInsertionIndex(prev, coordinate);
                const newCoords = [...prev];
                newCoords.splice(index, 0, coordinate);
                return newCoords;
            });
        }
    }, [drawingType]);

    const updatePoint = useCallback((index: number, newCoordinate: Coordinate) => {
        if (drawingType === 'polygon') {
            setZoneCoordinates((prev) => {
                const newCoords = [...prev];
                newCoords[index] = newCoordinate;
                return newCoords;
            });
        } else {
            setCircleCenter(newCoordinate);
        }
    }, [drawingType]);

    const resetZone = useCallback(() => {
        setZoneCoordinates([]);
        setCircleCenter(null);
    }, []);

    return {
        isDrawingMode,
        drawingType,
        setDrawingType,
        zoneCoordinates,
        circleCenter,
        circleRadius,
        setCircleRadius,
        startDrawing,
        stopDrawing,
        addPoint,
        updatePoint,
        resetZone,
        hasEnoughPoints: drawingType === 'polygon' ? zoneCoordinates.length >= 3 : circleCenter !== null
    };
};