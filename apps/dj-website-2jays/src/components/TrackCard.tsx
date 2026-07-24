import { type Track } from '../content';

/** One SoundCloud track embedded via its player iframe. */
export function TrackCard({ track }: { track: Track }) {
	return (
		<div className="bg-card border border-line rounded-[18px] p-[0.9rem] [transition:transform_0.2s_ease,border-color_0.2s_ease] hover:[transform:translateY(-4px)] hover:border-violet">
			<iframe
				title={track.title}
				className="w-full h-[166px] border-0 rounded-[12px] block"
				scrolling="no"
				frameBorder="no"
				allow="autoplay"
				loading="lazy"
				src={track.embedUrl}
			/>
			<p className="mt-[0.8rem] mx-[0.3rem] mb-[0.2rem] font-semibold text-[0.98rem]">{track.title}</p>
		</div>
	);
}
