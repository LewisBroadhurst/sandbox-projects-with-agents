import { BLESSINGS, BUILDINGS, COLS, MILESTONES, RES_META } from '../game/data';
import type { FoodCoverage, StorageAccess } from '../game/network';
import { isProducer } from '../game/network';
import { tileAt, totalJobs } from '../game/simulation';
import type { BlessingId, BuildingId, GameState, Point, ResourceKey } from '../game/types';

interface SidePanelProps {
	state: GameState;
	coverage: FoodCoverage;
	storage: StorageAccess;
	selectedBuild: BuildingId | null;
	selectedTile: Point | null;
	onDemolish: (x: number, y: number) => void;
	onBlessing: (id: BlessingId) => void;
}

function CityStats({ state }: { state: GameState }) {
	const jobs = totalJobs(state);
	const emp = jobs > 0 ? Math.min(100, Math.round((state.population / jobs) * 100)) : 100;
	const happiness = Math.max(0, Math.min(100, state.happiness));
	return (
		<section id="cityStats">
			<h3>City of {state.cityName}</h3>
			<div className="stat-line">
				<span>Population</span>
				<span className="mono">{Math.floor(state.population)}</span>
			</div>
			<div className="stat-line">
				<span>Employment</span>
				<span className="mono">{emp}%</span>
			</div>
			<div className="stat-line">
				<span>Happiness</span>
				<span className="mono">{Math.round(state.happiness)}</span>
			</div>
			<div className="happiness-bar-bg">
				<div className="happiness-bar-fill" style={{ width: `${happiness}%` }} />
			</div>
		</section>
	);
}

function FoodDistribution({ coverage, storage }: { coverage: FoodCoverage; storage: StorageAccess }) {
	const pct = coverage.totalCapacity > 0 ? Math.round((coverage.servicedCapacity / coverage.totalCapacity) * 100) : 0;
	let hint: string;
	if (storage.producerCount > 0 && storage.connectedCount < storage.producerCount)
		hint = 'Some producers have no route to a Storehouse — link them with paths.';
	else if (coverage.houseCount === 0) hint = 'Build houses, then connect them to an Agora with paths.';
	else if (coverage.agoraCount === 0) hint = 'No Agora yet — houses cannot receive food.';
	else if (coverage.servicedCount < coverage.houseCount) hint = 'Extend paths so every house reaches an Agora.';
	else hint = 'Every house is fed. Citizens can settle in.';
	return (
		<div id="foodDist">
			<div className="stat-line">
				<span>Agoras</span>
				<span className="mono">{coverage.agoraCount}</span>
			</div>
			<div className="stat-line">
				<span>Houses served</span>
				<span className="mono">
					{coverage.servicedCount}/{coverage.houseCount}
				</span>
			</div>
			<div className="stat-line">
				<span>Food coverage</span>
				<span className="mono">{pct}%</span>
			</div>
			<div className="coverage-bar-bg">
				<div className="coverage-bar-fill" style={{ width: `${pct}%` }} />
			</div>
			<div className="stat-line" style={{ marginTop: 8 }}>
				<span>Producers linked</span>
				<span className="mono">
					{storage.connectedCount}/{storage.producerCount}
				</span>
			</div>
			<div className="empty" style={{ marginTop: 6 }}>
				{hint}
			</div>
		</div>
	);
}

