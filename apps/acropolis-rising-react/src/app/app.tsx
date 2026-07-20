import { useMemo } from 'react';
import { GameCanvas } from '../components/GameCanvas';
import { Palette } from '../components/Palette';
import { SidePanel } from '../components/SidePanel';
import { Toasts } from '../components/Toasts';
import { TopBar } from '../components/TopBar';
import { AGORA_RANGE } from '../game/data';
import { computeCoverage } from '../game/network';
import { useGame } from '../game/useGame';

export function App() {
  const game = useGame();

  // Food coverage is structural (map-only), so recompute it just when the map
  // changes rather than every tick.
  const coverage = useMemo(
    () => computeCoverage(game.state.map, AGORA_RANGE),
    [game.state.map]
  );

  return (
    <div id="app">
      <TopBar
        state={game.state}
        speed={game.speed}
        onTogglePause={game.togglePause}
        onSetSpeed={game.setSpeed}
        onSave={game.saveGame}
        onLoad={game.loadGame}
        onNew={game.newCity}
      />
      <div id="main">
        <Palette
          selectedBuild={game.selectedBuild}
          onSelect={game.selectBuild}
        />
        <GameCanvas
          map={game.state.map}
          selectedTile={game.selectedTile}
          servicedHouses={coverage.servicedHouses}
          onTileClick={game.handleTileClick}
          onCancelBuild={game.cancelBuild}
        />
        <SidePanel
          state={game.state}
          coverage={coverage}
          selectedBuild={game.selectedBuild}
          selectedTile={game.selectedTile}
          onDemolish={game.demolish}
          onBlessing={game.invokeBlessing}
        />
      </div>
      <Toasts toasts={game.toasts} />
    </div>
  );
}

export default App;
