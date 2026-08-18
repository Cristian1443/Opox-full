"""Genera un PDF de muestra con contenido de temario de oposiciones (sin dependencias externas)."""
import struct, zlib, datetime

def pdf_string(s: str) -> bytes:
    return s.encode('latin-1', errors='replace')

def make_pdf(output_path: str):
    # Contenido del temario en texto plano
    lines = [
        "TEMARIO DE OPOSICIONES - JUSTICIA Y TRAMITACION ADMINISTRATIVA",
        "",
        "TEMA 1. LA CONSTITUCION ESPANOLA DE 1978",
        "",
        "Articulo 1. Espana se constituye en un Estado social y democratico de Derecho,",
        "que propugna como valores superiores de su ordenamiento juridico la libertad,",
        "la justicia, la igualdad y el pluralismo politico.",
        "",
        "Articulo 14. Los espanoles son iguales ante la ley, sin que pueda prevalecer",
        "discriminacion alguna por razon de nacimiento, raza, sexo, religion, opinion o",
        "cualquier otra condicion o circunstancia personal o social.",
        "",
        "Articulo 24. Todas las personas tienen derecho a obtener la tutela efectiva de",
        "los jueces y tribunales en el ejercicio de sus derechos e intereses legitimos,",
        "sin que, en ningun caso, pueda producirse indefension.",
        "",
        "Articulo 103. La Administracion Publica sirve con objetividad los intereses",
        "generales y actua de acuerdo con los principios de eficacia, jerarquia,",
        "descentralizacion, desconcentracion y coordinacion, con sometimiento pleno a",
        "la ley y al Derecho.",
        "",
        "TEMA 2. LEY 39/2015 DEL PROCEDIMIENTO ADMINISTRATIVO COMUN",
        "",
        "Articulo 21. La Administracion esta obligada a dictar resolucion expresa y a",
        "notificarla en todos los procedimientos cualquiera que sea su forma de iniciacion.",
        "El plazo maximo en el que debe notificarse la resolucion expresa sera el fijado",
        "por la norma reguladora del correspondiente procedimiento. Este plazo no podra",
        "exceder de seis meses salvo que una norma con rango de Ley establezca uno mayor.",
        "",
        "Articulo 22. El computo de los plazos en el procedimiento administrativo se",
        "realizara de acuerdo con lo dispuesto en el Codigo Civil y demas normas aplicables.",
        "Los plazos expresados en dias se contaran a partir del dia siguiente a aquel en",
        "que tenga lugar la notificacion o publicacion del acto.",
        "",
        "Articulo 30. Los plazos senalados en dias se computaran a partir del dia",
        "siguiente a aquel en que tenga lugar la notificacion o publicacion del acto.",
        "Si el ultimo dia del plazo fuese inhabil, se entendera prorrogado al primer",
        "dia habil siguiente.",
        "",
        "TEMA 3. LEY 40/2015 DEL REGIMEN JURIDICO DEL SECTOR PUBLICO",
        "",
        "Articulo 3. Las Administraciones Publicas sirven con objetividad los intereses",
        "generales y actuan de acuerdo con los principios de eficacia, jerarquia,",
        "descentralizacion, desconcentracion y coordinacion, con sometimiento pleno a",
        "la Constitucion, a la Ley y al Derecho.",
        "",
        "Articulo 4. Las Administraciones Publicas actuan de acuerdo con los principios",
        "de transparencia y de servicio efectivo a los ciudadanos.",
        "",
        "Articulo 5. Cada una de las Administraciones Publicas del articulo 2 actua",
        "para el cumplimiento de sus fines con personalidad juridica unica.",
        "",
        "TEMA 4. EL ESTATUTO BASICO DEL EMPLEADO PUBLICO",
        "",
        "Articulo 1. El presente Estatuto tiene por objeto establecer las bases del",
        "regimen estatutario de los funcionarios publicos incluidos en su ambito de",
        "aplicacion. Asimismo tiene por objeto determinar las normas aplicables al",
        "personal laboral al servicio de las Administraciones publicas.",
        "",
        "Articulo 14. Los funcionarios publicos tienen los siguientes derechos de",
        "caracter individual en correspondencia con la naturaleza juridica de su relacion",
        "de servicio: a la inamovilidad en la condicion de funcionario de carrera,",
        "al desempeno efectivo de las funciones o tareas propias de su condicion",
        "profesional y puesto de trabajo.",
        "",
        "Articulo 20. Las Administraciones Publicas estableceran sistemas que permitan",
        "la evaluacion del desempeno de sus empleados. La evaluacion del desempeno",
        "es el procedimiento mediante el cual se mide y valora la conducta profesional",
        "y el rendimiento o el logro de resultados.",
        "",
        "TEMA 5. DERECHOS FUNDAMENTALES Y LIBERTADES PUBLICAS",
        "",
        "Articulo 15. Todos tienen derecho a la vida y a la integridad fisica y moral.",
        "Nadie podra ser sometido a tortura ni a penas o tratos inhumanos o degradantes.",
        "Queda abolida la pena de muerte, salvo lo que puedan disponer las leyes penales",
        "militares para tiempos de guerra.",
        "",
        "Articulo 16. Se garantiza la libertad ideologica, religiosa y de culto de los",
        "individuos y las comunidades sin mas limitacion, en sus manifestaciones, que",
        "la necesaria para el mantenimiento del orden publico protegido por la ley.",
        "",
        "Articulo 17. Toda persona tiene derecho a la libertad y a la seguridad.",
        "Nadie puede ser privado de su libertad, sino con la observancia de lo establecido",
        "en este articulo y en los casos y en la forma previstos en la ley.",
        "",
        "Articulo 18. Se garantiza el derecho al honor, a la intimidad personal y",
        "familiar y a la propia imagen.",
        "",
        "Articulo 19. Los espanoles tienen derecho a elegir libremente su residencia",
        "y a circular por el territorio nacional. Asimismo, tienen derecho a entrar y",
        "salir libremente de Espana en los terminos que la ley establezca.",
        "",
        "Articulo 20. Se reconocen y protegen los derechos: a expresar y difundir",
        "libremente los pensamientos, ideas y opiniones mediante la palabra, el escrito",
        "o cualquier otro medio de reproduccion.",
    ]

    # Construir el texto del stream PDF
    stream_lines = []
    y = 760
    stream_lines.append("BT")
    stream_lines.append("/F1 10 Tf")
    for line in lines:
        if not line:
            y -= 14
        else:
            safe = line.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
            stream_lines.append(f"10 {y} Td ({safe}) Tj")
            y -= 14
        if y < 50:
            # Nueva pagina - simplificado: solo cortamos el contenido
            break
    stream_lines.append("ET")
    stream_content = "\n".join(stream_lines)
    stream_bytes = stream_content.encode('latin-1', errors='replace')

    # Construir el PDF manualmente
    objects = []

    # Obj 1: Catalog
    objects.append(b"1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj\n")

    # Obj 2: Pages
    objects.append(b"2 0 obj\n<</Type /Pages /Kids [3 0 R] /Count 1>>\nendobj\n")

    # Obj 3: Page
    objects.append(
        b"3 0 obj\n"
        b"<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 842]\n"
        b"/Resources <</Font <</F1 5 0 R>>>>\n"
        b"/Contents 4 0 R>>\n"
        b"endobj\n"
    )

    # Obj 4: Content stream
    stream_len = len(stream_bytes)
    obj4 = f"4 0 obj\n<</Length {stream_len}>>\nstream\n".encode() + stream_bytes + b"\nendstream\nendobj\n"
    objects.append(obj4)

    # Obj 5: Font
    objects.append(
        b"5 0 obj\n"
        b"<</Type /Font /Subtype /Type1 /BaseFont /Helvetica\n"
        b"/Encoding /WinAnsiEncoding>>\n"
        b"endobj\n"
    )

    # Construir el archivo PDF
    pdf = b"%PDF-1.4\n"
    offsets = []
    for obj in objects:
        offsets.append(len(pdf))
        pdf += obj

    # Cross-reference table
    xref_offset = len(pdf)
    xref = f"xref\n0 {len(objects) + 1}\n"
    xref += "0000000000 65535 f \n"
    for off in offsets:
        xref += f"{off:010d} 00000 n \n"

    trailer = (
        f"trailer\n<</Size {len(objects) + 1} /Root 1 0 R>>\n"
        f"startxref\n{xref_offset}\n%%EOF\n"
    )

    pdf += xref.encode() + trailer.encode()

    with open(output_path, 'wb') as f:
        f.write(pdf)

    print(f"PDF creado: {output_path} ({len(pdf)} bytes)")

if __name__ == "__main__":
    make_pdf("C:/Users/santi/OneDrive/Documentos/Opox-full/scripts/temario_prueba.pdf")
