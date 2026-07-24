import { videos } from '../content';
import { sectionClass } from './ui';
import { SectionHead } from './SectionHead';
import { VideoCard } from './VideoCard';
import { ComingSoon } from './ComingSoon';

export function Watch() {
	return (
		<section className={sectionClass} id="watch">
			<SectionHead index="03" title="Watch" sub="Clips from behind the decks on TikTok." />
			{videos.length > 0 ? (
				<div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
					{videos.map(v => (
						<VideoCard key={v.id} video={v} />
					))}
				</div>
			) : (
				<ComingSoon icon="▶" text="Set clips and studio moments are on the way. Catch them first on TikTok." />
			)}
		</section>
	);
}
