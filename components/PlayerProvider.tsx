'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Show } from '@/lib/types';

type PlayerState = {
  current: Show | null;
  playing: boolean;
  time: number;
  duration: number;
  rate: number;
  play: (show: Show) => void;
  /** Play a show from a position in seconds, e.g. a track in its set list. */
  playAt: (show: Show, seconds: number) => void;
  toggle: () => void;
  seek: (t: number) => void;
  skip: (delta: number) => void;
  setRate: (r: number) => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

const posKey = (id: string) => `radio-ideo:pos:${id}`;
const LAST_KEY = 'radio-ideo:last';

function readStore(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStore(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<Show | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);
  const pendingSeek = useRef<number | null>(null);
  const autoplay = useRef(false);

  const load = useCallback((show: Show, start: boolean, from?: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const saved = from ?? Number(readStore(posKey(show.id)) ?? 0);
    pendingSeek.current = from != null || saved > 5 ? saved : null;
    autoplay.current = start;
    setCurrent(show);
    setTime(saved);
    setDuration(0);
    audio.src = `/api/stream/${encodeURIComponent(show.id)}`;
    audio.load();
    writeStore(LAST_KEY, JSON.stringify(show));
  }, []);

  // Bring back the last show (paused) after a reload.
  useEffect(() => {
    const raw = readStore(LAST_KEY);
    if (!raw) return;
    try {
      load(JSON.parse(raw) as Show, false);
    } catch {}
  }, [load]);

  const play = useCallback(
    (show: Show) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (current?.id === show.id) {
        void audio.play();
        return;
      }
      load(show, true);
    },
    [current, load],
  );

  const playAt = useCallback(
    (show: Show, seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (current?.id === show.id && audio.readyState > 0) {
        audio.currentTime = seconds;
        setTime(seconds);
        void audio.play();
        return;
      }
      load(show, true, seconds);
    },
    [current, load],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }, [current]);

  const seek = useCallback((t: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(t)) return;
    audio.currentTime = Math.max(0, Math.min(t, audio.duration || t));
    setTime(audio.currentTime);
  }, []);

  const skip = useCallback((delta: number) => seek((audioRef.current?.currentTime ?? 0) + delta), [seek]);

  const setRate = useCallback((r: number) => {
    if (audioRef.current) audioRef.current.playbackRate = r;
    setRateState(r);
  }, []);

  // Media Session: lock screen, headphones and keyboard media keys.
  useEffect(() => {
    if (!current || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.series,
      album: 'Radio IDEO',
      artwork: [{ src: current.cover || '/brand/radio-ideo-stacked-lime.png', sizes: '568x568', type: current.cover ? undefined : 'image/png' }],
    });
    navigator.mediaSession.setActionHandler('play', () => void audioRef.current?.play());
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler('seekbackward', () => skip(-30));
    navigator.mediaSession.setActionHandler('seekforward', () => skip(30));
    navigator.mediaSession.setActionHandler('seekto', (d) => d.seekTime != null && seek(d.seekTime));
  }, [current, seek, skip]);

  const lastSaved = useRef(0);

  return (
    <PlayerContext.Provider value={{ current, playing, time, duration, rate, play, playAt, toggle, seek, skip, setRate }}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const a = e.currentTarget;
          setDuration(a.duration);
          a.playbackRate = rate;
          if (pendingSeek.current != null && pendingSeek.current < a.duration - 10) a.currentTime = pendingSeek.current;
          pendingSeek.current = null;
          if (autoplay.current) void a.play();
        }}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setTime(t);
          if (current && Math.abs(t - lastSaved.current) > 5) {
            lastSaved.current = t;
            writeStore(posKey(current.id), String(Math.floor(t)));
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={(e) => {
          setPlaying(false);
          if (current) writeStore(posKey(current.id), String(Math.floor(e.currentTarget.currentTime)));
        }}
        onEnded={() => {
          setPlaying(false);
          if (current) writeStore(posKey(current.id), '0');
        }}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}
