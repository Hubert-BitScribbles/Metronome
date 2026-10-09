"""Browser checks for Metronome: behaviour, accessibility (axe), offline.

Run from the repo root after `cd build && npm install`:
    python3 checks/check.py
Needs Python Playwright with Chromium. Screenshots go to checks/out/.
"""
import http.server, os, socketserver, threading, functools
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(ROOT, "checks", "out"); os.makedirs(S, exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
handler = functools.partial(Quiet, directory=ROOT)
srv = socketserver.TCPServer(("127.0.0.1", 0), handler); PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f"http://localhost:{PORT}/"
axe = open(os.path.join(ROOT, "build", "node_modules", "axe-core", "axe.min.js")).read()
INIT = """
window.__wake=0; window.__wakeReleased=0;
Object.defineProperty(navigator,'wakeLock',{value:{request:async()=>{window.__wake++;const t=new EventTarget();t.release=async()=>{window.__wakeReleased++;t.dispatchEvent(new Event('release'))};return t;}}});
Object.defineProperty(navigator,'audioSession',{value:{type:'auto'}});
"""
def audit(pg, tag):
    pg.evaluate(axe)
    r = pg.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']}).then(r=>r.violations.map(v=>v.id+' ('+v.nodes.length+'): '+v.nodes.slice(0,3).map(n=>n.target.join(' ')+' '+(n.any[0]||{}).message).join(' | ')))")
    print(tag, 'axe:', r or 'none')

with sync_playwright() as p:
    b = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, has_touch=True)
    ctx.add_init_script(INIT)
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    pg.goto(URL); pg.wait_for_timeout(1500)
    print('fonts loaded:', pg.evaluate("document.fonts.check('700 20px \"Space Grotesk\"') && document.fonts.check('700 20px Caveat')"))
    pg.screenshot(path=S + "/v-dark.png"); audit(pg, 'dark')

    tapb = pg.get_by_role("button", name="Tap tempo — tap in time to set the BPM")
    for i in range(5):
        tapb.dispatch_event("pointerdown", {"button": 0}); pg.wait_for_timeout(600)
    print('taps every 600 ms ->', pg.inner_text("[aria-live=polite]").split()[0], 'BPM (expect ~100)')
    pg.wait_for_timeout(2100)
    for i in range(4):
        tapb.dispatch_event("pointerdown", {"button": 0}); pg.wait_for_timeout(400)
    print('after pause, taps every 400 ms ->', pg.inner_text("[aria-live=polite]").split()[0], 'BPM (expect ~150)')

    pg.evaluate("document.activeElement && document.activeElement.blur()")
    pg.keyboard.press("Space"); pg.wait_for_timeout(500)
    print('space -> playing:', pg.get_by_role("button", name="Stop").count() == 1,
          '| wake requests:', pg.evaluate("window.__wake"),
          '| audioSession:', pg.evaluate("navigator.audioSession.type"))
    pg.get_by_role("button", name="6/8").click(); pg.wait_for_timeout(900)
    pg.screenshot(path=S + "/v-68-playing.png")
    pg.evaluate("document.activeElement.blur()"); pg.keyboard.press("Space"); pg.wait_for_timeout(300)
    print('space -> stopped:', pg.get_by_role("button", name="Start").count() == 1, '| wake released:', pg.evaluate("window.__wakeReleased"))

    sw = pg.get_by_role("switch", name="ACCENT BEAT ONE"); sw.focus(); pg.keyboard.press("Enter")
    print('accent switch via keyboard ->', sw.get_attribute("aria-checked"))

    pg.get_by_role("button", name="Switch to light mode").click(); pg.wait_for_timeout(500)
    pg.screenshot(path=S + "/v-light.png"); audit(pg, 'light')
    print('theme-color light:', pg.eval_on_selector('meta[name="theme-color"]', 'm=>m.content'))
    pg.get_by_role("button", name="About").click(); pg.wait_for_timeout(400); audit(pg, 'about (light)')
    print('focus in dialog:', pg.evaluate("document.activeElement.getAttribute('aria-label')"))
    pg.screenshot(path=S + "/v-about.png")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    print('esc closed:', pg.get_by_role("dialog").count() == 0, '| focus back on:', pg.evaluate("document.activeElement.textContent.trim()"))
    pg.get_by_role("button", name="Switch to dark mode").click()
    pg.get_by_role("button", name="Help").click(); pg.wait_for_timeout(400); audit(pg, 'help (dark)')
    pg.screenshot(path=S + "/v-help.png"); pg.keyboard.press("Escape")

    pg.wait_for_timeout(1500)
    ctl = pg.evaluate("!!navigator.serviceWorker.controller")
    if not ctl:
        pg.reload(); pg.wait_for_timeout(1500); ctl = pg.evaluate("!!navigator.serviceWorker.controller")
    print('service worker in control:', ctl)
    ctx.set_offline(True); pg.reload(); pg.wait_for_timeout(2000)
    print('offline reload renders:', 'Metronome' in pg.inner_text("body"),
          '| fonts offline:', pg.evaluate("document.fonts.check('700 20px \"Space Grotesk\"')"),
          '| kept 6/8:', pg.get_by_role("button", name="6/8").get_attribute("aria-pressed"))
    print('errors:', errs)
    b.close()
