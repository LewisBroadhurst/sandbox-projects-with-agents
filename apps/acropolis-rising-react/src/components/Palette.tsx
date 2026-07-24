import { BUILDINGS, BUILD_CATEGORIES, RES_META } from '../game/data';
import type { BuildingId, ResourceKey } from '../game/types';

interface PaletteProps {
	selectedBuild: BuildingId | null;
	onSelect: (id: BuildingId) => void;
}

export function Palette({ selectedBuild, onSelect }: PaletteProps) {
	const buildingIds = Object.keys(BUILDINGS) as BuildingId[];
	return (
		<div id="palette">
			{BUILD_CATEGORIES.map(cat => (
				<div key={cat}>
					<h3>{cat}</h3>
					{buildingIds
						.filter(id => BUILDINGS[id].cat === cat)
						.map(id => {
							const b = BUILDINGS[id];
							const costStr = (Object.entries(b.cost) as [ResourceKey, number][]).map(([k, v]) => `${RES_META[k].icon}${v}`).join(' ');
							return (
								<button
									key={id}
									className={'build-btn' + (selectedBuild === id ? ' selected' : '')}
									title={b.desc}
									onClick={() => onSelect(id)}
								>
									<span className="icon">{b.icon}</span>
									<span className="label">
										<b>{b.name}</b>
										<span>{costStr}</span>
									</span>
								</button>
							);
						})}
				</div>
			))}
		</div>
	);
}
