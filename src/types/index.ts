export type RobotStatus = 
  | 'idle' 
  | 'active' 
  | 'on_mission' 
  | 'charging' 
  | 'blocked' 
  | 'error' 
  | 'maintenance' 
  | 'offline';

export type RobotType = 'cleaner' | 'scrubber' | 'tug' | 'inspection';

export interface TelemetryEvent {
  t: number;
  robot_id: string;
  x: number;
  y: number;
  status: RobotStatus;
  battery: number;
  task_event?: 'task_started' | 'task_completed';
  robot_type?: RobotType;
  extra_payload?: string;
  timestamp?: number;
}

export interface FleetConfig {
  fleetSize: number;
  tickIntervalMs: number;
  payloadSizeBytes: number;
  simulateDisruptions: boolean;
}

export interface MetricSnapshot {
  time: string;
  timestamp: number;
  activeCount: number;
  blockedCount: number;
  errorCount: number;
  offlineCount: number;
  chargingCount: number;
  idleCount: number;
  maintenanceCount: number;
  activePercentage: number;
  avgBattery: number;
  minBattery: number;
  totalFleet: number;
}
