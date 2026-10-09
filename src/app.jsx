// Metronome by bitScribbles — app source.
// Edit this file, then build it into ../app.js (see README.md). The browser runs app.js.
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const VERSION = '1.6.0';

// ── Icons ───────────────────────────────────────────────────────
const svgProps = (size) => ({ width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round', 'aria-hidden':true, focusable:'false' });
const Play  = ({ size=24 }) => <svg {...svgProps(size)} fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const Pause = ({ size=24 }) => <svg {...svgProps(size)} fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
const HelpCircle = ({ size=24 }) => <svg {...svgProps(size)}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const Info  = ({ size=24 }) => <svg {...svgProps(size)}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const X     = ({ size=24 }) => <svg {...svgProps(size)}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const Sun   = ({ size=16 }) => (
    <svg {...svgProps(size)}>
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
);
const Moon  = ({ size=16 }) => <svg {...svgProps(size)}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

// ── Design tokens (bitScribbles brand) ──────────────────────────
const INK    = '#14171C';
const PAPER  = '#FAFAF9';
const TEAL   = '#16B3A3';
const PURPLE = '#6E56CF';
const AMBER  = '#F2B134';
const MONO    = "'JetBrains Mono', ui-monospace, Menlo, monospace";
const GROTESK = "'Space Grotesk', -apple-system, system-ui, sans-serif";
const INTER   = "'Inter', -apple-system, system-ui, sans-serif";
const CAVEAT  = "'Caveat', cursive";

// Muted text is at least 65% opacity so it stays readable (4.5:1) on the
// brightest part of each background.
const themes = {
    dark: {
        bg:             'linear-gradient(135deg, #14171C 0%, #1C1535 55%, #6E56CF 160%)',
        bar:            INK,
        cardBg:         'rgba(250,250,249,0.06)',
        cardBorder:     'rgba(250,250,249,0.12)',
        cardShadow:     '0 24px 64px rgba(20,23,28,0.45), inset 0 1px 0 rgba(250,250,249,0.08)',
        modalBg:        'rgba(20,23,28,0.95)',
        btnBg:          'rgba(250,250,249,0.07)',
        btnBorder:      'rgba(250,250,249,0.18)',
        text:           PAPER,
        textMid:        'rgba(250,250,249,0.72)',
        textBody:       'rgba(250,250,249,0.82)',
        label:          '#A898F5',   // lighter Purple for small labels on dark
        bpmShadow:      '0 0 40px rgba(22,179,163,0.3)',
        dotInactive:    'rgba(250,250,249,0.12)',
        dotBorder:      'rgba(250,250,249,0.22)',
        divider:        'rgba(250,250,249,0.10)',
        sliderTrack:    'rgba(250,250,249,0.16)',
        switchOff:      'rgba(250,250,249,0.22)',
        sigActiveText:  PAPER,
        link:           TEAL,
    },
    light: {
        bg:             'linear-gradient(135deg, #e8f7f6 0%, #f0eeff 55%, #e2dcf8 100%)',
        bar:            '#e8f7f6',
        cardBg:         'rgba(255,255,255,0.72)',
        cardBorder:     'rgba(20,23,28,0.08)',
        cardShadow:     '0 12px 48px rgba(20,23,28,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
        modalBg:        'rgba(250,250,249,0.98)',
        btnBg:          'rgba(20,23,28,0.05)',
        btnBorder:      'rgba(20,23,28,0.14)',
        text:           INK,
        textMid:        'rgba(20,23,28,0.68)',
        textBody:       'rgba(20,23,28,0.8)',
        label:          PURPLE,
        bpmShadow:      '0 0 40px rgba(22,179,163,0.15)',
        dotInactive:    'rgba(20,23,28,0.10)',
        dotBorder:      'rgba(20,23,28,0.2)',
        divider:        'rgba(20,23,28,0.08)',
        sliderTrack:    'rgba(20,23,28,0.12)',
        switchOff:      'rgba(20,23,28,0.22)',
        sigActiveText:  INK,
        link:           '#0e9688',
    },
};

const reduceMotion = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

// Beats per bar, and which beats get a secondary accent (6/8 is felt in two: 1 and 4)
const SIGS = ['2/4', '3/4', '4/4', '5/4', '6/8'];
const BEATS = { '2/4':2, '3/4':3, '4/4':4, '5/4':5, '6/8':6 };
const SECONDARY = { '6/8':[3] };
const getBeats = (s) => BEATS[s] || 4;
const MIN_BPM = 40, MAX_BPM = 240;
const clampBpm = (v) => Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(v)));

