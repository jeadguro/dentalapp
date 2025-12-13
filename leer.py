import os

# Directorio raíz del proyecto Flutter
directorio = "."

# Extensiones que queremos incluir
extensiones = (".dart", ".yaml", ".json",".jsx",".js",".css",".html")

# Archivo de salida
salida = "codigo_flutter.txt"

with open(salida, "w", encoding="utf-8") as archivo_salida:
    for carpeta, _, archivos in os.walk(directorio):
        for nombre_archivo in archivos:
            if nombre_archivo.endswith(extensiones):
                ruta = os.path.join(carpeta, nombre_archivo)
                archivo_salida.write(f"\n\n# ===== {ruta} ===== #\n\n")
                with open(ruta, "r", encoding="utf-8") as f:
                    archivo_salida.write(f.read())

print(f"✅ Código Flutter guardado en {salida}")
