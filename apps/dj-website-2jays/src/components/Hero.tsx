import { profile } from '../content';
import { btnPrimary, btnGhost, pill } from './ui';

export function Hero() {
	return (
		<section
			className="relative max-w-[1120px] mx-auto pt-[clamp(4rem,12vw,8rem)] px-[clamp(1rem,4vw,3rem)] pb-[clamp(3rem,6vw,5rem)] overflow-hidden"
			id="top"
		>
			<div
				className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[90vw] max-w-[900px] aspect-square [background:radial-gradient(circle,rgba(139,92,255,0.35),transparent_60%)] blur-[40px] z-[-1]"
				aria-hidden="true"
			/>
			<p className="uppercase tracking-[0.28em] text-[0.78rem] text-cyan mb-[1.2rem]">DJ · {profile.location} · Available for bookings</p>
			<h1 className="font-display font-extrabold text-[clamp(4.5rem,20vw,12rem)] leading-[0.86] tracking-[-0.02em] text-gradient [text-shadow:0_0_60px_rgba(255,46,151,0.25)]">
				{profile.name}
			</h1>
			<p className="font-display font-bold text-[clamp(1.3rem,4vw,2rem)] mt-[1.4rem] mb-[0.8rem]">{profile.tagline}</p>
			<p className="max-w-[44ch] text-muted text-[1.1rem] mb-[1.6rem]">{profile.intro}</p>
			<div className="flex flex-wrap gap-[0.6rem] mb-8">
				{profile.genres.map(g => (
					<span key={g} className={pill}>
						{g}
					</span>
				))}
			</div>
			<div className="flex flex-wrap gap-4">
				<a href="#book" className={btnPrimary}>
					Book 2JAYS
				</a>
				<a href="#listen" className={btnGhost}>
					Hear the sound ↓
				</a>
			</div>
		</section>
	);
}
