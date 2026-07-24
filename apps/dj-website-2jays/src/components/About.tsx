import { profile } from '../content';
import { sectionClass } from './ui';
import { SectionHead } from './SectionHead';

export function About() {
	return (
		<section className={sectionClass} id="about">
			<SectionHead index="01" title="About" />
			<div className="grid grid-cols-[1.6fr_1fr] gap-[clamp(2rem,5vw,4rem)] items-start max-[820px]:grid-cols-1">
				<div>
					{profile.bio.map((p, i) => (
						<p key={i} className={i === 0 ? 'text-[1.25rem] text-ink mb-[1.1rem]' : 'text-[1.12rem] text-[#d8d3f5] mb-[1.1rem]'}>
							{p}
						</p>
					))}
				</div>
				<div className="flex flex-col gap-4">
					{profile.stats.map(s => (
						<div key={s.label} className="flex flex-col py-[1.3rem] px-[1.5rem] border border-line rounded-[18px] bg-card">
							<span className="font-display font-extrabold text-[1.8rem] text-gradient">{s.value}</span>
							<span className="text-muted text-[0.95rem]">{s.label}</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
