import React, { useMemo, useState } from 'react';
import { TelemetryEvent } from '../types';
import { Search, AlertTriangle, Battery, MapPin, Eye } from 'lucide-react';
import { statusBadgeClass, statusLabel, needsAttention } from '../utils/status';

interface Props {
  robots: TelemetryEvent[];
  selectedRobotId: string | null;
  onSelectRobot: (id: string) => void;
  onOpenDetails: (id: string) => void;
}

type Filter = 'all' | 'attention' | 'active' | 'idle';

export const RobotList: React.FC<Props> = ({ robots, selectedRobotId, onSelectRobot, onOpenDetails }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const attentionCount = useMemo(
    () => robots.filter((r) => needsAttention(r.status, r.battery)).length,
    [robots]
  );

  const displayed = useMemo(() => {
    return robots.filter((r) => {
      const matchSearch =
        r.robot_id.toLowerCase().includes(search.toLowerCase()) ||
        (r.robot_type?.toLowerCase().includes(search.toLowerCase()) ?? false);
      if (!matchSearch) return false;
      if (filter === 'attention') return needsAttention(r.status, r.battery);
      if (filter === 'active') return r.status === 'active' || r.status === 'on_mission';
      if (filter === 'idle') return r.status === 'idle';
      return true;
    });
  }, [robots, search, filter]);

  const batteryBarColor = (b: number) => {
    if (b > 50) return 'bg-emerald-500';
    if (b > 20) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="glass-panel rounded-xl border border-slate-800 flex flex-col h-full">
      {/* header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Fleet Roster</h3>
            <p className="text-xs text-slate-500 mt-0.5">{displayed.length} / {robots.length} robots</p>
          </div>
          {attentionCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{attentionCount} need attention</span>
            </div>
          )}
        </div>

        {/* filter tabs */}
        <div className="flex gap-1 mb-3">
          {(['all', 'attention', 'active', 'idle'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? f === 'attention'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-teal-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {f === 'all' ? `All (${robots.length})` : f === 'attention' ? `⚠ ${attentionCount}` : f}
            </button>
          ))}
        </div>

        {/* search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by id or type..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {displayed.length === 0 ? (
          <p className="text-center text-slate-600 text-xs py-8">Nothing matches this filter.</p>
        ) : (
          displayed.map((r) => {
            const sel = r.robot_id === selectedRobotId;
            const attn = needsAttention(r.status, r.battery);
            return (
              <div
                key={r.robot_id}
                onClick={() => onSelectRobot(r.robot_id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all select-none ${
                  sel
                    ? 'bg-teal-500/10 border-teal-500/60'
                    : attn
                    ? 'bg-rose-500/5 border-rose-500/30 hover:border-rose-500/50'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* top row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-mono">{r.robot_id}</span>
                    <span className="text-[10px] text-slate-500 px-1.5 py-0.5 bg-slate-800 rounded uppercase tracking-wider">
                      {r.robot_type}
                    </span>
                  </div>
                  <span className={statusBadgeClass(r.status)}>{statusLabel(r.status)}</span>
                </div>

                {/* battery */}
                <div className="flex items-center gap-2 mb-2">
                  <Battery className={`w-3 h-3 flex-shrink-0 ${r.battery < 20 ? 'text-rose-400' : 'text-slate-500'}`} />
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${batteryBarColor(r.battery)}`}
                      style={{ width: `${r.battery}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-300 w-9 text-right">{r.battery}%</span>
                </div>

                {/* position + details link */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <MapPin className="w-2.5 h-2.5" />
                    <span>{r.x}, {r.y}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenDetails(r.robot_id); }}
                    className="flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
