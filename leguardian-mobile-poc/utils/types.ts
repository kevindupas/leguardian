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

// Notification types for bracelet sharing
export interface NotificationSchedule {
  enabled: boolean;
  start_hour: number; // 0-23
  end_hour: number; // 0-23
  allowed_days: number[]; // 0 = lundi, 6 = dimanche
}

export interface NotificationPermissions {
  enabled: boolean;
  types: {
    zone_entry: boolean;
    zone_exit: boolean;
    emergency: boolean;
    low_battery: boolean;
  };
  schedule: NotificationSchedule;
}

export interface BraceletSharedGuardian {
  id: number;
  name: string;
  email: string;
  notifications: NotificationPermissions;
}

export interface BraceletPermissions {
  can_view_location: boolean;
  can_view_events: boolean;
  can_edit_bracelet: boolean;
  notifications: NotificationPermissions;
}
