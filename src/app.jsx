// Metronome by bitScribbles — app source.
// Edit this file, then build it into ../app.js (see README.md). The browser runs app.js.
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const VERSION = '1.8.0';

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

// ── Sound ───────────────────────────────────────────────────────
// Volume 1–10 moves the normal click in 3 dB steps around 7 (today's click):
// 1 is 18 dB quieter, 10 is 9 dB louder. 11 is a different, louder click.
const volumeGain = (v) => Math.pow(10, (v - 7) * 3 / 20);

const makeNoise = (ctx, seconds) => {
    const n = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    return src;
};
// A short burst of `node` from `time`, fading out over `length` seconds
const burst = (ctx, node, dest, time, level, length) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + length);
    node.connect(g); g.connect(dest);
    node.start(time); node.stop(time + length);
    return g;
};

// Two signal paths, built once:
//  volume → a safety limiter that does nothing below 0.7 and rounds off anything louder
//           (so 9 and 10 never crackle) → speakers
//  eleven → a soft clip that lets the loud click be driven hard without distortion → speakers
const makeBuses = (ctx, volume) => {
    const shaper = (curveFn, oversample) => {
        const N = 4096, c = new Float32Array(N);
        for (let i = 0; i < N; i++) c[i] = curveFn(i / (N - 1) * 2 - 1);
        const w = ctx.createWaveShaper(); w.curve = c; w.oversample = oversample;
        return w;
    };
    const vol = ctx.createGain(); vol.gain.value = volumeGain(volume);
    const half = ctx.createGain(); half.gain.value = 0.5;       // the curve covers inputs up to ±2
    const safety = shaper((u) => {
        const x = u * 2, a = Math.abs(x);
        return Math.sign(x) * (a <= 0.7 ? a : 0.7 + 0.25 * Math.tanh((a - 0.7) / 0.25));
    }, 'none');
    vol.connect(half); half.connect(safety); safety.connect(ctx.destination);

    const drive = ctx.createGain(); drive.gain.value = 0.6;
    const clip = shaper((u) => Math.tanh(u * 2.5) / Math.tanh(2.5), '4x');
    const out = ctx.createGain(); out.gain.value = 0.92;
    drive.connect(clip); clip.connect(out); out.connect(ctx.destination);
    return { ctx, volume: vol, eleven: drive };
};

// Today's click, unchanged: a 12 ms 1000 Hz tick plus an 8 ms noise edge
// (1100 / 1200 Hz and a little louder on accented beats)
const normalClick = (ctx, dest, time, accent) => {
    const vol  = 0.3 * [1, 1.25, 1.5][accent];
    const freq = [1000, 1100, 1200][accent];
    const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
    burst(ctx, osc, dest, time, vol, 0.012);
    const noise = makeNoise(ctx, 0.008);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 3.5;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol * 0.6, time); g.gain.exponentialRampToValueAtTime(0.001, time + 0.008);
    noise.connect(f); f.connect(g); g.connect(dest); noise.start(time); noise.stop(time + 0.008);
};

// Eleven: about three times as loud (+18 dB). A longer body (35 ms), a bright square-wave
// edge and a 3 kHz noise crack — 2–5 kHz is where phone speakers and ears are most sensitive.
const loudClick = (ctx, dest, time, accent) => {
    const v    = [1, 1.2, 1.4][accent];
    const freq = [1000, 1100, 1200][accent];
    const body = ctx.createOscillator(); body.frequency.value = freq;
    burst(ctx, body, dest, time, 0.9 * v, 0.035);
    const edge = ctx.createOscillator(); edge.type = 'square'; edge.frequency.value = freq;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5000;
    const eg = ctx.createGain(); eg.gain.setValueAtTime(0.5 * v, time); eg.gain.exponentialRampToValueAtTime(0.001, time + 0.025);
    edge.connect(lp); lp.connect(eg); eg.connect(dest); edge.start(time); edge.stop(time + 0.025);
    const noise = makeNoise(ctx, 0.012);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = 1.5;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.8 * v, time); ng.gain.exponentialRampToValueAtTime(0.001, time + 0.012);
    noise.connect(bp); bp.connect(ng); ng.connect(dest); noise.start(time); noise.stop(time + 0.012);
};

