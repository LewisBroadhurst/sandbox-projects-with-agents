/** Shared section heading: numbered index, title and optional subtitle. */
export function SectionHead({ index, title, sub }: { index: string; title: string; sub?: string }) {
	return (
		<div className="mb-10">
			<span className="font-display font-extrabold text-[0.9rem] text-magenta tracking-[0.2em]">{index}</span>
			<h2 className="font-display font-extrabold text-[clamp(2.2rem,6vw,3.6rem)] mt-[0.2rem] leading-none">{title}</h2>
			{sub && <p className="text-muted mt-[0.8rem] text-[1.05rem]">{sub}</p>}
		</div>
	);
}
