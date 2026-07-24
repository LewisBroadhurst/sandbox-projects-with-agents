import { type Video } from '../content';

/** One TikTok video via TikTok's official iframe embed (no external script). */
export function VideoCard({ video }: { video: Video }) {
	return (
		<div className="bg-card border border-line rounded-[18px] p-[0.9rem] [transition:transform_0.2s_ease,border-color_0.2s_ease] hover:[transform:translateY(-4px)] hover:border-violet">
			<div className="relative w-full pt-[150%] rounded-[12px] overflow-hidden bg-black">
				<iframe
					title={video.title}
					className="absolute inset-0 w-full h-full border-0"
					src={`https://www.tiktok.com/embed/v2/${video.id}`}
					allow="autoplay; encrypted-media; fullscreen"
					loading="lazy"
					frameBorder="0"
				/>
			</div>
			<p className="mt-[0.8rem] mx-[0.3rem] mb-[0.2rem] font-semibold text-[0.98rem]">{video.title}</p>
		</div>
	);
}
