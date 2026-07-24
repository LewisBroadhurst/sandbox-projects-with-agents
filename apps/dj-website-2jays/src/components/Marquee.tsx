/** Funky scrolling word strip between the hero and the sections. */
export function Marquee() {
	const items = ['DISCO', '★', 'HOUSE', '★', 'FUNK', '★', 'GROOVE', '★', 'SOUL', '★'];
	// Repeat so the strip always fills wide screens.
	const strip = [...items, ...items, ...items];
	return (
		<div className="overflow-hidden border-y border-line bg-bg-soft py-4" aria-hidden="true">
			<div className="flex gap-10 whitespace-nowrap w-max animate-marquee motion-reduce:animate-none">
				{strip.map((t, i) =>
					t === '★' ? (
						<span key={i} className="text-[clamp(1.2rem,3vw,2rem)] text-magenta self-center">
							{t}
						</span>
					) : (
						<span
							key={i}
							className="font-display font-extrabold text-[clamp(1.4rem,4vw,2.4rem)] tracking-[0.04em] text-transparent [-webkit-text-stroke:1.5px_var(--color-muted)]"
						>
							{t}
						</span>
					),
				)}
			</div>
		</div>
	);
}