// ── Components ──────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children, t }) {
    const boxRef   = useRef(null);
    const closeRef = useRef(null);
    useEffect(() => {
        if (!isOpen) return;
        const opener = document.activeElement;
        closeRef.current && closeRef.current.focus();
        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
            if (e.key !== 'Tab' || !boxRef.current) return;
            const f = boxRef.current.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])');
            if (!f.length) return;
            const first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('keydown', onKey); opener && opener.focus && opener.focus(); };
    }, [isOpen]);
    if (!isOpen) return null;
    const id = 'dlg-' + title.replace(/\W+/g, '-').toLowerCase();
    return (
        <div onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(20,23,28,0.6)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)' }}>
            <div ref={boxRef} role="dialog" aria-modal="true" aria-labelledby={id}
                style={{ background:t.modalBg, border:'1px solid ' + t.cardBorder, borderRadius:20, boxShadow:t.cardShadow, maxWidth:460, width:'100%', maxHeight:'88vh', overflowY:'auto', padding:28, animation: reduceMotion ? 'none' : 'modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
                    <h2 id={id} style={{ margin:0, fontFamily:GROTESK, fontWeight:700, fontSize:18, color:t.text }}>{title}</h2>
                    <button ref={closeRef} onClick={onClose} aria-label="Close" style={{ background:t.btnBg, border:'1px solid ' + t.btnBorder, borderRadius:12, padding:8, display:'flex', color:t.textMid, cursor:'pointer' }}>
                        <X size={17}/>
                    </button>
                </div>
                <div style={{ fontFamily:INTER, fontSize:14, lineHeight:1.65, color:t.textBody }}>{children}</div>
            </div>
        </div>
    );
}

function Section({ title, children, t }) {
    return (
        <section style={{ marginBottom:20 }}>
            <h3 style={{ margin:'0 0 6px', fontFamily:MONO, fontWeight:400, fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:t.label }}>{title}</h3>
            <div>{children}</div>
        </section>
    );
}

const P = ({ children, last }) => <p style={{ margin: last ? 0 : '0 0 8px' }}>{children}</p>;

