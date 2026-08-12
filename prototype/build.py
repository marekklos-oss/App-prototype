#!/usr/bin/env python3
"""Sbalí prototyp do jednoho HTML souboru pro hostování jako Claude Artifact.

    python3 prototype/build.py

Výstup: prototype-bundle.html v kořeni repa (je v .gitignore).

Artefakty nesmí sahat na externí zdroje, takže se CSS a JS inlinují a obrázky
se převádí na data URI. Obal artefaktu dodává <!doctype>, <html>, <head> i
<body> — proto se ze zdroje bere jen obsah <body> a nic z hlavičky.
"""

import base64
import mimetypes
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "prototype-bundle.html")
CSS = ("css/tokens.css", "css/app.css", "css/components.css")
JS = "js/app.js"


def main():
    src = read("index.html")
    body = src[src.index("<body>") + len("<body>") : src.rindex("</body>")]

    # externí <script src> nahradí inlinovaná verze na konci dokumentu
    body = re.sub(r'\s*<script src="%s"></script>' % re.escape(JS), "", body)

    for path in sorted(set(re.findall(r"assets/[A-Za-z0-9._-]+", body))):
        body = body.replace(path, data_uri(path))

    styles = "\n".join("/* ===== %s ===== */\n%s" % (f, read(f)) for f in CSS)
    page = "<style>\n%s\n</style>\n%s\n<script>\n%s\n</script>\n" % (
        styles,
        body.strip(),
        read(JS),
    )

    leftovers = re.findall(r'(?:src|href)="(?!#|data:|tel:|http)[^"]+"', page)
    if leftovers:
        sys.exit("V bundlu zbyly relativní odkazy: %s" % leftovers)

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(page)
    print("%s — %.1f MB" % (OUT, len(page.encode()) / 1024 / 1024))


def read(rel):
    with open(os.path.join(HERE, rel), encoding="utf-8") as f:
        return f.read()


def data_uri(rel):
    path = os.path.join(HERE, rel)
    mime = "image/svg+xml" if rel.endswith(".svg") else mimetypes.guess_type(path)[0]
    with open(path, "rb") as f:
        return "data:%s;base64,%s" % (mime, base64.b64encode(f.read()).decode())


if __name__ == "__main__":
    main()