function TileInfo({ state, storage, coverage, selectedBuild, selectedTile, onDemolish }: Omit<SidePanelProps, 'onBlessing'>) {
	if (selectedBuild) {
		const b = BUILDINGS[selectedBuild];
		return (
			<div id="tileInfo">
				<div className="row">
					<b>
						{b.icon} {b.name}
					</b>
				</div>
				<div className="row" style={{ marginTop: 4 }}>
					{b.desc}
				</div>
				<div className="row" style={{ marginTop: 6, color: '#8a5a2b' }}>
					Click a valid tile ({b.allow.join(', ')}) to build.
				</div>
			</div>
		);
	}
	if (!selectedTile) {
		return (
			<div id="tileInfo">
				<div className="empty">Click a tile to inspect it, or choose a building from the left to place it.</div>
			</div>
		);
	}
	const t = tileAt(state, selectedTile.x, selectedTile.y);
	const b = t.building ? BUILDINGS[t.building] : null;
	const tileIndex = selectedTile.y * COLS + selectedTile.x;
	let status: { text: string; color: string } | null = null;
	if (t.building && isProducer(t.building)) {
		status = storage.connected.has(tileIndex)
			? { text: '✔ Linked to a Storehouse — goods are stored.', color: '#4a5d32' }
			: { text: '⚠ No route to a Storehouse — produces nothing.', color: '#a13d21' };
	} else if (t.building === 'house') {
		status = coverage.servicedHouses.has(tileIndex)
			? { text: '✔ Fed by an Agora — can grow.', color: '#4a5d32' }
			: { text: '⚠ No Agora reaches this house — it cannot grow.', color: '#a13d21' };
	}
	return (
		<div id="tileInfo">
			<div className="row">
				<span>Terrain</span>
				<span>{t.terrain}</span>
			</div>
			{b ? (
				<>
					<div className="row" style={{ marginTop: 6 }}>
						<b>
							{b.icon} {b.name}
						</b>
					</div>
					<div className="row">{b.desc}</div>
					{status && (
						<div className="row" style={{ marginTop: 6, color: status.color }}>
							{status.text}
						</div>
					)}
					<button className="small" style={{ marginTop: 8, width: '100%' }} onClick={() => onDemolish(selectedTile.x, selectedTile.y)}>
						<span role="img" aria-label="Demolish">
							🏚️
						</span>{' '}
						Demolish (refund 50%)
					</button>
				</>
			) : (
				<div className="empty" style={{ marginTop: 6 }}>
					Empty land.
				</div>
			)}
		</div>
	);
}

function Blessings({ state, onBlessing }: Pick<SidePanelProps, 'state' | 'onBlessing'>) {
	const ids = Object.keys(BLESSINGS) as BlessingId[];
	return (
		<div id="blessingList">
			{ids.map(id => {
				const bl = BLESSINGS[id];
				const expiresAt = state.blessingsActive[id];
				const active = expiresAt !== undefined;
				const remaining = active ? Math.max(0, expiresAt - state.tickCount) : 0;
				return (
					<button
						key={id}
						className="blessing-btn"
						disabled={state.resources.favor < bl.cost || (bl.dur > 0 && active)}
						onClick={() => onBlessing(id)}
					>
						{bl.icon} {bl.name} — {bl.cost}✨{' '}
						<small>
							{bl.desc}
							{active && bl.dur > 0 ? ` (active ${remaining}s)` : ''}
						</small>
					</button>
				);
			})}
		</div>
	);
}

function Milestones({ state }: { state: GameState }) {
	return (
		<div id="milestoneList">
			{MILESTONES.map(m => {
				const done = !!state.milestonesDone[m.id];
				const rewardStr = (Object.entries(m.reward) as [ResourceKey, number][]).map(([k, v]) => `${RES_META[k].icon}${v}`).join(' ');
				return (
					<div key={m.id} className={'m-item' + (done ? ' done' : '')}>
						{done ? '✅' : '◻️'} {m.desc}{' '}
						<span className="mono" style={{ float: 'right' }}>
							{rewardStr}
						</span>
					</div>
				);
			})}
		</div>
	);
}

export function SidePanel(props: SidePanelProps) {
	const { state, coverage, storage, onBlessing } = props;
	return (
		<div id="sidepanel">
			<CityStats state={state} />
			<section id="foodDistSection">
				<h3>Distribution</h3>
				<FoodDistribution coverage={coverage} storage={storage} />
			</section>
			<section id="tileInfoSection">
				<h3>Selected Tile</h3>
				<TileInfo
					state={state}
					coverage={coverage}
					storage={storage}
					selectedBuild={props.selectedBuild}
					selectedTile={props.selectedTile}
					onDemolish={props.onDemolish}
				/>
			</section>
			<section id="blessingsSection">
				<h3>Divine Blessings</h3>
				<Blessings state={state} onBlessing={onBlessing} />
			</section>
			<section id="milestonesSection">
				<h3>Milestones</h3>
				<Milestones state={state} />
			</section>
		</div>
	);
}
