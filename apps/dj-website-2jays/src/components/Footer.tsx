import { profile } from '../content';

export function Footer() {
	return (
		<footer className="max-w-[1120px] mx-auto pt-12 px-[clamp(1rem,4vw,3rem)] pb-16 border-t border-line flex flex-wrap items-baseline gap-x-6 gap-y-2 text-muted">
			<span className="font-display font-extrabold text-[1.4rem] text-gradient">2JAYS</span>
			<span className="text-ink">Available for bookings · {profile.location}</span>
			<span className="ml-auto text-[0.9rem]">
				© {new Date().getFullYear()} {profile.name}. Keep dancing.
			</span>
		</footer>
	);
}
