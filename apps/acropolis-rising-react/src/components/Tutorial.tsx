import { useEffect, useState } from 'react';

interface TutorialProps {
  onClose: () => void;
}

interface Step {
  icon: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: '🏛️',
    title: 'Welcome to Acropolis Rising',
    body: 'Build a thriving Greek polis on the Aegean coast. Gather resources, connect your city with paths, feed your people, and honour the gods. This guide walks you through the essentials — you can reopen it any time with “How to Play”.',
  },
  {
    icon: '🪓',
    title: '1 · Gather resources',
    body: 'Each gathering building needs matching terrain: Lumber Camp on forest, Quarry on mountain, Copper Mine on hills, Fishing Dock on the coast, Farm on grass. Place them from the Gathering palette on the left.',
  },
  {
    icon: '📦',
    title: '2 · Connect to a Storehouse',
    body: 'Goods must reach storage to count. Put a Storehouse within a couple of tiles of your producers, or link them with Paths for longer hauls — carts will carry the goods in. A producer with no route shows an orange dot and produces nothing.',
  },
  {
    icon: '🏪',
    title: '3 · Feed your people',
    body: 'Houses only grow when an Agora delivers food. Build Houses and an Agora, then connect them with Paths — market carts carry food to houses within 6 path tiles. A red dot means a house is unfed. Watch the Distribution panel on the right.',
  },
  {
    icon: '⚡',
    title: '4 · Refine, worship, grow',
    body: 'Granaries bake grain into bread and Forges smelt copper into bronze. Temples generate Favor, which you spend on divine Blessings. Complete Milestones for bonus resources. Keep happiness high and your population will climb.',
  },
  {
    icon: '🎮',
    title: '5 · Controls',
    body: 'Use Pause / 1x / 2x to control time. Right-click (or Esc) cancels the current building. Click any tile to inspect it and demolish for a 50% refund. Your city autosaves, or save manually. Now go found a legend!',
  },
];

export function Tutorial({ onClose }: TutorialProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const s = STEPS[step];

  // Keyboard: Esc closes, arrows navigate.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setStep((n) => Math.min(STEPS.length - 1, n + 1));
      else if (e.key === 'ArrowLeft') setStep((n) => Math.max(0, n - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div id="tutorialOverlay" onClick={onClose}>
      <div className="tutorial-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="tutorial-close ghost small" onClick={onClose} aria-label="Close tutorial">
          ✕
        </button>
        <div className="tutorial-icon" aria-hidden="true">
          {s.icon}
        </div>
        <h2>{s.title}</h2>
        <p>{s.body}</p>
        <div className="tutorial-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={'tutorial-dot' + (i === step ? ' active' : '')} />
          ))}
        </div>
        <div className="tutorial-actions">
          <button className="ghost small" onClick={onClose}>
            Skip
          </button>
          <div className="tutorial-nav">
            <button className="ghost small" disabled={step === 0} onClick={() => setStep((n) => Math.max(0, n - 1))}>
              Back
            </button>
            {isLast ? (
              <button className="small" onClick={onClose}>
                Start Playing
              </button>
            ) : (
              <button className="small" onClick={() => setStep((n) => Math.min(STEPS.length - 1, n + 1))}>
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
