# Changelog

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
