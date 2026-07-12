import { RES_META, RESOURCE_ORDER } from '../game/data';
import type { GameState } from '../game/types';
import type { Speed } from '../game/useGame';

interface TopBarProps {
  state: GameState;
  speed: Speed;
  onTogglePause: () => void;
  onSetSpeed: (speed: Speed) => void;
  onSave: () => void;
  onLoad: () => void;
  onNew: () => void;
}

export function TopBar({
  state,
  speed,
  onTogglePause,
  onSetSpeed,
  onSave,
  onLoad,
  onNew,
}: TopBarProps) {
  return (
    <div id="topbar">
      <div id="titleblock">
        <span className="crest">🏛️</span>
        <h1>Acropolis Rising</h1>
      </div>
      <div className="resbar">
        {RESOURCE_ORDER.map((key) => {
          const meta = RES_META[key];
          const val = Math.floor(state.resources[key]);
          const uncapped = key === 'gold' || key === 'favor';
          const nearCap = !uncapped && val >= state.storageCap * 0.95;
          return (
            <div
              key={key}
              className={'res-pill' + (nearCap ? ' warn' : '')}
              title={meta.label}
            >
              <span>{meta.icon}</span>
              <span className="mono">{val}</span>
              {!uncapped && <span className="cap">/{state.storageCap}</span>}
            </div>
          );
        })}
      </div>
      <div id="controls">
        <button className="ghost small" onClick={onTogglePause}>
          {speed === 0 ? '▶ Play' : '⏸ Pause'}
        </button>
        <button
          className={'ghost small' + (speed === 1 ? ' active-speed' : '')}
          onClick={() => onSetSpeed(1)}
        >
          1x
        </button>
        <button
          className={'ghost small' + (speed === 2 ? ' active-speed' : '')}
          onClick={() => onSetSpeed(2)}
        >
          2x
        </button>
        <button className="ghost small" onClick={onSave}>
          💾 Save
        </button>
        <button className="ghost small" onClick={onLoad}>
          📜 Load
        </button>
        <button className="ghost small" onClick={onNew}>
          🔄 New City
        </button>
      </div>
    </div>
  );
}
