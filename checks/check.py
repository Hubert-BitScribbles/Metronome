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
try { localStorage.setItem('bs-welcomed','1'); } catch (e) {}   // the main checks start past the welcome
"""
# The welcome's own checks: fresh contexts with real device user agents
UA = {
    'safari27': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1',
    'safari26': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
    'chromeios': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0.7444.46 Mobile/15E148 Safari/604.1',
    'android': 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
    'macsafari': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Safari/605.1.15',
    'winfirefox': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0',
}
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
    ctx.set_offline(False)

    # Help and About: the close button stays on screen and full size, opened and
    # scrolled to the bottom, at iPhone Safari's visible size (portrait and sideways).
    for w, h in [(390, 664), (844, 350)]:
        pg.set_viewport_size({"width": w, "height": h})
        for name in ["Help", "About"]:
            pg.get_by_role("button", name=name, exact=True).click(); pg.wait_for_timeout(400)
            def box():
                r = pg.get_by_role("button", name="Close").bounding_box()
                return r['y'] >= 0 and r['y'] + r['height'] <= h and r['height'] >= 44
            opened = box()
            pg.evaluate("document.querySelector('.dialog-body').scrollTop = 1e6"); pg.wait_for_timeout(150)
            print(f'{w}x{h} {name}: close button on screen and 44 px when opened {opened}, after scrolling {box()}')
            if name == "About":
                print('  About links the website:', pg.locator('[role=dialog] a[href="https://bitscribbles.com"]').count() == 1)
            pg.keyboard.press("Escape"); pg.wait_for_timeout(200)

    # Volume: the slider glides 1–10; 11 is a button you tap; sliding comes back from 11
    pg.set_viewport_size({"width": 390, "height": 844})
    vol = pg.get_by_role("slider", name="Volume")
    eleven = pg.get_by_role("button", name="Eleven — the loudest click")
    label = lambda: pg.inner_text("#vol-label").replace("\n", " ")
    print('volume starts at 7:', vol.input_value() == "7", '|', label())
    vol.fill("9.3"); pg.wait_for_timeout(100)
    print('slider glides (9.3):', vol.input_value() == "9.3", '| label', label(), '| 11 off:', eleven.get_attribute("aria-pressed") == "false")
    eleven.click(); pg.wait_for_timeout(100)
    print('tap 11 ->', eleven.get_attribute("aria-pressed") == "true", '| label', label(), '| slider kept at', vol.input_value())
    pg.reload(); pg.wait_for_timeout(800)
    print('11 remembered after reload:', pg.get_by_role("button", name="Eleven — the loudest click").get_attribute("aria-pressed") == "true")
    pg.get_by_role("slider", name="Volume").fill("4"); pg.wait_for_timeout(100)
    print('sliding comes back from 11:', pg.get_by_role("button", name="Eleven — the loudest click").get_attribute("aria-pressed") == "false", '| label', label())
    audit(pg, 'volume (dark)')

    # ── Welcome (1.8.0) ──
    def fresh(ua, extra=""):
        c = b.new_context(viewport={"width": 390, "height": 664}, device_scale_factor=2, has_touch=True, user_agent=UA[ua])
        if extra: c.add_init_script(extra)
        q = c.new_page(); q.on("pageerror", lambda e: errs.append(str(e)))
        return c, q
    dlg = lambda q: q.get_by_role("dialog")
    head = lambda q: q.locator('[role=dialog] h2').inner_text()
    steps = lambda q: q.locator('[role=dialog] ol').inner_text().replace("\n", " / ")

    c, q = fresh('safari27'); q.goto(URL); q.wait_for_timeout(1200)
    print('first visit -> welcome opens:', dlg(q).count() == 1, '|', head(q), '| says 1 of 2:', '1 of 2' in dlg(q).inner_text().lower())
    q.screenshot(path=S + "/w-1.png"); audit(q, 'welcome 1 (dark)')
    q.get_by_role("button", name="Next").click(); q.wait_for_timeout(300)
    print('iPhone Safari 27 ->', head(q), '| ≡ step:', '≡' in steps(q), '| focus on heading:', q.evaluate("document.activeElement.tagName") == 'H2')
    play = q.get_by_role("button", name="▶ Show me how · 26 s video")
    print('  Safari clip offered:', play.count() == 1)
    play.click(); q.wait_for_timeout(1500)
    print('  clip loaded from memory:', q.evaluate("(document.querySelector('[role=dialog] video')||{}).src||''").startswith('blob:'),
          '| still shown first:', 'install-iphone-safari.jpg' in q.evaluate("document.querySelector('[role=dialog] video').poster"))
    q.screenshot(path=S + "/w-2-safari.png"); audit(q, 'welcome 2 Safari (dark)')
    cached = q.evaluate("caches.keys().then(ks => Promise.all(ks.map(k => caches.open(k).then(c => c.keys())))).then(a => a.flat().map(r => r.url))")
    print('  clips never cached offline:', not any('/clips/' in u for u in cached))
    q.get_by_role("button", name="Not right? Change").click()
    q.locator('[role=dialog] select').first.select_option('android'); q.wait_for_timeout(200)
    print('Change -> Android:', 'Android' in q.locator('[role=dialog]').inner_text(), '| saved:', q.evaluate("localStorage.getItem('bs-device')") is not None,
          '| no clip:', q.get_by_role("button", name="▶ Show me how · 26 s video").count() == 0)
    q.locator('[role=dialog] select').first.select_option('iphone'); q.wait_for_timeout(200)
    print('Change back to the detected device clears it:', q.evaluate("localStorage.getItem('bs-device')") is None)
    q.get_by_role("button", name="Start practising").click(); q.wait_for_timeout(200)
    print('Start practising closes it and remembers:', dlg(q).count() == 0, q.evaluate("localStorage.getItem('bs-welcomed')") == '1')
    q.reload(); q.wait_for_timeout(1000); print('not shown again:', dlg(q).count() == 0)
    q.goto(URL + "?welcome"); q.wait_for_timeout(1000); print('?welcome shows it again:', dlg(q).count() == 1)
    q.keyboard.press("Escape"); q.wait_for_timeout(200); print('Escape closes it:', dlg(q).count() == 0)
    q.goto(URL); q.wait_for_timeout(800)
    q.get_by_role("button", name="Help", exact=True).click(); q.wait_for_timeout(300)
    q.get_by_role("button", name="How to install it on this device").click(); q.wait_for_timeout(400)
    print('Help -> How to install opens screen 2:', head(q) == 'Add it to your Home Screen')
    c.close()

    for ua, want, clip in [('safari26', '⋯', None), ('chromeios', 'below Print', '24 s'), ('android', 'Install app', None),
                           ('macsafari', 'Add to Dock', None), ('winfirefox', 'Bookmark', None)]:
        c, q = fresh(ua); q.goto(URL); q.wait_for_timeout(1000)
        q.get_by_role("button", name="Next").click(); q.wait_for_timeout(300)
        has_clip = q.locator('[role=dialog] button', has_text='Show me how').count()
        print(f'{ua} -> {head(q)} | right steps:', want in steps(q) or want in head(q),
              '| clip:', (f'yes, {clip}' if clip and q.locator('[role=dialog] button', has_text=clip).count() else 'yes' if has_clip else 'no'),
              '| expected:', clip or 'no')
        if ua == 'chromeios': q.screenshot(path=S + "/w-2-chrome.png")
        c.close()

    c, q = fresh('android', "localStorage.setItem('bs-theme','light')"); q.goto(URL + "?welcome"); q.wait_for_timeout(1000)
    audit(q, 'welcome 1 (light)'); q.get_by_role("button", name="Next").click(); q.wait_for_timeout(300); audit(q, 'welcome 2 (light)')
    q.screenshot(path=S + "/w-2-android-light.png"); c.close()

    c, q = fresh('safari27', "localStorage.setItem('bs-sig','4/4')"); q.goto(URL); q.wait_for_timeout(1200)
    print('people who used Metronome before see no welcome:', dlg(q).count() == 0); c.close()

    c, q = fresh('safari27', "Object.defineProperty(navigator,'standalone',{value:true})"); q.goto(URL); q.wait_for_timeout(1200)
    print('installed -> screen 1 only:', '1 of 2' not in dlg(q).inner_text().lower() and 'where everything is' in dlg(q).inner_text().lower(), '| button:', q.get_by_role("button", name="Start practising").count() == 1,
          '| no Next:', q.get_by_role("button", name="Next").count() == 0)
    q.get_by_role("button", name="Start practising").click(); q.wait_for_timeout(200)
    q.get_by_role("button", name="Help", exact=True).click(); q.wait_for_timeout(300)
    print('installed -> Help says so, no install link:', q.get_by_role("button", name="How to install it on this device").count() == 0)
    c.close()

    c, q = fresh('safari27'); q.set_viewport_size({"width": 844, "height": 350}); q.goto(URL); q.wait_for_timeout(1200)
    q.get_by_role("button", name="Next").click(); q.wait_for_timeout(300)
    r = q.get_by_role("button", name="Skip").bounding_box()
    print('sideways: Skip on screen:', r['y'] >= 0 and r['y'] + r['height'] <= 350); c.close()

    print('errors:', errs)
    b.close()
