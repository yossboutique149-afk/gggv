#!/usr/bin/env python3
"""Empaqueta el addon de Bedrock en dist/elylang.mcaddon (BP + RP)."""
import os
import zipfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, "dist", "elylang.mcaddon")
CARPETAS = ["BP", "RP"]


def main() -> None:
    os.makedirs(os.path.dirname(DESTINO), exist_ok=True)
    total = 0
    with zipfile.ZipFile(DESTINO, "w", zipfile.ZIP_DEFLATED) as paquete:
        for carpeta in CARPETAS:
            base = os.path.join(RAIZ, "bedrock", carpeta)
            if not os.path.isdir(base):
                raise SystemExit(f"Falta la carpeta bedrock/{carpeta}")
            for actual, _, archivos in os.walk(base):
                for archivo in archivos:
                    ruta = os.path.join(actual, archivo)
                    dentro = os.path.relpath(ruta, os.path.join(RAIZ, "bedrock"))
                    paquete.write(ruta, dentro)
                    total += 1
    print(f"dist/elylang.mcaddon listo · {total} archivos")


if __name__ == "__main__":
    main()
