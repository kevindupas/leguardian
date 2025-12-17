<?php

namespace App\Helpers;

/**
 * Geofencing utility helper
 * Uses ray-casting algorithm for point-in-polygon detection
 */
class GeofencingHelper
{
    /**
     * Check if a point is inside a polygon using ray-casting algorithm
     *
     * @param float $latitude Point latitude
     * @param float $longitude Point longitude
     * @param array $polygonCoordinates Array of {latitude, longitude} points forming polygon
     * @return bool True if point is inside polygon
     */
    public static function isPointInPolygon($latitude, $longitude, $polygonCoordinates)
    {
        $vertices = count($polygonCoordinates);

        if ($vertices < 3) {
            return false;
        }

        $inside = false;

        for ($i = 0, $j = $vertices - 1; $i < $vertices; $j = $i++) {
            $xi = $polygonCoordinates[$i]['latitude'];
            $yi = $polygonCoordinates[$i]['longitude'];
            $xj = $polygonCoordinates[$j]['latitude'];
            $yj = $polygonCoordinates[$j]['longitude'];

            // Ray-casting algorithm
            $intersect = (($yi > $longitude) != ($yj > $longitude))
                && ($latitude < ($xj - $xi) * ($longitude - $yi) / ($yj - $yi) + $xi);

            if ($intersect) {
                $inside = !$inside;
            }
        }

        return $inside;
    }

    /**
     * Calculate distance between two points in meters (Haversine formula)
     *
     * @param float $lat1
     * @param float $lon1
     * @param float $lat2
     * @param float $lon2
     * @return float Distance in meters
     */
    public static function getDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earth_radius = 6371000; // meters

        $lat1_rad = deg2rad($lat1);
        $lat2_rad = deg2rad($lat2);
        $delta_lat = deg2rad($lat2 - $lat1);
        $delta_lon = deg2rad($lon2 - $lon1);

        $a = sin($delta_lat / 2) * sin($delta_lat / 2) +
             cos($lat1_rad) * cos($lat2_rad) *
             sin($delta_lon / 2) * sin($delta_lon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earth_radius * $c;
    }
}
