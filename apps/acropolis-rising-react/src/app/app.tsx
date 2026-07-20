import { useMemo } from 'react';
import { GameCanvas } from '../components/GameCanvas';
import { Palette } from '../components/Palette';
import { SidePanel } from '../components/SidePanel';
import { Toasts } from '../components/Toasts';
import { TopBar } from '../components/TopBar';
import { Tutorial } from '../components/Tutorial';
import { AGORA_RANGE, STOREHOUSE_PICKUP, STOREHOUSE_RANGE } from '../game/data';
import { computeCartRoutes, computeCoverage, computeGoodsRoutes, computeStorageAccess } from '../game/network';
import { useGame } from '../game/useGame';

export function App() {
  const game = useGame();

  // Network state is structural (map-only), so recompute it just when the map
  // changes rather than every tick.
  const coverage = useMemo(
    () => computeCoverage(game.state.map, AGORA_RANGE),
    [game.state.map]
  );
  const storage = useMemo(
    () => computeStorageAccess(game.state.map, STOREHOUSE_RANGE, STOREHOUSE_PICKUP),
    [game.state.map]
  );
  const cartRoutes = useMemo(
    () => [
      ...computeCartRoutes(game.state.map, AGORA_RANGE),
      ...computeGoodsRoutes(game.state.map, STOREHOUSE_RANGE, STOREHOUSE_PICKUP),
    ],
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
        onHelp={game.openTutorial}
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
          connectedProducers={storage.connected}
          cartRoutes={cartRoutes}
          population={game.state.population}
          paused={game.speed === 0}
          onTileClick={game.handleTileClick}
          onCancelBuild={game.cancelBuild}
        />
        <SidePanel
          state={game.state}
          coverage={coverage}
          storage={storage}
          selectedBuild={game.selectedBuild}
          selectedTile={game.selectedTile}
          onDemolish={game.demolish}
          onBlessing={game.invokeBlessing}
        />
      </div>
      <Toasts toasts={game.toasts} />
      {game.showTutorial && <Tutorial onClose={game.closeTutorial} />}
    </div>
  );
}

export default App;
