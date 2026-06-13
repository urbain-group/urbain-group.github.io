'use client';

import { useState } from 'react';
import { toggleMute, isMuted } from '@/lib/sound';

export default function SoundToggle() {
  const [muted, setMuted] = useState(isMuted());
  return (
    <button
      onClick={() => setMuted(toggleMute())}
      title={muted ? 'サウンドON' : 'サウンドOFF'}
      className="pix-btn pix-btn-plain fixed right-3 top-3 z-40 px-3 py-1.5 text-base"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
