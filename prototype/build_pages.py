#!/usr/bin/env python3
"""Sestaví verzi prototypu pro GitHub Pages, s jednoduchou heslovou závorou.

    python3 prototype/build_pages.py [heslo]

Výstup:

    docs/index.html   celý prototyp v jednom souboru + odemykací překryv
    docs/.nojekyll    ať Pages soubory neprohání Jekyllem

Pages se pak pouští z větve master, složka /docs.

POZOR — tohle NENÍ zabezpečení. Heslo se kontroluje v prohlížeči a prototyp je
ve stránce celý, takže kdokoliv si ho přečte přes „zobrazit zdroj". A protože
repo je veřejné, leží zdroják stejně na GitHubu. Je to závora proti náhodnému
kolemjdoucímu, nic víc. Vědomé rozhodnutí z 13. 8. 2026: silnější ochrana nemá
smysl, dokud je repo public (Pages z privátního repa chtějí GitHub Pro).
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
    page = page.replace("</head>", GATE_STYLE + "  </head>", 1)
    page = page.replace(
        "<body>", "<body>\n" + GATE_MARKUP + GATE_SCRIPT.replace("__PASSWORD__", password), 1
    )

    os.makedirs(OUT, exist_ok=True)
    write(os.path.join(OUT, "index.html"), page)
    write(os.path.join(OUT, ".nojekyll"), "")
    print("docs/index.html — %.1f MB, heslo: %s" % (len(page.encode()) / 1024 / 1024, password))


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


GATE_STYLE = """    <style>
      /* Heslová závora — překryv nad prototypem. Není to ochrana, viz build_pages.py. */
      .gate {
        position: fixed;
        inset: 0;
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: var(--grey-50, #e5eceb);
      }
      .gate[hidden] { display: none; }
      .gate__box {
        width: 100%;
        max-width: 360px;
        padding: 32px 24px;
        border-radius: 28px;
        background: #fff;
        box-shadow: 0 14px 34px rgba(0, 64, 51, 0.1);
        text-align: center;
      }
      .gate h1 { font-size: 24px; font-weight: 500; margin: 0 0 8px; }
      .gate p { font-size: 14px; line-height: 1.4; color: #006b55; margin: 0 0 24px; }
      .gate label { display: block; text-align: left; font-size: 12px; color: #668c85; margin-bottom: 6px; }
      .gate input {
        width: 100%;
        height: 52px;
        padding: 0 16px;
        border: 1px solid #e5eceb;
        border-radius: 16px;
        background: #fff;
        font: inherit;
        color: inherit;
      }
      .gate input:focus-visible { outline: 2px solid #004033; outline-offset: 2px; }
      .gate button {
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
      .gate__msg { min-height: 20px; margin: 12px 0 0; font-size: 13px; color: #d02b1d; }
    </style>
"""

GATE_MARKUP = """    <div class="gate" id="gate">
      <main class="gate__box">
        <h1>Direct — prototyp</h1>
        <p>Klikací prototyp mobilní aplikace. Pro zobrazení zadejte heslo.</p>
        <form id="gate-form">
          <label for="gate-pass">Heslo</label>
          <input id="gate-pass" type="password" autocomplete="current-password" autofocus />
          <button type="submit">Odemknout</button>
        </form>
        <p class="gate__msg" id="gate-msg"></p>
      </main>
    </div>
"""

GATE_SCRIPT = """    <script>
      (function () {
        var gate = document.getElementById("gate");
        var form = document.getElementById("gate-form");
        var pass = document.getElementById("gate-pass");
        var msg = document.getElementById("gate-msg");
        var KEY = "direct-prototyp-odemceno";

        function open_() {
          gate.hidden = true;
          document.body.style.overflow = "";
          try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
        }

        if (sessionStorage.getItem(KEY) === "1") {
          open_();
        } else {
          document.body.style.overflow = "hidden";
        }

        form.addEventListener("submit", function (e) {
          e.preventDefault();
          if (pass.value.trim() === "__PASSWORD__") {
            open_();
          } else {
            msg.textContent = "Heslo nesedí. Zkuste to prosím znovu.";
            pass.select();
          }
        });
      })();
    </script>
"""


if __name__ == "__main__":
    main()
