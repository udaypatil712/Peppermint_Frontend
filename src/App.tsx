import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ConnectionStatus, WebSocketClient, WSMessage } from './services/websocket';
import { FleetConfig, MetricSnapshot, RobotStatus, TelemetryEvent } from './types';
import { Header } from './components/Header';
import { FleetMapCanvas } from './components/FleetMapCanvas';
import { FleetAnalytics } from './components/FleetAnalytics';
import { RobotList } from './components/RobotList';
import { ControlPanel } from './components/ControlPanel';
import { RobotDetailModal } from './components/RobotDetailModal';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
const WS_URL = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:4000/ws';

export const App: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [robotsMap, setRobotsMap] = useState<Map<string, TelemetryEvent>>(new Map());
  const [robotTrailsMap, setRobotTrailsMap] = useState<Map<string, { x: number; y: number }[]>>(new Map());
  const [metricsHistory, setMetricsHistory] = useState<MetricSnapshot[]>([]);
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);
  const [detailRobotId, setDetailRobotId] = useState<string | null>(null);
  const [showControlPanel, setShowControlPanel] = useState<boolean>(false);
  const [eventsPerSec, setEventsPerSec] = useState<number>(0);

  const [config, setConfig] = useState<FleetConfig>({
    fleetSize: 8,
    tickIntervalMs: 1000,
    payloadSizeBytes: 0,
    simulateDisruptions: true,
  });

  const wsClientRef = useRef<WebSocketClient | null>(null);
  const eventsCountRef = useRef<number>(0);

  // Initialize WebSocket Client
  useEffect(() => {
    const wsClient = new WebSocketClient(WS_URL);
    wsClientRef.current = wsClient;

    const unsubscribeStatus = wsClient.subscribeStatus((status) => {
      setConnectionStatus(status);
    });

    const unsubscribeMsg = wsClient.subscribe((msg: WSMessage) => {
      if (msg.type === 'INIT' && msg.fleet) {
        const newMap = new Map<string, TelemetryEvent>();
        msg.fleet.forEach((r) => newMap.set(r.robot_id, r));
        setRobotsMap(newMap);
        if (msg.config) setConfig(msg.config);
      } else if (msg.type === 'TELEMETRY_BATCH' && msg.events) {
        eventsCountRef.current += msg.events.length;

        setRobotsMap((prevMap) => {
          const nextMap = new Map(prevMap);
          msg.events!.forEach((ev) => nextMap.set(ev.robot_id, ev));
          return nextMap;
        });

        // Update selected robot trail
        setRobotTrailsMap((prevTrails) => {
          const nextTrails = new Map(prevTrails);
          msg.events!.forEach((ev) => {
            const list = nextTrails.get(ev.robot_id) || [];
            const updated = [...list, { x: ev.x, y: ev.y }].slice(-25);
            nextTrails.set(ev.robot_id, updated);
          });
          return nextTrails;
        });
      } else if (msg.type === 'CONFIG_CHANGE' && msg.config) {
        setConfig(msg.config);
      }
    });

    wsClient.connect();

    // Events per sec metric calculation interval
    const secTimer = setInterval(() => {
      setEventsPerSec(eventsCountRef.current);
      eventsCountRef.current = 0;
    }, 1000);

    return () => {
      clearInterval(secTimer);
      unsubscribeStatus();
      unsubscribeMsg();
      wsClient.disconnect();
    };
  }, []);

  // Compute metrics history snapshot every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (robotsMap.size === 0) return;

      const list = Array.from(robotsMap.values());
      const totalFleet = list.length;
      let activeCount = 0;
      let blockedCount = 0;
      let errorCount = 0;
      let offlineCount = 0;
      let chargingCount = 0;
      let idleCount = 0;
      let maintenanceCount = 0;
      let totalBattery = 0;
      let minBattery = 100;

      list.forEach((r) => {
        if (r.status === 'active' || r.status === 'on_mission') activeCount++;
        else if (r.status === 'blocked') blockedCount++;
        else if (r.status === 'error') errorCount++;
        else if (r.status === 'offline') offlineCount++;
        else if (r.status === 'charging') chargingCount++;
        else if (r.status === 'idle') idleCount++;
        else if (r.status === 'maintenance') maintenanceCount++;

        totalBattery += r.battery;
        if (r.battery < minBattery) minBattery = r.battery;
      });

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const snapshot: MetricSnapshot = {
        time: timeStr,
        timestamp: Date.now(),
        activeCount,
        blockedCount,
        errorCount,
        offlineCount,
        chargingCount,
        idleCount,
        maintenanceCount,
        activePercentage: Number(((activeCount / totalFleet) * 100).toFixed(1)),
        avgBattery: Number((totalBattery / totalFleet).toFixed(1)),
        minBattery: Number(minBattery.toFixed(1)),
        totalFleet,
      };

      setMetricsHistory((prev) => [...prev.slice(-100), snapshot]);
    }, 2000);

    return () => clearInterval(timer);
  }, [robotsMap]);

  // Derived Fleet Stats
  const robotsList = useMemo(() => Array.from(robotsMap.values()), [robotsMap]);
  const activeCount = useMemo(
    () => robotsList.filter((r) => r.status === 'active' || r.status === 'on_mission').length,
    [robotsList]
  );
  const attentionCount = useMemo(
    () =>
      robotsList.filter(
        (r) =>
          r.status === 'error' ||
          r.status === 'blocked' ||
          r.status === 'offline' ||
          r.status === 'maintenance' ||
          r.battery <= 20
      ).length,
    [robotsList]
  );

  // API Actions
  const handleUpdateConfig = async (newConfig: Partial<FleetConfig>) => {
    const res = await fetch(`${API_BASE_URL}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    });
    if (!res.ok) throw new Error('Config update failed');
    const data = await res.json();
    setConfig(data.config);
  };

  const handleTriggerDisruption = async (robotId: string, status: RobotStatus) => {
    const res = await fetch(`${API_BASE_URL}/api/disrupt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ robot_id: robotId, status }),
    });
    if (!res.ok) throw new Error('Disruption failed');
  };

  const currentSelectedRobot = selectedRobotId ? robotsMap.get(selectedRobotId) : undefined;
  const currentDetailRobot = detailRobotId ? robotsMap.get(detailRobotId) : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d14]">
      {/* Header Bar */}
      <Header
        connectionStatus={connectionStatus}
        totalRobots={robotsList.length}
        activeRobots={activeCount}
        attentionCount={attentionCount}
        showControlPanel={showControlPanel}
        onToggleControlPanel={() => setShowControlPanel((prev) => !prev)}
        eventsPerSec={eventsPerSec}
      />

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Dynamic Live Controls Drawer */}
        {showControlPanel && (
          <div className="animate-slide-down">
            <ControlPanel
              config={config}
              onUpdateConfig={handleUpdateConfig}
              onTriggerDisruption={handleTriggerDisruption}
              selectedRobotId={selectedRobotId}
              totalRobots={robotsList.length}
            />
          </div>
        )}

        {/* Core Operator Grid: Site Map Canvas & Fleet Roster */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left/Center: 60 FPS Site Map Canvas (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <FleetMapCanvas
              robots={robotsMap}
              selectedRobotId={selectedRobotId}
              onSelectRobot={(id) => setSelectedRobotId(id)}
              robotTrails={robotTrailsMap}
            />

            {/* Time-Series Trend Analytics */}
            <FleetAnalytics metricsHistory={metricsHistory} />
          </div>

          {/* Right Column: Filterable Robot Roster (1 col) */}
          <div className="lg:col-span-1">
            <RobotList
              robots={robotsList}
              selectedRobotId={selectedRobotId}
              onSelectRobot={(id) => setSelectedRobotId(id)}
              onOpenDetails={(id) => setDetailRobotId(id)}
            />
          </div>
        </div>
      </main>

      {/* Robot Telemetry & History Modal */}
      {detailRobotId && (
        <RobotDetailModal
          robotId={detailRobotId}
          onClose={() => setDetailRobotId(null)}
          apiBaseUrl={API_BASE_URL}
          currentRobot={currentDetailRobot}
        />
      )}
    </div>
  );
};