function Toggle({ on, onToggle, label, t }) {
    return (
        <button type="button" role="switch" aria-checked={on} onClick={onToggle} className="plain"
            style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', userSelect:'none', background:'none', border:'none', padding:'4px 6px', borderRadius:10, color:'inherit' }}>
            <span aria-hidden="true" style={{ width:36, height:20, borderRadius:99, position:'relative', transition:'background 0.25s', background: on ? TEAL : t.switchOff, flexShrink:0, display:'block' }}>
                <span style={{ position:'absolute', top:3, left: on ? 19 : 3, width:14, height:14, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.25)', transition: reduceMotion ? 'none' : 'left 0.2s cubic-bezier(0.34,1.56,0.64,1)', display:'block' }}/>
            </span>
            <span style={{ fontFamily:MONO, fontSize:11, letterSpacing:'0.06em', color: on ? t.text : t.textMid, transition:'color 0.2s' }}>{label}</span>
        </button>
    );
}

// ── Main App ────────────────────────────────────────────────────
const Metronome = () => {
    const [dark, setDark] = useState(() => store.get('bs-theme') !== 'light');
    const t = dark ? themes.dark : themes.light;
    const toggleTheme = () => setDark(d => { const next = !d; store.set('bs-theme', next ? 'dark' : 'light'); return next; });
    // Browser bar and page background follow the theme
    useEffect(() => {
        const m = document.querySelector('meta[name="theme-color"]');
        if (m) m.setAttribute('content', t.bar);
        document.documentElement.style.background = t.bar;
    }, [dark]);

    const [bpm, setBpm]                 = useState(120);
    const [isPlaying, setIsPlaying]     = useState(false);
    const [timeSig, setTimeSig]         = useState(() => SIGS.includes(store.get('bs-sig')) ? store.get('bs-sig') : '4/4');
    const [currentBeat, setCurrentBeat] = useState(-1);
    const [presets, setPresets]         = useState(() => { try { const s = JSON.parse(store.get('metronome-presets')); return Array.isArray(s) && s.length === 3 ? s : [80,120,160]; } catch { return [80,120,160]; } });
    const [savedIdx, setSavedIdx]       = useState(null);
    const [audioReady, setAudioReady]   = useState(false);
    const [showHelp, setShowHelp]       = useState(false);
    const [showAbout, setShowAbout]     = useState(false);
    const [pressedBtn, setPressedBtn]   = useState(null);
    const [accentBeat, setAccentBeat]   = useState(() => store.get('bs-accent') === 'true');
    const [upToEleven, setUpToEleven]   = useState(() => store.get('bs-eleven') === 'true');

    const audioCtx     = useRef(null);
    const nextNote     = useRef(0);
    const schedulerRef = useRef(null);
    const bpmRef       = useRef(bpm);
    const beatRef      = useRef(0);
    const sigRef       = useRef(timeSig);
    const accentRef    = useRef(accentBeat);
    const elevenRef    = useRef(upToEleven);
    const playingRef   = useRef(false);
    const lpTimer      = useRef(null);
    const wakeRef      = useRef(null);
    const taps         = useRef([]);
    const modalOpen    = useRef(false);

    useEffect(() => { bpmRef.current = bpm; }, [bpm]);
    useEffect(() => {
        sigRef.current = timeSig;
        store.set('bs-sig', timeSig);
        if (beatRef.current >= getBeats(timeSig)) beatRef.current = 0;
    }, [timeSig]);
    useEffect(() => { accentRef.current = accentBeat; }, [accentBeat]);
    useEffect(() => { elevenRef.current = upToEleven; }, [upToEleven]);
    useEffect(() => { modalOpen.current = showHelp || showAbout; }, [showHelp, showAbout]);

    const toggleAccent = () => setAccentBeat(a => { store.set('bs-accent', String(!a)); return !a; });
    const toggleEleven = () => setUpToEleven(e => { store.set('bs-eleven', String(!e)); return !e; });

    // ── Audio ──
    const initAudio = () => {
        // iPhone: ask for "playback" audio so the click still sounds with the
        // ring/silent switch on (Safari 17 and later; ignored elsewhere).
        try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}
        if (!audioCtx.current) { audioCtx.current = new (window.AudioContext || window.webkitAudioContext)(); setAudioReady(true); }
        if (audioCtx.current.state !== 'running') audioCtx.current.resume().catch(() => {});
    };

    // level: 2 = beat one (accented), 1 = secondary accent (6/8 beat four), 0 = other beats
    const playClick = (time, level) => {
        const ctx    = audioCtx.current;
        const base   = elevenRef.current ? 0.6 : 0.3;
        const accent = accentRef.current ? level : 0;
        const vol    = base * [1, 1.25, 1.5][accent];
        const freq   = [1000, 1100, 1200][accent];

        // Sharp sine transient — the tonal "tick"
        const osc   = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        oGain.gain.setValueAtTime(vol, time);
        oGain.gain.exponentialRampToValueAtTime(0.001, time + 0.012);
        osc.connect(oGain); oGain.connect(ctx.destination);
        osc.start(time); osc.stop(time + 0.012);

        // Narrow noise burst — the percussive attack
        const bufSize = Math.floor(ctx.sampleRate * 0.008);
        const buf  = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = freq;
        filter.Q.value = 3.5;
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(vol * 0.6, time);
        nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.008);
        noise.connect(filter); filter.connect(nGain); nGain.connect(ctx.destination);
        noise.start(time); noise.stop(time + 0.008);
    };

    const scheduleNote = (beat, time) => {
        try {
            const level = beat === 0 ? 2 : (SECONDARY[sigRef.current] || []).includes(beat) ? 1 : 0;
            playClick(time, level);
            setTimeout(() => { if (playingRef.current) setCurrentBeat(beat); }, Math.max(0, (time - audioCtx.current.currentTime) * 1000));
        } catch (e) {
            stop();
        }
    };

    // Look-ahead scheduler: every 25 ms, queue any clicks due in the next 100 ms.
    const scheduler = () => {
        try {
            const now = audioCtx.current.currentTime;
            // After the page was in the background, skip missed beats rather than
            // playing them all at once.
            if (nextNote.current < now - 0.05) nextNote.current = now + 0.05;
            while (nextNote.current < now + 0.1) {
                scheduleNote(beatRef.current, nextNote.current);
                nextNote.current += 60.0 / bpmRef.current;
                beatRef.current = (beatRef.current + 1) % getBeats(sigRef.current);
            }
            schedulerRef.current = setTimeout(scheduler, 25);
        } catch (e) {
            stop();
        }
    };

    // ── Keep the screen awake while playing ──
    const keepAwake = async () => {
        try {
            if ('wakeLock' in navigator && !wakeRef.current) {
                wakeRef.current = await navigator.wakeLock.request('screen');
                wakeRef.current.addEventListener('release', () => { wakeRef.current = null; });
            }
        } catch {}
    };
    const letSleep = () => { try { wakeRef.current && wakeRef.current.release(); } catch {} wakeRef.current = null; };

    const start = () => {
        initAudio();
        beatRef.current = 0;
        nextNote.current = audioCtx.current.currentTime + 0.05;
        playingRef.current = true;
        setIsPlaying(true);
        keepAwake();
        scheduler();
    };
    const stop = () => {
        playingRef.current = false;
        setIsPlaying(false);
        clearTimeout(schedulerRef.current); schedulerRef.current = null;
        setCurrentBeat(-1); beatRef.current = 0;
        letSleep();
    };
    const toggle = () => (playingRef.current ? stop() : start());

    // Coming back to the page: the screen lock was dropped and the audio may be paused
    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState === 'visible' && playingRef.current) {
                keepAwake();
                if (audioCtx.current && audioCtx.current.state !== 'running') audioCtx.current.resume().catch(() => {});
            }
        };
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, []);

    const changeBpm = (v) => setBpm(clampBpm(v));
    const press = (id, fn) => { setPressedBtn(id); fn(); setTimeout(() => setPressedBtn(null), 150); };

    // ── Tap tempo: average the last few taps; a pause of 2 s starts over ──
    const tap = () => {
        const now = performance.now();
        const list = taps.current;
        if (list.length && now - list[list.length - 1] > 2000) list.length = 0;
        list.push(now);
        if (list.length > 5) list.shift();
        if (list.length >= 2) changeBpm(60000 / ((list[list.length - 1] - list[0]) / (list.length - 1)));
        setPressedBtn('tap'); setTimeout(() => setPressedBtn(null), 120);
    };

    // ── Keyboard: Space starts and stops, T taps ──
    useEffect(() => {
        const onKey = (e) => {
            if (modalOpen.current || e.metaKey || e.ctrlKey || e.altKey) return;
            const tag = (e.target && e.target.tagName) || '';
            if (/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(tag)) return;   // let focused controls work as usual
            if (e.code === 'Space') { e.preventDefault(); toggle(); }
            else if (e.key === 't' || e.key === 'T') { tap(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // ── Presets: tap to load, press and hold to save ──
    const startLP = (i) => {
        clearTimeout(lpTimer.current);
        lpTimer.current = setTimeout(() => {
            setPresets(prev => {
                const n = [...prev]; n[i] = bpmRef.current;
                store.set('metronome-presets', JSON.stringify(n));
                return n;
            });
            setSavedIdx(i); setTimeout(() => setSavedIdx(null), 1000);
            try { navigator.vibrate && navigator.vibrate(60); } catch {}
        }, 600);
    };
    const cancelLP = () => clearTimeout(lpTimer.current);

    const beats     = Array.from({ length: getBeats(timeSig) }, (_, i) => i);
    const groups    = timeSig === '6/8' ? [beats.slice(0, 3), beats.slice(3)] : [beats];
    const sliderPct = ((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100;
    const sliderBg  = 'linear-gradient(to right,' + TEAL + ' 0%,' + TEAL + ' ' + sliderPct + '%,' + t.sliderTrack + ' ' + sliderPct + '%,' + t.sliderTrack + ' 100%)';

    const gBtn = (extra={}) => ({
        // Border as longhands: mixing `border` with `borderColor` loses the colour when the theme changes
        background: t.btnBg, borderWidth: 1, borderStyle: 'solid', borderColor: t.btnBorder, borderRadius: 12,
        color: t.text, cursor: 'pointer', fontFamily: INTER, fontWeight: 600,
        fontSize: 13, transition: 'all 0.18s ease', ...extra,
    });

    return (
        <main className="page" style={{ background:t.bg, fontFamily:INTER, transition:'background 0.4s' }}>
            <div style={{ width:'100%', maxWidth:348 }}>
                <div style={{ background:t.cardBg, backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)', border:'1px solid ' + t.cardBorder, borderRadius:20, boxShadow:t.cardShadow, padding:24, transition:'background 0.3s, border-color 0.3s' }}>

                    {/* Header */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                        <button onClick={() => setShowHelp(true)} style={{ ...gBtn(), display:'flex', alignItems:'center', gap:5, padding:'7px 11px', color:t.textMid }}>
                            <HelpCircle size={14}/> Help
                        </button>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div role="status" style={{ display:'flex', alignItems:'center', gap:5 }}>
                                <span aria-hidden="true" style={{ width:6, height:6, borderRadius:'50%', transition:'all 0.4s', background: audioReady ? TEAL : t.textMid, boxShadow: audioReady ? '0 0 7px ' + TEAL : 'none' }}/>
                                <span style={{ fontFamily:MONO, fontSize:10, letterSpacing:'0.08em', color:t.textMid }}>{audioReady ? 'AUDIO ON' : 'AUDIO OFF'}</span>
                            </div>
                            <button onClick={toggleTheme} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                                style={{ ...gBtn({ padding:'6px 10px', borderRadius:10, fontSize:12, display:'flex', alignItems:'center', gap:4 }), color:t.textMid }}>
                                {dark ? <Sun size={14}/> : <Moon size={14}/>}
                            </button>
                        </div>
                        <button onClick={() => setShowAbout(true)} style={{ ...gBtn(), display:'flex', alignItems:'center', gap:5, padding:'7px 11px', color:t.textMid }}>
                            <Info size={14}/> About
                        </button>
                    </div>

                    {/* Wordmark */}
                    <div style={{ textAlign:'left', marginBottom:18 }}>
                        <h1 style={{ margin:0, fontFamily:GROTESK, fontWeight:700, fontSize:34, letterSpacing:'-0.01em', color:t.text, lineHeight:1.1, transition:'color 0.3s' }}>Metronome</h1>
                        <p style={{ display:'flex', alignItems:'baseline', gap:6, margin:'8px 0 14px' }}>
                            <span className="sr-only">by bitScribbles</span>
                            <span aria-hidden="true" style={{ fontFamily:MONO, fontSize:11, letterSpacing:'0.06em', color:t.textMid }}>by</span>
                            <span aria-hidden="true" style={{ fontFamily:MONO, fontWeight:600, fontSize:12, color:TEAL }}>{'<'}bit{'/>'}</span>
                            <span aria-hidden="true" style={{ fontFamily:CAVEAT, fontWeight:700, fontSize:17, color:t.text, transition:'color 0.3s' }}>Scribbles</span>
                        </p>
                        <div style={{ height:1, background:t.divider }}/>
                    </div>

                    {/* BPM */}
                    <div style={{ textAlign:'center', marginBottom:10, animation: isPlaying && !reduceMotion ? 'floatUp 2s ease-in-out infinite' : 'none' }}>
                        <div aria-live="polite" aria-atomic="true">
                            <div style={{ fontFamily:GROTESK, fontWeight:700, fontSize:84, lineHeight:1, color:t.text, letterSpacing:'-2px', textShadow:t.bpmShadow, fontVariantNumeric:'tabular-nums', transition:'color 0.3s' }}>{bpm}</div>
                            <div style={{ fontFamily:MONO, fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', color:t.textMid, marginTop:2 }}>BPM</div>
                        </div>
                    </div>

                    {/* Beat dots (6/8 shows two groups of three) */}
                    <div aria-hidden="true" style={{ display:'flex', justifyContent:'center', gap:22, marginBottom:18 }}>
                        {groups.map((g, gi) => (
                            <div key={gi} style={{ display:'flex', gap:10 }}>
                                {g.map((b) => {
                                    const active = isPlaying && currentBeat === b;
                                    const isOne  = b === 0;
                                    return (
                                        <div key={b} className={active ? (isOne ? 'beat-amber' : 'beat-teal') : ''}
                                            style={{ width:13, height:13, borderRadius:'50%', transition:'background 0.05s, border-color 0.05s',
                                                background: active ? (isOne ? AMBER : TEAL) : t.dotInactive,
                                                border: '1.5px solid ' + (active ? (isOne ? AMBER : TEAL) : t.dotBorder),
                                            }}/>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Slider */}
                    <div style={{ marginBottom:18 }}>
                        <input type="range" min={MIN_BPM} max={MAX_BPM} value={bpm} aria-label="Tempo" aria-valuetext={bpm + ' BPM'}
                            onChange={(e) => changeBpm(Number(e.target.value))} style={{ background:sliderBg }}/>
                        <div aria-hidden="true" style={{ display:'flex', justifyContent:'space-between', fontFamily:MONO, fontSize:10, color:t.textMid, marginTop:5 }}>
                            <span>40</span><span>140</span><span>240</span>
                        </div>
                    </div>

                    {/* Presets */}
                    <div role="group" aria-label="Presets — tap to load, press and hold to save the current tempo" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
                        {presets.map((p, i) => {
                            const isSaved   = savedIdx === i;
                            const isCurrent = bpm === p && savedIdx === null;
                            return (
                                <button key={i} className={'preset' + (pressedBtn === 'p'+i ? ' btn-press' : '')}
                                    aria-label={isSaved ? 'Saved' : 'Preset ' + p + ' BPM'} aria-pressed={isCurrent}
                                    onClick={() => press('p'+i, () => changeBpm(p))}
                                    onPointerDown={() => startLP(i)} onPointerUp={cancelLP} onPointerCancel={cancelLP}
                                    onContextMenu={(e) => e.preventDefault()}
                                    onPointerLeave={cancelLP}
                                    style={{ ...gBtn({ fontFamily:MONO, fontSize:13, padding:'9px 0' }),
                                        background: isSaved ? 'rgba(242,177,52,0.18)' : isCurrent ? 'rgba(22,179,163,0.15)' : t.btnBg,
                                        borderColor: isSaved ? AMBER : isCurrent ? TEAL : t.btnBorder,
                                        color: isSaved ? (dark ? AMBER : '#8a5a00') : t.text,
                                    }}>
                                    {isSaved ? '✓ saved' : p}
                                </button>
                            );
                        })}
                    </div>

                    {/* Start/Stop */}
                    <button onClick={toggle} className="plain"
                        style={{ width:'100%', padding:'13px 0', borderRadius:14, border:'none', cursor:'pointer',
                            fontFamily:GROTESK, fontWeight:700, fontSize:17, color: isPlaying ? PAPER : INK,
                            display:'flex', alignItems:'center', justifyContent:'center', gap:9, marginBottom:12,
                            background: isPlaying ? 'linear-gradient(135deg,#b45309,#92400e)' : 'linear-gradient(135deg,#16B3A3,#13a294)',
                            boxShadow: isPlaying ? '0 4px 20px rgba(180,83,9,0.4),inset 0 1px 0 rgba(255,255,255,0.1)' : '0 4px 20px rgba(22,179,163,0.35),inset 0 1px 0 rgba(255,255,255,0.15)',
                            animation: isPlaying && !reduceMotion ? 'pulseGlow 2s ease-in-out infinite' : 'none',
                            transition: 'background 0.25s, box-shadow 0.25s',
                        }}>
                        {isPlaying ? <><Pause size={20}/>Stop</> : <><Play size={20}/>Start</>}
                    </button>

                    {/* ±BPM and Tap */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.3fr 1fr 1fr', gap:7, marginBottom:14 }}>
                        {[[-5,'−5','Slower by 5'],[-1,'−1','Slower by 1']].map(([d,lbl,aria]) => (
                            <button key={d} aria-label={aria} onClick={() => press('d'+d, () => changeBpm(bpm+d))}
                                className={pressedBtn==='d'+d ? 'btn-press' : ''} style={gBtn({ fontFamily:MONO, fontSize:13, padding:'9px 0' })}>{lbl}</button>
                        ))}
                        <button aria-label="Tap tempo — tap in time to set the BPM"
                            onPointerDown={(e) => { if (e.button === 0) tap(); }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); } }}
                            onContextMenu={(e) => e.preventDefault()}
                            className={'tap' + (pressedBtn==='tap' ? ' btn-press' : '')}
                            style={gBtn({ fontFamily:GROTESK, fontWeight:700, fontSize:14, padding:'9px 0', borderColor:TEAL, color:t.text })}>Tap</button>
                        {[[1,'+1','Faster by 1'],[5,'+5','Faster by 5']].map(([d,lbl,aria]) => (
                            <button key={d} aria-label={aria} onClick={() => press('d'+d, () => changeBpm(bpm+d))}
                                className={pressedBtn==='d'+d ? 'btn-press' : ''} style={gBtn({ fontFamily:MONO, fontSize:13, padding:'9px 0' })}>{lbl}</button>
                        ))}
                    </div>

                    {/* Time Signature */}
                    <div role="group" aria-labelledby="sig-label">
                        <div id="sig-label" style={{ fontFamily:MONO, fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:t.label, textAlign:'center', marginBottom:8 }}>Time Signature</div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6, marginBottom:14 }}>
                            {SIGS.map((sig) => {
                                const active = timeSig === sig;
                                return (
                                    <button key={sig} onClick={() => setTimeSig(sig)} aria-pressed={active}
                                        style={{ ...gBtn({ fontSize:12, padding:'8px 0' }),
                                            color: active ? t.sigActiveText : t.textMid,
                                            background: active ? 'rgba(110,86,207,0.25)' : t.btnBg,
                                            borderColor: active ? PURPLE : t.btnBorder,
                                            boxShadow: active ? '0 0 10px rgba(110,86,207,0.2)' : 'none',
                                        }}>
                                        {sig}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Toggles */}
                    <div style={{ borderTop:'1px solid ' + t.divider, paddingTop:10, display:'flex', flexDirection:'column', gap:4, alignItems:'center' }}>
                        <Toggle on={accentBeat} onToggle={toggleAccent} label="ACCENT BEAT ONE" t={t}/>
                        <Toggle on={upToEleven} onToggle={toggleEleven} label="UP TO ELEVEN 🎸" t={t}/>
                    </div>
                </div>

                {/* Version */}
                <div style={{ textAlign:'center', marginTop:12, fontFamily:MONO, fontSize:10, letterSpacing:'0.08em', color:t.textMid }}>v{VERSION}</div>
            </div>

            {/* Help */}
            <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title="How to Use" t={t}>
                <Section t={t} title="Getting Started">Tap Start. The first beat plays straight away, and the screen stays on while it plays.</Section>
                <Section t={t} title="Setting the Tempo">Drag the slider, use −5, −1, +1 and +5 for fine steps, or tap a preset. Changes take effect straight away, even while it's playing.</Section>
                <Section t={t} title="Tap Tempo">Tap the <b>Tap</b> button in time with the music, four or five times. Metronome sets the BPM from your last few taps. Wait two seconds to start over.</Section>
                <Section t={t} title="Presets">Tap a preset to load it. To save the current tempo to a preset, press and hold it for about half a second, until it shows ✓ saved. Presets are remembered on this device.</Section>
                <Section t={t} title="Time Signatures">Choose 2/4, 3/4, 4/4, 5/4 or 6/8. 6/8 is counted in two groups of three, so its dots are grouped, and with Accent Beat One on, beat four gets a lighter accent too.</Section>
                <Section t={t} title="Beat Dots"><span style={{ color: dark ? AMBER : '#8a5a00' }}>Amber</span> marks beat one; <span style={{ color:t.link }}>teal</span> marks the rest.</Section>
                <Section t={t} title="Accent Beat One">Plays beat one higher (1200 Hz instead of 1000 Hz) and a little louder, so you can feel the start of each bar. Remembered on this device.</Section>
                <Section t={t} title="Up to Eleven 🎸">Doubles the volume of the click, for when it has to cut through a loud band. Named for Spinal Tap's famous amp. Remembered on this device.</Section>
                <Section t={t} title="No Sound on iPhone?">
                    <P>Turn the volume up with the side buttons. On recent iPhones the click plays even with the silent switch on; on older iOS versions, switch silent mode off.</P>
                    <P last>If a phone call or another app took over the sound, tap Stop, then Start.</P>
                </Section>
                <Section t={t} title="Install It">
                    <P><b>iPhone:</b> in Safari, tap Share, then Add to Home Screen. <b>Android:</b> in Chrome, open the menu and choose Install app or Add to Home screen.</P>
                    <P last>Once it has opened once, Metronome works without an internet connection.</P>
                </Section>
                <Section t={t} title="Keyboard">Space starts and stops. T taps the tempo. Arrow keys move the slider when it's selected.</Section>
                <Section t={t} title="Light / Dark Mode">Tap the sun or moon at the top. Remembered on this device.</Section>
            </Modal>

            {/* About */}
            <Modal isOpen={showAbout} onClose={() => setShowAbout(false)} title="About" t={t}>
                <Section t={t} title={'Metronome ' + VERSION}>A steady, good-looking metronome. Clicks are scheduled ahead with your browser's Web Audio clock, so the beat stays even when the screen is busy.</Section>
                <Section t={t} title="Made by bitScribbles">
                    <P>Small apps, carefully made. Every app starts as a scribble.</P>
                    <P last>This one started as a challenge from musician friends: make a metronome that doesn't suck. No ads, no sign-up, no silly fees, just a good click.</P>
                </Section>
                <Section t={t} title="Private by Design">No account, no ads, no tracking, and nothing is sent anywhere. Your presets and settings are remembered in this browser only.</Section>
                <Section t={t} title="Disclaimer">Provided as is, for practice, without warranty. For professional recording, use your studio's own clock.</Section>
                <Section t={t} title="Support">
                    <P>Ideas, problems, a feature you'd like: write any time. Metronome is free, with no ads or paid version. If it helps your practice, you can buy me a coffee.</P>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
                        <a href={'mailto:support@bitscribbles.com?subject=' + encodeURIComponent('Metronome ' + VERSION)}
                            style={{ display:'inline-block', background:TEAL, color:INK, fontFamily:INTER, fontWeight:600, fontSize:13, padding:'9px 16px', borderRadius:999, textDecoration:'none' }}>Send feedback</a>
                        <a href="https://www.buymeacoffee.com/bitscribbles" target="_blank" rel="noopener noreferrer"
                            style={{ display:'inline-block', background:AMBER, color:INK, fontFamily:INTER, fontWeight:600, fontSize:13, padding:'9px 16px', borderRadius:999, textDecoration:'none' }}>☕ Buy me a coffee</a>
                    </div>
                    <P last><span style={{ display:'block', marginTop:8, fontSize:13 }}>support@bitscribbles.com</span></P>
                </Section>
                <Section t={t} title="Credits">
                    <P>Open source under the MIT licence. The code is on <a href="https://github.com/Hubert-BitScribbles/Metronome" target="_blank" rel="noopener noreferrer" style={{ color:t.link }}>GitHub</a>.</P>
                    <P>Fonts: Space Grotesk, Inter, JetBrains Mono and Caveat, under the SIL Open Font License. Built with React (MIT licence).</P>
                    <P last>© 2026 bitScribbles</P>
                </Section>
                <div style={{ borderTop:'1px solid ' + t.divider, paddingTop:14, textAlign:'center', fontFamily:MONO, fontSize:10, letterSpacing:'0.08em', color:t.textMid }}>
                    {'/* made with ♪ for musicians everywhere */'}
                </div>
            </Modal>
        </main>
    );
};

createRoot(document.getElementById('root')).render(<Metronome />);