// ── Welcome: what it is and where things are; then, in a browser tab, how to install it ──
// Device and browser detection and the install steps are ported from Liquid Clock 1.9.0, which took
// them from Clear Tracker (src/lib/install.ts). Install clips follow
// claude/platform/install-clips/README.md: beside the written steps, browser tab only, iPhone only,
// Safari's clip for Safari 27+, closed until tapped, fetched whole and played from memory, and never
// cached offline (sw.js skips clips/).
const OS_N = { iphone:'iPhone', ipad:'iPad', android:'Android', mac:'Mac', windows:'Windows', linux:'Linux', other:'another device' };
const BR_N = { safari:'Safari', chrome:'Chrome', edge:'Edge', firefox:'Firefox', samsung:'Samsung Internet', other:'another browser' };
const DEV_A = { iphone:'an iPhone', ipad:'an iPad', android:'an Android device', mac:'a Mac', windows:'a Windows computer', linux:'a Linux computer', other:'another device' };
function detectDevice(ua, touchMac) {
    let os = 'other', br = 'other';
    if (/iPhone|iPod/.test(ua)) os = 'iphone';
    else if (/iPad/.test(ua) || (/Macintosh/.test(ua) && touchMac)) os = 'ipad';
    else if (/Android/i.test(ua)) os = 'android';
    else if (/Macintosh|Mac OS X/.test(ua)) os = 'mac';
    else if (/Windows/.test(ua)) os = 'windows';
    else if (/Linux|CrOS/.test(ua)) os = 'linux';
    if (/EdgiOS|EdgA|Edg\//.test(ua)) br = 'edge';
    else if (/SamsungBrowser/.test(ua)) br = 'samsung';
    else if (/FxiOS|Firefox\//.test(ua)) br = 'firefox';
    else if (/CriOS|Chrome\/|Chromium\//.test(ua)) br = 'chrome';
    else if (/Safari\//.test(ua) && /Version\//.test(ua)) br = 'safari';
    else if (os === 'iphone' || os === 'ipad') br = 'safari';
    return { os, browser: br };
}
// Safari's user agent freezes the iOS version, but its Version/NN token still follows the major release
function safariMajor(ua) {
    if (detectDevice(ua).browser !== 'safari') return null;
    const m = /Version\/(\d+)/.exec(ua);
    return m ? +m[1] : null;
}
const detectedDevice = () => detectDevice(navigator.userAgent, navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function savedDevice() {
    try { const d = JSON.parse(store.get('bs-device') || 'null'); if (d && d.os in OS_N && d.browser in BR_N) return d; } catch {}
    return detectedDevice();
}
const isInstalled = () => {
    try { return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true; }
    catch { return false; }
};
// The browser's own install prompt (Chrome, Edge, Samsung Internet), kept for the Install button
let installEvt = null;
const installListeners = new Set();
const tellInstall = () => installListeners.forEach((f) => f());
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; tellInstall(); });
window.addEventListener('appinstalled', () => { installEvt = null; tellInstall(); });

const SAFARI_MENU_AT_LEFT = 27;
const CLIPS = {
    safari: { src:'clips/install-iphone-safari.mp4', poster:'clips/install-iphone-safari.jpg', secs:26,
        label:'Video of the steps above, in Safari: tap ≡ at the left of the address bar, then Share, View More and Add to Home Screen, keep Open as Web App on and tap Add.' },
    chrome: { src:'clips/install-iphone-chrome.mp4', poster:'clips/install-iphone-chrome.jpg', secs:24,
        label:'Video of the steps above, in Chrome: tap Share in the address bar, then View More, scroll down to Add to Home Screen, keep Open as Web App on and tap Add.' },
};
// Steps are our own text with <b> for the names on screen
function installGuide(d, offer, safari) {
    const br = d.browser === 'other' ? 'this browser' : BR_N[d.browser], ios = d.os === 'iphone' || d.os === 'ipad';
    const open = 'Open Metronome from your Home Screen.', add = 'Keep <b>Open as Web App</b> on, then tap <b>Add</b>.';
    const why = 'Installed, Metronome opens in a tap, without the browser’s bars, and works offline.';
    if (ios) {
        let steps, clip = null;
        if (d.os === 'iphone' && d.browser === 'safari' && (safari === null || safari >= SAFARI_MENU_AT_LEFT)) {
            clip = 'safari';
            steps = ['Tap <b>≡</b> at the left of the address bar, then <b>Share</b>. If Share is already in the toolbar, tap it there.',
                'Tap <b>View More</b>, then <b>Add to Home Screen</b> (scroll down if you don’t see it).', add, open];
        } else if (d.os === 'iphone' && d.browser === 'chrome') {
            clip = 'chrome';
            steps = ['Tap <b>Share</b> in the address bar.', 'Tap <b>View More</b>, then scroll down to <b>Add to Home Screen</b>, in the second group, below <b>Print</b>.', add, open];
        } else {
            steps = [d.browser === 'safari' ? 'Tap <b>⋯</b> next to the address bar, then <b>Share</b>. If Share is already in the toolbar, tap it there.'
                : d.browser === 'chrome' ? 'Tap <b>Share</b> in the address bar.'
                : `Open ${d.browser === 'other' ? 'the browser' : BR_N[d.browser]}’s menu and tap <b>Share</b>.`,
                'Choose <b>Add to Home Screen</b> (scroll down if you don’t see it), keep <b>Open as Web App</b> on if it’s offered, then tap <b>Add</b>.', open];
        }
        return { head:'Add it to your Home Screen', why, steps, clip,
            note:`The Home Screen Metronome keeps its own presets and settings, separate from ${br}, so set them up there.` };
    }
    if (d.os === 'mac' && d.browser === 'safari') return { head:'Add it to your Dock', why,
        steps:['In the menu bar, choose <b>File → Add to Dock</b> (macOS Sonoma or later), then <b>Add</b>.', 'Open Metronome from the Dock.'],
        note:'The Dock app keeps its own presets and settings, separate from Safari.' };
    if (d.browser === 'firefox' && d.os !== 'android') { const k = d.os === 'mac' ? '⌘' : 'Ctrl'; return { head:'Keep it handy',
        why:'Firefox can’t install Metronome as an app on a computer, but it runs well in a tab.',
        steps:[`Bookmark this page (<b>${k}+D</b>).`, 'For an app window that works offline, open this page in Chrome or Edge instead.'], note:'' }; }
    const android = d.os === 'android';
    const steps = offer ? ['Tap <b>Install Metronome</b> below.']
        : android ? [d.browser === 'samsung' ? 'Tap <b>≡</b>, then <b>Add page to → Home screen</b>.'
            : d.browser === 'firefox' ? 'Tap <b>⋮</b>, then <b>Add to Home screen</b>.'
            : `Tap <b>${d.browser === 'edge' ? '⋯' : '⋮'}</b>, then <b>Install app</b> or <b>Add to Home screen</b>.`, open]
        : d.browser === 'edge' ? ['Open Edge’s menu (<b>⋯</b>) and choose <b>Apps → Install this site as an app</b>.']
        : d.browser === 'chrome' ? ['Click the install icon at the right of the address bar, or open <b>⋮ → Cast, save and share → Install page as app</b>.']
        : ['Look in your browser’s menu for <b>Install</b> or <b>Add to Home Screen</b>.'];
    return { head: android ? 'Add it to your Home Screen' : 'Install it as an app', why, steps, note:'' };
}
// First visit only. People who used Metronome before this version already know it: any saved setting
// (bs-sig is saved on every visit since 1.6.0) means they've been here. Read before the app saves anything.
const USED_BEFORE = ['bs-sig', 'bs-theme', 'bs-volume', 'bs-accent', 'bs-eleven', 'metronome-presets'].some((k) => store.get(k) !== null);
const FORCE_WELCOME = /[?&]welcome\b/.test(location.search);   // ?welcome shows it again, for trying it out

// ── Components ──────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children, t, closeLabel = 'Close', focusKey }) {
    const boxRef   = useRef(null);
    const closeRef = useRef(null);
    const headRef  = useRef(null);
    const bodyRef  = useRef(null);
    useEffect(() => {
        if (!isOpen) return;
        const opener = document.activeElement;
        closeRef.current && closeRef.current.focus();
        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
            if (e.key !== 'Tab' || !boxRef.current) return;
            const f = [...boxRef.current.querySelectorAll('button, a[href], input, select, video[controls], [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);
            if (!f.length) return;
            const first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('keydown', onKey); opener && opener.focus && opener.focus(); };
    }, [isOpen]);
    // A new screen in the same dialog (the welcome's 1 → 2): start at its top, focus its heading
    const firstKey = useRef(true);
    useEffect(() => {
        if (!isOpen) { firstKey.current = true; return; }
        if (firstKey.current) { firstKey.current = false; return; }
        if (bodyRef.current) bodyRef.current.scrollTop = 0;
        headRef.current && headRef.current.focus({ preventScroll: true });
    }, [focusKey, isOpen]);
    if (!isOpen) return null;
    const id = 'dlg-' + title.replace(/\W+/g, '-').toLowerCase();
    return (
        <div onClick={(e) => e.target === e.currentTarget && onClose()}
            className="dialog-overlay"
            style={{ background:'rgba(20,23,28,0.6)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)' }}>
            {/* The header (title and ✕) never scrolls; only the body does. Height is capped
                at the visible screen in index.html (.dialog), so the ✕ is always reachable. */}
            <div ref={boxRef} role="dialog" aria-modal="true" aria-labelledby={id} className="dialog"
                style={{ background:t.modalBg, border:'1px solid ' + t.cardBorder, borderRadius:20, boxShadow:t.cardShadow, animation: reduceMotion ? 'none' : 'modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, padding:'18px 18px 14px 28px', borderBottom:'1px solid ' + t.divider, flexShrink:0 }}>
                    <h2 id={id} ref={headRef} tabIndex={-1} style={{ margin:0, fontFamily:GROTESK, fontWeight:700, fontSize:18, color:t.text, outline:'none' }}>{title}</h2>
                    <button ref={closeRef} onClick={onClose} aria-label={closeLabel} style={{ background:t.btnBg, border:'1px solid ' + t.btnBorder, borderRadius:12, width:44, height:44, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:t.textMid, cursor:'pointer' }}>
                        <X size={18}/>
                    </button>
                </div>
                <div className="dialog-body" ref={bodyRef} tabIndex={0} style={{ padding:'18px 28px 24px', fontFamily:INTER, fontSize:14, lineHeight:1.65, color:t.textBody }}>{children}</div>
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

// The welcome: 1 — what Metronome is and where everything is; 2 — how to install it on this device
function Welcome({ open, screen, setScreen, onClose, t, dark }) {
    const installed = isInstalled();
    const [dev, setDev]           = useState(savedDevice);
    const [picking, setPicking]   = useState(false);
    const [, bump]                = useState(0);          // re-render when the install prompt arrives or is used
    const [clipOn, setClipOn]     = useState(false);
    const [clipUrl, setClipUrl]   = useState(null);
    const [clipErr, setClipErr]   = useState(false);
    useEffect(() => { const f = () => bump((n) => n + 1); installListeners.add(f); return () => installListeners.delete(f); }, []);
    const g = installGuide(dev, !!installEvt, safariMajor(navigator.userAgent));
    const clip = g.clip ? CLIPS[g.clip] : null;
    // The clip is fetched whole and played from memory: iPhone Safari plays streamed video only if the
    // server's byte ranges are just so. Its memory is freed when it's hidden or the guide changes.
    const stopClip = () => { setClipOn(false); setClipErr(false); setClipUrl((u) => { if (u) URL.revokeObjectURL(u); return null; }); };
    useEffect(() => { stopClip(); }, [g.clip, open, screen]);
    useEffect(() => {
        if (!clipOn || !clip) return;
        let gone = false;
        fetch(clip.src).then((r) => r.ok ? r.blob() : Promise.reject(r.status))
            .then((b) => { if (!gone) setClipUrl(URL.createObjectURL(b)); })
            .catch(() => { if (!gone) setClipErr(true); });
        return () => { gone = true; };
    }, [clipOn, g.clip]);
    const pick = (os, browser) => {
        const d = { os, browser }, a = detectedDevice();
        if (os === a.os && browser === a.browser) { try { localStorage.removeItem('bs-device'); } catch {} }
        else store.set('bs-device', JSON.stringify(d));
        setDev(d);
    };
    const doInstall = async () => {
        if (!installEvt) return;
        const e = installEvt; installEvt = null;
        try { await e.prompt(); await e.userChoice; } catch {}
        tellInstall();
    };

    const eyebrow = (s) => <div style={{ fontFamily:MONO, fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:t.label, marginBottom:10 }}>{s}</div>;
    const btn = (primary) => ({ minHeight:44, padding:'10px 18px', borderRadius:999, fontFamily:INTER, fontWeight:600, fontSize:14, cursor:'pointer',
        background: primary ? TEAL : 'none', color: primary ? INK : t.text,
        borderWidth:1, borderStyle:'solid', borderColor: primary ? TEAL : t.btnBorder });
    const acts = (children) => <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'flex-end', marginTop:18 }}>{children}</div>;
    const linkBtn = { background:'none', border:'none', padding:'10px 2px', margin:'-10px -2px', color:t.link, fontFamily:INTER, fontWeight:600, fontSize:14, cursor:'pointer', textDecoration:'underline', textUnderlineOffset:3 };
    const chip = (icon, label) => (
        <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:10, border:'1px solid ' + t.btnBorder, background:t.btnBg, color:t.textMid, fontFamily:INTER, fontWeight:600, fontSize:12 }}>
            {icon}{label}
        </span>
    );
    const start = installed ? 'Start practising' : null;

    const one = (
        <>
            {!installed && eyebrow('1 of 2')}
            <p style={{ margin:'0 0 8px', fontFamily:GROTESK, fontWeight:700, fontSize:20, lineHeight:1.3, color:t.text }}>A metronome that doesn’t suck.</p>
            <P>Made because a friend wanted one: a steady click from 40 to 240 BPM, tap tempo, five time signatures, an accent on beat one, and a volume that goes to 11. No ads, no sign-up, and it keeps working offline.</P>
            <div style={{ marginTop:16, padding:'14px 16px', border:'1px solid ' + t.divider, borderRadius:14 }}>
                <h3 style={{ margin:'0 0 8px', fontFamily:MONO, fontWeight:400, fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:t.label }}>Where everything is</h3>
                <P><b>Everything you set is on the one screen:</b> tempo, presets, time signature, accent and volume. Metronome remembers your choices on this device.</P>
                <div aria-hidden="true" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, margin:'10px 0 8px', padding:'8px 10px', borderRadius:12, background:t.btnBg }}>
                    {chip(<HelpCircle size={13}/>, 'Help')}{chip(dark ? <Sun size={13}/> : <Moon size={13}/>, '')}{chip(<Info size={13}/>, 'About')}
                </div>
                <P last>At the top: <b>Help</b> explains every control, the <b>{dark ? 'sun' : 'moon'}</b> switches between light and dark, and <b>About</b> has the rest. To save a tempo, <b>press and hold a preset</b> until it shows ✓ saved.</P>
            </div>
            {acts(<button type="button" style={btn(true)} onClick={() => installed ? onClose() : setScreen(2)}>{start || 'Next'}</button>)}
        </>
    );

    const two = (
        <>
            {eyebrow('2 of 2')}
            <P>{g.why}</P>
            <p style={{ margin:'0 0 8px', fontSize:13, color:t.textMid }}>
                Looks like you’re using {DEV_A[dev.os]}, in {BR_N[dev.browser]}.{' '}
                <button type="button" style={{ ...linkBtn, fontSize:13 }} aria-expanded={picking} onClick={() => setPicking((v) => !v)}>Not right? Change</button>
            </p>
            {picking && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'10px 16px', margin:'4px 0 12px' }}>
                    {[['Device', 'os', OS_N, 'Another device'], ['Browser', 'browser', BR_N, 'Another browser']].map(([lbl, key, names, other]) => (
                        <label key={key} style={{ display:'flex', flexDirection:'column', gap:4, fontSize:13, color:t.textMid }}>{lbl}
                            <select value={dev[key]} onChange={(e) => key === 'os' ? pick(e.target.value, dev.browser) : pick(dev.os, e.target.value)}
                                style={{ fontFamily:INTER, fontSize:16, color:t.text, background:t.btnBg, border:'1px solid ' + t.btnBorder, borderRadius:10, padding:'8px 10px', minHeight:44 }}>
                                {Object.keys(names).map((k) => <option key={k} value={k} style={{ color:INK }}>{k === 'other' ? other : names[k]}</option>)}
                            </select>
                        </label>
                    ))}
                </div>
            )}
            <ol style={{ margin:'4px 0 12px', paddingLeft:22 }}>
                {g.steps.map((x, i) => <li key={i} style={{ margin:'0 0 8px' }} dangerouslySetInnerHTML={{ __html: x }}/>)}
            </ol>
            {clip && (
                <div style={{ margin:'2px 0 12px' }}>
                    <button type="button" style={linkBtn} aria-expanded={clipOn} onClick={() => clipOn ? stopClip() : setClipOn(true)}>
                        {clipOn ? 'Hide the video' : `▶ Show me how · ${clip.secs} s video`}
                    </button>
                    {clipOn && (
                        <figure style={{ margin:'12px 0 0' }}>
                            <video src={clipUrl || undefined} poster={clip.poster} muted loop playsInline
                                autoPlay={!reduceMotion} controls={reduceMotion} aria-label={clip.label}
                                style={{ display:'block', width:200, maxWidth:'100%', aspectRatio:'9 / 16', height:'auto', borderRadius:16, border:'1px solid ' + t.divider, background:'#EDEAF7' }}/>
                            <figcaption style={{ marginTop:6, fontSize:12, color:t.textMid }}>
                                {clipErr ? 'The video needs an internet connection. The steps above say the same.' : `${BR_N[dev.browser]}, step by step · no sound`}
                            </figcaption>
                        </figure>
                    )}
                </div>
            )}
            {g.note && <p style={{ margin:'0 0 8px', fontSize:13, color:t.textMid }}>{g.note}</p>}
            {acts(<>
                <button type="button" style={btn(false)} onClick={() => setScreen(1)}>Back</button>
                {installEvt && <button type="button" style={btn(true)} onClick={doInstall}>Install Metronome</button>}
                <button type="button" style={btn(!installEvt)} onClick={onClose}>Start practising</button>
            </>)}
        </>
    );

    const shown = installed ? 1 : screen;
    return (
        <Modal isOpen={open} onClose={onClose} t={t} closeLabel="Skip" focusKey={shown}
            title={shown === 1 ? 'Welcome to Metronome' : g.head}>
            {shown === 1 ? one : two}
        </Modal>
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
    const [welcome, setWelcome]         = useState({ open:false, screen:1 });
    const [pressedBtn, setPressedBtn]   = useState(null);
    const [accentBeat, setAccentBeat]   = useState(() => store.get('bs-accent') === 'true');
    const [upToEleven, setUpToEleven]   = useState(() => store.get('bs-eleven') === 'true');
    const [volume, setVolume]           = useState(() => { const v = parseFloat(store.get('bs-volume')); return v >= 1 && v <= 10 ? v : 7; });

    const audioCtx     = useRef(null);
    const nextNote     = useRef(0);
    const schedulerRef = useRef(null);
    const bpmRef       = useRef(bpm);
    const beatRef      = useRef(0);
    const sigRef       = useRef(timeSig);
    const accentRef    = useRef(accentBeat);
    const elevenRef    = useRef(upToEleven);
    const volumeRef    = useRef(volume);
    const buses        = useRef(null);
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
    useEffect(() => { modalOpen.current = showHelp || showAbout || welcome.open; }, [showHelp, showAbout, welcome.open]);
    // First visit (or ?welcome): the welcome, once
    useEffect(() => {
        if (FORCE_WELCOME || (!USED_BEFORE && !store.get('bs-welcomed'))) {
            const id = setTimeout(() => setWelcome({ open:true, screen:1 }), 400);
            return () => clearTimeout(id);
        }
    }, []);
    const closeWelcome = () => { store.set('bs-welcomed', '1'); setWelcome((w) => ({ ...w, open:false })); };
    const showInstall  = () => { setShowHelp(false); setWelcome({ open:true, screen:2 }); };

    const toggleAccent = () => setAccentBeat(a => { store.set('bs-accent', String(!a)); return !a; });
    const toggleEleven = () => setUpToEleven(e => { store.set('bs-eleven', String(!e)); return !e; });
    // Sliding the volume always comes back from 11 to the slider
    const changeVolume = (v) => {
        setVolume(v); store.set('bs-volume', v.toFixed(1));
        if (elevenRef.current) { setUpToEleven(false); store.set('bs-eleven', 'false'); }
    };
    useEffect(() => {
        volumeRef.current = volume;
        const b = buses.current;
        if (b) b.volume.gain.setTargetAtTime(volumeGain(volume), b.ctx.currentTime, 0.02);
    }, [volume]);

    // ── Audio ──
    const initAudio = () => {
        // iPhone: ask for "playback" audio so the click still sounds with the
        // ring/silent switch on (Safari 17 and later; ignored elsewhere).
        try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
            buses.current = makeBuses(audioCtx.current, volumeRef.current);
            setAudioReady(true);
        }
        if (audioCtx.current.state !== 'running') audioCtx.current.resume().catch(() => {});
    };

    // level: 2 = beat one (accented), 1 = secondary accent (6/8 beat four), 0 = other beats
    const playClick = (time, level) => {
        const accent = accentRef.current ? level : 0;
        if (elevenRef.current) loudClick(audioCtx.current, buses.current.eleven, time, accent);
        else normalClick(audioCtx.current, buses.current.volume, time, accent);
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
    const volPct    = ((volume - 1) / 9) * 100;
    const volBg     = 'linear-gradient(to right,' + TEAL + ' 0%,' + TEAL + ' ' + volPct + '%,' + t.sliderTrack + ' ' + volPct + '%,' + t.sliderTrack + ' 100%)';
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

                    {/* Accent, then volume: the slider glides from 1 to 10; 11 has to be tapped */}
                    <div style={{ borderTop:'1px solid ' + t.divider, paddingTop:10, display:'flex', flexDirection:'column', gap:8, alignItems:'center' }}>
                        <Toggle on={accentBeat} onToggle={toggleAccent} label="ACCENT BEAT ONE" t={t}/>
                        <div role="group" aria-labelledby="vol-label" style={{ width:'100%' }}>
                            <div id="vol-label" style={{ fontFamily:MONO, fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:t.label, textAlign:'center', marginBottom:2 }}>
                                Volume <span style={{ color:t.text, fontVariantNumeric:'tabular-nums' }}>{upToEleven ? '11 🎸' : Math.round(volume)}</span>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                                <input type="range" min="1" max="10" step="0.1" value={volume} className="volume"
                                    aria-label="Volume" aria-valuetext={upToEleven ? 'Eleven' : Math.round(volume) + ' of 10'}
                                    onChange={(e) => changeVolume(Number(e.target.value))}
                                    style={{ background:volBg, opacity: upToEleven ? 0.45 : 1, flex:1, minWidth:0, width:'auto', transition:'opacity 0.2s' }}/>
                                <button onClick={toggleEleven} aria-pressed={upToEleven} aria-label="Eleven — the loudest click"
                                    title="Tap for eleven: the loudest click"
                                    style={{ ...gBtn({ fontFamily:GROTESK, fontWeight:700, fontSize:15, width:44, height:44, padding:0, borderRadius:999, flexShrink:0 }),
                                        background: upToEleven ? AMBER : t.btnBg,
                                        borderColor: upToEleven ? AMBER : t.btnBorder,
                                        color: upToEleven ? INK : t.text,
                                        boxShadow: upToEleven ? '0 0 14px rgba(242,177,52,0.55)' : 'none',
                                    }}>11</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Version */}
                <div style={{ textAlign:'center', marginTop:12, fontFamily:MONO, fontSize:10, letterSpacing:'0.08em', color:t.textMid }}>v{VERSION}</div>
            </div>

            {/* Help */}
            <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title="How to Use" t={t}>
                <Section t={t} title="Getting Started">Tap Start. The first beat plays straight away, and the screen stays on while it plays.</Section>
                <Section t={t} title="Setting the Tempo">
                    <P>Drag the slider, use −5, −1, +1 and +5 for fine steps, or tap a preset. Changes take effect straight away, even while it's playing.</P>
                    <P last><b>Why it goes to 240:</b> the classic wind-up metronome stops at 208, which is too slow for up-tempo jazz, thrash or a bluegrass breakdown. It also lets you hear every eighth note: set double your tempo, so 240 clicks eighth notes at 120.</P>
                </Section>
                <Section t={t} title="Tap Tempo">Tap the <b>Tap</b> button in time with the music, four or five times. Metronome sets the BPM from your last few taps. Wait two seconds to start over.</Section>
                <Section t={t} title="Presets">Tap a preset to load it. To save the current tempo to a preset, press and hold it for about half a second, until it shows ✓ saved. Presets are remembered on this device.</Section>
                <Section t={t} title="Time Signatures">Choose 2/4, 3/4, 4/4, 5/4 or 6/8. 6/8 is counted in two groups of three, so its dots are grouped, and with Accent Beat One on, beat four gets a lighter accent too.</Section>
                <Section t={t} title="Beat Dots"><span style={{ color: dark ? AMBER : '#8a5a00' }}>Amber</span> marks beat one; <span style={{ color:t.link }}>teal</span> marks the rest.</Section>
                <Section t={t} title="Accent Beat One">Plays beat one higher (1200 Hz instead of 1000 Hz) and a little louder, so you can feel the start of each bar. Remembered on this device.</Section>
                <Section t={t} title="Volume, and Eleven 🎸">
                    <P>Slide to set the click against your music: 7 is the standard click, 10 the loudest regular setting, 1 quiet enough for late-night practice. Your phone's volume still sets the overall level.</P>
                    <P last>For a loud band, tap <b>11</b>: a brighter, longer click, nearly twice as loud as 10 (and over three times as loud as the standard click at 7). Named for Spinal Tap's famous amp. Why 11? It's one louder. Moving the slider goes back to it. Both are remembered on this device.</P>
                </Section>
                <Section t={t} title="No Sound on iPhone?">
                    <P>Turn the volume up with the side buttons. On recent iPhones the click plays even with the silent switch on; on older iOS versions, switch silent mode off.</P>
                    <P last>If a phone call or another app took over the sound, tap Stop, then Start.</P>
                </Section>
                <Section t={t} title="Install It">
                    {isInstalled()
                        ? <P last>You’re using the installed Metronome. It works without an internet connection.</P>
                        : <>
                            <P>Installed, Metronome opens in a tap, without the browser’s bars, and works without an internet connection.</P>
                            <button type="button" onClick={showInstall}
                                style={{ background:'none', border:'none', padding:'10px 2px', margin:'-10px -2px', color:t.link, fontFamily:INTER, fontWeight:600, fontSize:14, cursor:'pointer', textDecoration:'underline', textUnderlineOffset:3 }}>
                                How to install it on this device
                            </button>
                          </>}
                </Section>
                <Section t={t} title="Keyboard">Space starts and stops. T taps the tempo. Arrow keys move the slider when it's selected.</Section>
                <Section t={t} title="Light / Dark Mode">Tap the sun or moon at the top. Remembered on this device.</Section>
            </Modal>

            {/* About */}
            <Welcome open={welcome.open} screen={welcome.screen} setScreen={(n) => setWelcome((w) => ({ ...w, screen:n }))}
                onClose={closeWelcome} t={t} dark={dark}/>

            <Modal isOpen={showAbout} onClose={() => setShowAbout(false)} title="About" t={t}>
                <Section t={t} title={'Metronome ' + VERSION}>A steady, good-looking metronome. Clicks are scheduled ahead with your browser's Web Audio clock, so the beat stays even when the screen is busy.</Section>
                <Section t={t} title="Made by bitScribbles™">
                    <P>Small apps, carefully made. Every app starts as a scribble.</P>
                    <P>This one started as a challenge from musician friends: make a metronome that doesn't suck. No ads, no sign-up, no silly fees, just a good click.</P>
                    <P last>More of our apps, and the studio behind them, at <a href="https://bitscribbles.com" target="_blank" rel="noopener noreferrer" style={{ color:t.link }}>bitscribbles.com</a>.</P>
                </Section>
                <Section t={t} title="Private by Design">No account, no ads, no tracking, and nothing is sent anywhere. Your presets and settings are remembered in this browser only.</Section>
                <Section t={t} title="Disclaimer">Provided as is, for practice, without warranty. For professional recording, use your studio's own clock.</Section>
                <Section t={t} title="Support">
                    <P>Ideas, problems, a feature you'd like: write any time.</P>
                    <P>Metronome is free and stays free, with no ads or paid version. If it's helped your practice, you can help pay for hosting, testing and time. Contributing is entirely optional: Metronome works fully without it.</P>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
                        <a href={'mailto:support@bitscribbles.com?subject=' + encodeURIComponent('Metronome ' + VERSION)}
                            style={{ display:'inline-block', background:TEAL, color:INK, fontFamily:INTER, fontWeight:600, fontSize:13, padding:'9px 16px', borderRadius:999, textDecoration:'none' }}>Send feedback</a>
                        <a href="https://bitscribbles.com/takepart.html" target="_blank" rel="noopener noreferrer"
                            style={{ display:'inline-block', background:AMBER, color:INK, fontFamily:INTER, fontWeight:600, fontSize:13, padding:'9px 16px', borderRadius:999, textDecoration:'none' }}>Contribute</a>
                    </div>
                    <P last><span style={{ display:'block', marginTop:8, fontSize:13 }}>support@bitscribbles.com</span></P>
                </Section>
                <Section t={t} title="Credits">
                    <P>Open source under the MIT licence. The code is on <a href="https://github.com/Hubert-BitScribbles/Metronome" target="_blank" rel="noopener noreferrer" style={{ color:t.link }}>GitHub</a>.</P>
                    <P>Built with React (MIT licence). Fonts: Space Grotesk, Inter, JetBrains Mono and Caveat, under the SIL Open Font License. The clicks are made by Metronome itself. <a href="licenses.txt" target="_blank" rel="noopener noreferrer" style={{ color:t.link }}>All the licences</a></P>
                    <P last>© 2025–2026 bitScribbles Studio Ltd.</P>
                </Section>
                <div style={{ borderTop:'1px solid ' + t.divider, paddingTop:14, textAlign:'center', fontFamily:MONO, fontSize:10, letterSpacing:'0.08em', color:t.textMid }}>
                    {'/* made with ♪ for musicians everywhere */'}
                </div>
            </Modal>
        </main>
    );
};

createRoot(document.getElementById('root')).render(<Metronome />);
