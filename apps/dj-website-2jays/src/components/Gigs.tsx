import { gigs, type Gig } from '../content';
import { sectionClass, btnSmall } from './ui';
import { SectionHead } from './SectionHead';
import { ComingSoon } from './ComingSoon';

export function Gigs() {
	return (
		<section className={sectionClass} id="gigs">
			<SectionHead index="04" title="Gigs" sub="Where to catch a set next." />
			{gigs.length > 0 ? (
				<ul className="list-none m-0 p-0 border-t border-line">
					{gigs.map((g: Gig, i) => (
						<li
							key={i}
							className="grid grid-cols-[160px_1fr_auto] items-center gap-x-4 gap-y-4 py-[1.3rem] px-[0.5rem] border-b border-line transition-colors duration-200 hover:bg-[rgba(255,255,255,0.02)] max-[820px]:grid-cols-[1fr_auto] max-[820px]:[grid-template-areas:'date_action'_'venue_venue'] max-[820px]:gap-y-[0.4rem]"
						>
							<span className="font-display font-bold text-cyan tracking-[0.05em] max-[820px]:[grid-area:date]">{g.date}</span>
							<span className="flex flex-col max-[820px]:[grid-area:venue]">
								<strong className="text-[1.15rem]">{g.venue}</strong>
								<em className="text-muted not-italic text-[0.95rem]">{g.city}</em>
							</span>
							<span className="max-[820px]:[grid-area:action] max-[820px]:justify-self-end">
								{g.soldOut ? (
									<span className="text-magenta font-bold uppercase text-[0.85rem] tracking-[0.1em]">Sold out</span>
								) : g.ticketUrl ? (
									<a href={g.ticketUrl} target="_blank" rel="noreferrer" className={btnSmall}>
										Tickets
									</a>
								) : (
									<span className="text-muted text-[0.9rem]">Info soon</span>
								)}
							</span>
						</li>
					))}
				</ul>
			) : (
				<ComingSoon icon="◎" text="No dates on the calendar right now — which means yours could be the next one. Get in touch below." />
			)}
		</section>
	);
}
