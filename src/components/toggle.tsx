'use client';

import { useState } from 'react';

/** Interrupteur des maquettes (écrans 6 et 9), contrôlé côté formulaire. */
export function Toggle({
  name,
  label,
  hint,
  defaultChecked = false,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-line py-3 first:border-t-0">
      <span>
        <span className="block text-[13.5px]">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] text-grey">{hint}</span>}
      </span>
      <input
        type="checkbox"
        name={name}
        className="sr-only"
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
      />
      <span
        aria-hidden
        className={`relative h-[22px] w-[38px] shrink-0 rounded-pill transition ${
          checked ? 'bg-wine' : 'bg-line'
        }`}
      >
        <span
          className={`absolute top-[3px] h-4 w-4 rounded-full bg-white transition-all ${
            checked ? 'left-[19px]' : 'left-[3px]'
          }`}
        />
      </span>
    </label>
  );
}
