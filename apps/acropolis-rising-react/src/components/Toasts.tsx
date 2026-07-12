import type { Toast } from '../game/useGame';

export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div id="toastWrap">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.msg}
        </div>
      ))}
    </div>
  );
}
