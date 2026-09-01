import { RobotStatus } from '../types';

export function statusBadgeClass(status: RobotStatus): string {
  return `sbadge sbadge-${status}`;
}

export function statusLabel(status: RobotStatus): string {
  return status.replace('_', ' ');
}

// which statuses mean "needs human attention"
export function needsAttention(status: RobotStatus, battery: number): boolean {
  return status === 'error' || status === 'blocked' || status === 'offline' || battery < 20;
}
