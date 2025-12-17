// Coordinate type
export interface Coordinate {
  latitude: number;
  longitude: number;
}

// Safety Zone type
export interface SafetyZone {
  id: number;
  bracelet_id: number;
  created_by_guardian_id: number;
  name: string;
  icon?: string | null;
  coordinates: Coordinate[];
  notify_on_entry: boolean;
  notify_on_exit: boolean;
  created_at: string;
  updated_at: string;
}

// Request payload for creating a zone
export interface CreateZoneRequest {
  name: string;
  icon?: string | null;
  coordinates: Coordinate[];
  notify_on_entry?: boolean;
  notify_on_exit?: boolean;
}

// Request payload for updating a zone
export interface UpdateZoneRequest {
  name?: string;
  icon?: string | null;
  coordinates?: Coordinate[];
  notify_on_entry?: boolean;
  notify_on_exit?: boolean;
}
