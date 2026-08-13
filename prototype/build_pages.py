#!/usr/bin/env python3
"""Sestaví verzi prototypu pro GitHub Pages, s jednoduchou heslovou závorou.

    python3 prototype/build_pages.py [heslo]

Výstup:

    docs/index.html      odemykací stránka, pár kB — nese jen formulář
    docs/prototype.html  celý prototyp v jednom souboru
    docs/.nojekyll       ať Pages soubory neprohání Jekyllem

Pages se pak pouští z větve master, složka /docs.

Závora je samostatná stránka, ne překryv: prototyp se stahuje až po zadání
hesla, takže na mobilu nikdo netáhne megabajty dřív, než se dostane dovnitř.
Po odemčení se obsah vloží do stejné stránky (`document.write`), takže adresa
zůstane na kořeni a hash routing i deep linky fungují dál.

POZOR — tohle NENÍ zabezpečení. Heslo se kontroluje v prohlížeči a
`prototype.html` je dostupný i přímo na své adrese. A protože repo musí být
veřejné, leží zdroják stejně na GitHubu. Je to závora proti náhodnému
kolemjdoucímu, nic víc. Vědomé rozhodnutí z 13. 8. 2026.
"""

import os
import re
import sys

import build  # sdílí čtení souborů a data URI

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "docs")
DEFAULT_PASSWORD = "Veslo"


def main():
    password = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PASSWORD

    page = full_document()
    gate = GATE.replace("__PASSWORD__", password)

    os.makedirs(OUT, exist_ok=True)
    write(os.path.join(OUT, "prototype.html"), page)
    write(os.path.join(OUT, "index.html"), gate)
    write(os.path.join(OUT, ".nojekyll"), "")

    print("docs/index.html     — %.1f kB, heslo: %s" % (len(gate.encode()) / 1024, password))
    print("docs/prototype.html — %.1f MB" % (len(page.encode()) / 1024 / 1024))


def full_document():
    """Celý prototyp v jednom souboru, včetně <head> — na rozdíl od build.py,
    který dělá jen obsah <body> pro obal Claude Artifactu."""
    src = build.read("index.html")

    for path in sorted(set(re.findall(r"assets/[A-Za-z0-9._-]+", src))):
        src = src.replace(path, build.data_uri(path))

    styles = "\n".join(
        "/* ===== %s ===== */\n%s" % (f, build.read(f)) for f in build.CSS
    )
    src = re.sub(r'\s*<link rel="stylesheet" href="css/[a-z]+\.css" />', "", src)
    src = src.replace("</head>", "  <style>\n%s\n    </style>\n  </head>" % styles, 1)

    # lambda, ne řetězec — v JS jsou zpětná lomítka, která by re.sub bral jako escapy
    inline_js = "\n    <script>\n%s\n    </script>" % build.read(build.JS)
    src = re.sub(
        r'\s*<script src="%s"></script>' % re.escape(build.JS),
        lambda _m: inline_js,
        src,
    )

    leftovers = re.findall(r'(?:src|href)="(?!#|data:|tel:|http)[^"]+"', src)
    if leftovers:
        sys.exit("V dokumentu zbyly relativní odkazy: %s" % leftovers)
    return src


def write(path, text):
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


GATE = """<!doctype html>
<html lang="cs">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="theme-color" content="#e5eceb" />
    <title>Direct — prototyp</title>
    <style>
      * { box-sizing: border-box; }
      html, body { height: 100%; margin: 0; }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: #e5eceb;
        color: #004033;
        font-family: "Direct Sans", Arial, Helvetica, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .gate {
        width: 100%;
        max-width: 360px;
        padding: 32px 24px;
        border-radius: 28px;
        background: #fff;
        box-shadow: 0 14px 34px rgba(0, 64, 51, 0.1);
        text-align: center;
      }
      h1 { font-size: 24px; font-weight: 500; margin: 0 0 8px; }
      .lead { font-size: 14px; line-height: 1.4; color: #006b55; margin: 0 0 24px; }
      label { display: block; text-align: left; font-size: 12px; color: #668c85; margin-bottom: 6px; }
      input {
        width: 100%;
        height: 52px;
        padding: 0 16px;
        border: 1px solid #e5eceb;
        border-radius: 16px;
        background: #fff;
        font: inherit;
        color: inherit;
      }
      input:focus-visible { outline: 2px solid #004033; outline-offset: 2px; }
      button {
        width: 100%;
        height: 52px;
        margin-top: 16px;
        border: 0;
        border-radius: 26px;
        background: #004033;
        color: #f9fce2;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }
      button:disabled { opacity: 0.6; cursor: progress; }
      .msg { min-height: 20px; margin: 12px 0 0; font-size: 13px; color: #d02b1d; }
      .msg--info { color: #006b55; }
      @media (prefers-reduced-motion: no-preference) {
        .gate { animation: in 200ms ease-out; }
        @keyframes in { from { opacity: 0; transform: translateY(6px); } }
      }
    </style>
  </head>
  <body>
    <main class="gate">
      <h1>Direct — prototyp</h1>
      <p class="lead">Klikací prototyp mobilní aplikace. Pro zobrazení zadejte heslo.</p>
      <form id="f">
        <label for="p">Heslo</label>
        <input id="p" type="password" autocomplete="current-password" autofocus />
        <button id="b" type="submit">Odemknout</button>
      </form>
      <p class="msg" id="m"></p>
    </main>

    <script>
      /* Prototyp se stahuje až po zadání hesla a vloží se do téhle stránky,
         takže adresa zůstane na kořeni a hash routing funguje dál.
         Není to ochrana — prototype.html je dostupný i přímo. */
      (function () {
        var form = document.getElementById("f");
        var input = document.getElementById("p");
        var button = document.getElementById("b");
        var msg = document.getElementById("m");
        var KEY = "direct-prototyp-odemceno";

        function say(text, info) {
          msg.textContent = text;
          msg.className = info ? "msg msg--info" : "msg";
        }

        function load() {
          button.disabled = true;
          say("Načítám prototyp…", true);
          fetch("prototype.html")
            .then(function (r) {
              if (!r.ok) throw new Error("http " + r.status);
              return r.text();
            })
            .then(function (html) {
              try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
              document.open();
              document.write(html);
              document.close();
            })
            .catch(function () {
              button.disabled = false;
              say("Prototyp se nepodařilo načíst. Zkuste stránku obnovit.", false);
            });
        }

        form.addEventListener("submit", function (e) {
          e.preventDefault();
          if (input.value.trim() === "__PASSWORD__") {
            load();
          } else {
            say("Heslo nesedí. Zkuste to prosím znovu.", false);
            input.select();
          }
        });

        try {
          if (sessionStorage.getItem(KEY) === "1") load();
        } catch (e) {}
      })();
    </script>
  </body>
</html>
"""


if __name__ == "__main__":
    main()
