import { tracks } from '../content';
import { sectionClass } from './ui';
import { SectionHead } from './SectionHead';
import { TrackCard } from './TrackCard';
import { ComingSoon } from './ComingSoon';

export function Listen() {
	return (
		<section className={sectionClass} id="listen">
			<SectionHead index="02" title="Listen" sub="Mixes & tracks straight from SoundCloud." />
			{tracks.length > 0 ? (
				<div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
					{tracks.map(t => (
						<TrackCard key={t.embedUrl} track={t} />
					))}
				</div>
			) : (
				<ComingSoon icon="♫" text="Fresh mixes dropping soon. Follow on SoundCloud so you don't miss the first one." />
			)}
		</section>
	);
}
