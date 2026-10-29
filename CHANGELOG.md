# Changelog

## 1.7.3 — 28 October 2026

- **Help compares 11 with 10, not 7.** 11 sits next to 10 on the slider, so that's the comparison people make. Re-measured (A-weighted): 11 is 8.9 dB louder than 10 — nearly twice as loud — and 17.7 dB louder than the standard click at 7, over three times as loud. Help now says both.

## 1.7.2 — 28 October 2026

- **Help explains why the tempo goes to 240:** the classic wind-up metronome stops at 208, too slow for up-tempo jazz, thrash or a bluegrass breakdown; and setting double your tempo clicks every eighth note (240 = eighths at 120).
- **Volume, and Eleven:** "Why 11? It's one louder."

## 1.7.1 — 26 October 2026

- **bitScribbles Studio Ltd.** Metronome now belongs to bitScribbles Studio Ltd., incorporated in British Columbia on 26 October 2026 (BC1613702). The LICENSE names the company (it still read "Hubert-Vibe-Code" from 2025), and About's copyright line reads "© 2025–2026 bitScribbles Studio Ltd.". About already links to bitscribbles.com.

## 1.7.0 — 23 October 2026

- **Volume, and an 11 that's really louder.** "Up to Eleven" made the click only about 5.5 dB louder (measured), which sounds like "a bit louder". It's replaced by a **volume slider that glides from 1 to 10**, with an **11 button you have to tap**:
  - 7 is the standard click (unchanged, and the default); each step is 3 dB, so 10 is about 9 dB louder and 1 about 18 dB quieter — handy for setting the click against music playing from another app.
  - **11** is a different click: longer (35 ms), with a bright edge and a 3 kHz crack where phone speakers and ears are most sensitive. About 18 dB louder than 7 — roughly three times as loud — and soft-clipped so it never crackles.
  - Moving the slider comes back from 11. If Up to Eleven was on, Metronome opens at 11.
  - A safety limiter rounds off peaks at the top of the slider (an accented beat at 10 would otherwise have clipped). It doesn't touch the click below that.
- New checks for the volume slider and the 11 button.

## 1.6.3 — 23 October 2026

- **The ✕ on Help and About is always within reach.** It used to scroll away with the text, and on iPhone it could open tucked under the top edge. Now the title and ✕ stay fixed while only the text scrolls, the dialog is sized to the screen you can actually see (`dvh`, clear of the notch and home bar — same fix as Liquid Clock 1.6.3), and the ✕ is a full 44-point target. The scrolling text can be scrolled from the keyboard too.
- **About links the website:** "More of our apps, and the studio behind them, at bitscribbles.com."
- New check: the ✕ stays on screen, opened and scrolled, in portrait and sideways at iPhone size.

## 1.6.2 — 20 October 2026

- **bitScribbles™.** About's "Made by bitScribbles" heading carries the ™ sign, now that the trademark search came back clear.

## 1.6.1 — 19 October 2026

- **Open-source credits in full.** About → Credits links to **licenses.txt**: React, React DOM and scheduler (bundled into `app.js`), each with its full MIT licence, and the fonts' SIL Open Font License. `npm run build` rewrites it from esbuild's record of what it bundled, so it can't fall behind. Saved for offline use.

## 1.6.0 — 9 October 2026

**New**
- **Tap tempo.** A Tap button between −1 and +1 sets the BPM from your last few taps; a two-second pause starts over. T on a keyboard taps too.
- **The screen stays on while it plays**, and comes back on when you return to the app.
- **iPhone silent switch:** on Safari 17 and later the click now plays with the switch on silent.
- **6/8 is counted in two:** the dots show two groups of three, and with Accent Beat One on, beat four gets a lighter accent (1100 Hz).
- **Works offline** after the first visit, and installs with the right start address.
- **Keyboard:** Space starts and stops; Escape closes Help and About.
- The chosen time signature is remembered.

**Faster and private**
- The app is built ahead of time instead of being compiled in the browser on every launch: about 68 KB of code to download (compressed) instead of about 650 KB, and no compiling at launch.
- React and the fonts are served from this site — nothing is loaded from Google or other sites any more.

**Fixes**
- Help and About gave the wrong tones (660 Hz, 500 Hz); the click is 1000 Hz, 1200 Hz on an accented beat one.
- The selected time signature was hard to read in light mode (white on pale purple).
- Hovering over a selected button could wipe out its highlight.
- The slider's middle mark said 120 but sits at 140.
- After the page had been in the background, missed beats could play all at once on return.
- Contact now goes to support@bitscribbles.com.

**Accessibility** (axe audit clean in both themes, Help and About)
- Accent Beat One and Up to Eleven are real switches, usable from the keyboard and by screen readers.
- Muted text, the purple labels and the Start button's text meet 4.5:1 contrast (Start now uses Ink on Teal, like Liquid Clock).
- Labels for the slider, presets and ± buttons; the BPM is announced when it changes; visible focus marks; Help and About are proper dialogs that hold focus; motion is turned off when the device asks for reduced motion.

**About** follows the other bitScribbles apps: what it is, made by bitScribbles, private by design, disclaimer, support (feedback and Buy me a coffee) and credits.

## 1.5.2 — 8 October 2026
- New app icon (amber tile, Paper triangle, amber dot) and the full icon set; manifest fixed for metronome.bitscribbles.com; browser bar colour follows the theme.
- Afterwards, without a version change: the icon's triangle optically centred and its dot matched to Clear Tracker's (pull request #2).

Earlier versions weren't recorded here.
