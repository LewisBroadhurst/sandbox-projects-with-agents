/* Shared Tailwind class strings for repeated UI patterns. Kept here so the
 * button, pill and section-shell styling stays consistent across components. */

/** Outer shell for a page section (max width, centering, responsive padding). */
export const sectionClass = 'max-w-[1120px] mx-auto py-[clamp(3.5rem,8vw,6rem)] px-[clamp(1rem,4vw,3rem)]';

/** Primary gradient CTA button. */
export const btnPrimary =
	'inline-flex items-center justify-center gap-2 py-[0.85rem] px-[1.6rem] rounded-full text-[1rem] font-bold tracking-[0.01em] border border-transparent cursor-pointer bg-grad text-bg shadow-[0_8px_30px_rgba(255,46,151,0.35)] [transition:transform_0.15s_ease,box-shadow_0.25s_ease,background_0.25s_ease] hover:[transform:translateY(-2px)] hover:shadow-[0_12px_40px_rgba(139,92,255,0.5)]';

/** Secondary outlined button. */
export const btnGhost =
	'inline-flex items-center justify-center gap-2 py-[0.85rem] px-[1.6rem] rounded-full text-[1rem] font-semibold tracking-[0.01em] border border-line bg-transparent text-ink cursor-pointer [transition:transform_0.15s_ease,box-shadow_0.25s_ease,background_0.25s_ease] hover:border-cyan hover:text-cyan hover:[transform:translateY(-2px)]';

/** Small solid-cyan button (e.g. gig tickets). */
export const btnSmall =
	'inline-flex items-center justify-center gap-2 py-[0.5rem] px-[1.1rem] rounded-full text-[0.9rem] font-bold tracking-[0.01em] border border-transparent cursor-pointer bg-cyan text-bg [transition:transform_0.15s_ease,box-shadow_0.25s_ease,background_0.25s_ease]';

/** Genre / tag pill. */
export const pill =
	'inline-block py-[0.35rem] px-[0.9rem] border border-line rounded-full text-[0.85rem] text-muted bg-[rgba(255,255,255,0.02)]';
