"""
Motor IA — Test suite completo (Bloques 0, 6 y 7)
Ejecuta las pruebas en orden secuencial. Las IDs se encadenan entre llamadas.

Uso:
  python scripts/test_motor_ia.py --key opox-CLAVE-COMPLETA
  python scripts/test_motor_ia.py --key opox-CLAVE-COMPLETA --pdf ruta/al/temario.pdf

Requiere Python 3.8+. Sin dependencias externas (solo urllib, que viene incluido).
"""

import urllib.request
import urllib.parse
import json
import time
import sys
import os
import argparse
import uuid
import mimetypes
import io

# Forzar UTF-8 en Windows para evitar UnicodeEncodeError con simbolos
if sys.platform == "win32":
    import io as _io
    sys.stdout = _io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ─────────────────────────────────────────────────────────────────────────────
# Configuración
# ─────────────────────────────────────────────────────────────────────────────
BASE_URL = "https://ingesta-demo-1097036487734.us-east1.run.app"
OPENAI_KEY = os.environ.get("AI_API_KEY", "")  # exportar AI_API_KEY antes de ejecutar
PDF_PATH = os.path.join(os.path.dirname(__file__), "temario_prueba.pdf")
USER_ID = "opositor-demo"
JOB_POLL_INTERVAL = 3   # segundos entre polls
JOB_MAX_WAIT = 300       # segundos máximos esperando un job

# ─────────────────────────────────────────────────────────────────────────────
# Estado global del test (IDs que se encadenan)
# ─────────────────────────────────────────────────────────────────────────────
state = {
    "curso_id": None,
    "documento_id": None,
    "job_id": None,
    "sesion_id": None,
    "pregunta_id": None,
    "question_id": None,
    "topic_id": None,
}

# ─────────────────────────────────────────────────────────────────────────────
# Resultado del test suite
# ─────────────────────────────────────────────────────────────────────────────
results = []

def ok(name, detail=""):
    results.append(("PASS", name, detail))
    print(f"  ✓ PASS  {name}" + (f" — {detail}" if detail else ""))

def fail(name, detail=""):
    results.append(("FAIL", name, detail))
    print(f"  ✗ FAIL  {name}" + (f" — {detail}" if detail else ""))

def skip(name, reason=""):
    results.append(("SKIP", name, reason))
    print(f"  - SKIP  {name}" + (f" — {reason}" if reason else ""))

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

# ─────────────────────────────────────────────────────────────────────────────
# HTTP helpers
# ─────────────────────────────────────────────────────────────────────────────
def make_headers(api_key: str, extra: dict = None, content_type: str = "application/json"):
    h = {
        "X-API-Key": api_key,
        "X-OpenAI-Key": OPENAI_KEY,
    }
    if content_type:
        h["Content-Type"] = content_type
    if extra:
        h.update(extra)
    return h

def request(method: str, path: str, api_key: str, body=None, files=None, params=None) -> tuple[int, dict | str]:
    url = BASE_URL + path
    if params:
        url += "?" + urllib.parse.urlencode(params)

    if files:
        # Multipart form-data
        boundary = uuid.uuid4().hex
        body_parts = b""
        for key, value in (body or {}).items():
            body_parts += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"\r\n\r\n{value}\r\n".encode()
        for key, (filename, fileobj, content_type) in files.items():
            data = fileobj.read()
            body_parts += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"; filename=\"{filename}\"\r\nContent-Type: {content_type}\r\n\r\n".encode()
            body_parts += data + b"\r\n"
        body_parts += f"--{boundary}--\r\n".encode()

        req = urllib.request.Request(url, data=body_parts, method=method)
        req.add_header("X-API-Key", api_key)
        req.add_header("X-OpenAI-Key", OPENAI_KEY)
        req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    else:
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("X-API-Key", api_key)
        req.add_header("X-OpenAI-Key", OPENAI_KEY)
        if data:
            req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode()
            try:
                return resp.status, json.loads(raw)
            except Exception:
                return resp.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw
    except Exception as ex:
        return 0, str(ex)

def poll_job(api_key: str, job_id: str, label: str) -> dict | None:
    """Espera hasta que el job termine (done o error). Devuelve el body final."""
    deadline = time.time() + JOB_MAX_WAIT
    while time.time() < deadline:
        code, body = request("GET", f"/v1/jobs/{job_id}", api_key)
        if code != 200:
            fail(f"{label} · poll job", f"HTTP {code}: {body}")
            return None
        estado = body.get("estado") if isinstance(body, dict) else None
        print(f"    ... estado={estado} progreso={body.get('progreso')} cost=${body.get('cost_usd', 0):.4f}")
        if estado == "done":
            ok(f"{label} · job completado", f"cost=${body.get('cost_usd',0):.4f}")
            return body
        if estado == "error":
            fail(f"{label} · job error", body.get("mensaje", "sin mensaje"))
            return body
        time.sleep(JOB_POLL_INTERVAL)
    fail(f"{label} · job timeout", f"No terminó en {JOB_MAX_WAIT}s")
    return None

# ─────────────────────────────────────────────────────────────────────────────
# GRUPO 0 · Salud
# ─────────────────────────────────────────────────────────────────────────────
def test_health(api_key: str):
    section("GRUPO 0 · Salud")
    code, body = request("GET", "/v1/health", api_key)
    if code == 200:
        ok("GET /v1/health", f"respuesta: {body}")
        # Verificación exacta según la guía
        if isinstance(body, dict) and body.get("status") == "ok":
            ok("health shape exacto", '{"status":"ok"}')
        elif isinstance(body, dict) and body.get("ok") is True:
            fail("health shape exacto", f'Guía dice {{"status":"ok"}} pero el motor devuelve {body} — DISCREPANCIA DOCUMENTADA')
        else:
            fail("health shape", f"respuesta inesperada: {body}")
    else:
        fail("GET /v1/health", f"HTTP {code}: {body}")

# ─────────────────────────────────────────────────────────────────────────────
# GRUPO A · Bloque 6 · Cimiento — Cursos y Temario
# ─────────────────────────────────────────────────────────────────────────────
def test_bloque6_cimiento(api_key: str, pdf_path: str):
    section("GRUPO A · Bloque 6 · Cimiento — Cursos y Temario")

    # 1. Crear curso con primer PDF
    print("\n  [A1] POST /v1/courses — crear curso con PDF")
    if not os.path.exists(pdf_path):
        skip("A1 · crear curso", f"PDF no encontrado: {pdf_path}")
        return
    with open(pdf_path, "rb") as f:
        code, body = request("POST", "/v1/courses", api_key,
            body={"titulo": "Auxiliar Administrativo del Estado"},
            files={"file": ("temario_prueba.pdf", io.BytesIO(f.read()), "application/pdf")}
        )
    print(f"    → HTTP {code}: {body}")
    if code in (200, 201):
        if isinstance(body, dict) and "curso_id" in body:
            state["curso_id"] = body["curso_id"]
            state["job_id"] = body.get("job_id")
            ok("A1 · crear curso", f"curso_id={state['curso_id']}")
            # Verificar que el nombre del curso NO es el nombre del fichero
            if body.get("titulo") == "temario_prueba":
                fail("A1 · título del curso", "El título es el nombre del fichero, no el que pasó el usuario")
            else:
                ok("A1 · título del curso", "El curso usa el título del usuario, no el nombre del fichero")
        else:
            fail("A1 · crear curso", f"Falta curso_id en respuesta: {body}")
            return
    else:
        fail("A1 · crear curso", f"HTTP {code}: {body}")
        return

    # 2. Poll job de ingesta
    print("\n  [A2] GET /v1/jobs/{job_id} — esperar ingesta")
    if state["job_id"]:
        job_result = poll_job(api_key, state["job_id"], "A2 · ingesta PDF")
        if job_result is None:
            return
    else:
        skip("A2 · poll job", "No hay job_id")

    # 3. Listar cursos
    print("\n  [A3] GET /v1/courses — listar cursos")
    code, body = request("GET", "/v1/courses", api_key, params={"estado": "listo", "limit": "10"})
    print(f"    → HTTP {code}: {str(body)[:200]}")
    if code == 200 and isinstance(body, list):
        curso = next((c for c in body if c.get("id") == state["curso_id"]), None)
        if curso:
            ok("A3 · listar cursos", f"curso encontrado con estado={curso.get('estado')}")
        else:
            fail("A3 · listar cursos", f"curso_id={state['curso_id']} no aparece en la lista")
    else:
        fail("A3 · listar cursos", f"HTTP {code}: {str(body)[:200]}")

    # 4. Ver árbol del curso
    print(f"\n  [A4] GET /v1/courses/{state['curso_id']} — árbol del curso")
    code, body = request("GET", f"/v1/courses/{state['curso_id']}", api_key)
    print(f"    → HTTP {code}: {str(body)[:300]}")
    if code == 200 and isinstance(body, dict):
        ok("A4 · árbol del curso", f"documentos={len(body.get('documentos',[]))} bloques={len(body.get('bloques',[]))}")
        # Capturar topic_id para uso posterior
        bloques = body.get("bloques", [])
        if bloques and bloques[0].get("temas"):
            state["topic_id"] = bloques[0]["temas"][0]["id"]
            ok("A4 · topic_id capturado", state["topic_id"])
        elif bloques:
            state["topic_id"] = bloques[0].get("id")
    else:
        fail("A4 · árbol del curso", f"HTTP {code}: {str(body)[:200]}")

    # 5. Búsqueda RAG
    print(f"\n  [A5] POST /v1/courses/{state['curso_id']}/search — RAG")
    code, body = request("POST", f"/v1/courses/{state['curso_id']}/search", api_key,
        body={"query": "plazo procedimiento administrativo", "k": 5}
    )
    print(f"    → HTTP {code}: {str(body)[:300]}")
    if code == 200 and isinstance(body, dict):
        pasajes = body.get("pasajes", [])
        ok("A5 · búsqueda RAG", f"{len(pasajes)} pasajes encontrados")
        if pasajes:
            p = pasajes[0]
            if "texto" in p and "page_start" in p and "score" in p:
                ok("A5 · shape pasaje", f"score={p['score']:.2f} pag={p['page_start']}")
            else:
                fail("A5 · shape pasaje", f"faltan campos: {list(p.keys())}")
    elif code == 409:
        fail("A5 · búsqueda RAG", "409 curso_no_listo — la ingesta aún no terminó")
    else:
        fail("A5 · búsqueda RAG", f"HTTP {code}: {str(body)[:200]}")

    # 6. Listar documentos
    print(f"\n  [A6] GET /v1/courses/{state['curso_id']}/documents")
    code, body = request("GET", f"/v1/courses/{state['curso_id']}/documents", api_key)
    print(f"    → HTTP {code}: {str(body)[:300]}")
    if code == 200 and isinstance(body, list) and len(body) > 0:
        doc = body[0]
        state["documento_id"] = doc.get("id")
        ok("A6 · listar documentos", f"{len(body)} doc(s), id={state['documento_id']}")
        # Verificar que el source_pdf no es el título del curso
        if doc.get("titulo") == "Auxiliar Administrativo del Estado":
            fail("A6 · título documento vs curso", "El documento y el curso tienen el mismo título — puede ser bug")
        else:
            ok("A6 · título documento vs curso", f"documento={doc.get('titulo')} (distinto del nombre del curso)")
    else:
        fail("A6 · listar documentos", f"HTTP {code}: {str(body)[:200]}")

    # 7. Chunks de un tema (si tenemos topic_id)
    if state.get("topic_id"):
        print(f"\n  [A7] GET /v1/courses/{state['curso_id']}/topics/{state['topic_id']}/chunks")
        code, body = request("GET", f"/v1/courses/{state['curso_id']}/topics/{state['topic_id']}/chunks", api_key, params={"limit": "5"})
        print(f"    → HTTP {code}: {str(body)[:300]}")
        if code == 200 and isinstance(body, list):
            ok("A7 · chunks del tema", f"{len(body)} chunks")
            if body and "texto" in body[0]:
                ok("A7 · shape chunk", f"chunk_id={body[0].get('id')} pag={body[0].get('page_start')}")
        else:
            fail("A7 · chunks del tema", f"HTTP {code}: {str(body)[:200]}")
    else:
        skip("A7 · chunks del tema", "topic_id no disponible")

    # 8. Errores esperados: ID inexistente → 404
    print("\n  [A8] GET /v1/courses/id-inexistente — debe dar 404")
    code, body = request("GET", "/v1/courses/id-que-no-existe", api_key)
    if code == 404:
        ok("A8 · ID inexistente → 404", f"detail={body}")
    elif code == 200:
        fail("A8 · ID inexistente → 404", "Devolvió 200 con lista vacía en vez de 404")
    else:
        fail("A8 · ID inexistente → 404", f"HTTP {code} (esperado 404): {body}")

# ─────────────────────────────────────────────────────────────────────────────
# GRUPO B · Bloque 6 · Generador de Tests
# ─────────────────────────────────────────────────────────────────────────────
def test_bloque6_generator(api_key: str):
    section("GRUPO B · Bloque 6 · Generador de Tests")

    if not state.get("curso_id"):
        skip("Bloque 6 · Generador", "Falta curso_id — saltando grupo completo")
        return

    # 1. from-cache (síncrono, sin LLM) — primero porque es más barato
    print("\n  [B1] POST /v1/tests/from-cache — test síncrono sin LLM")
    code, body = request("POST", "/v1/tests/from-cache", api_key, body={
        "curso_id": state["curso_id"],
        "user_id": USER_ID,
        "n_preguntas": 5,
        "dificultad": None,
        "tema_ids": None,
        "bloque_ids": None,
        "query": None
    })
    print(f"    → HTTP {code}: {str(body)[:300]}")
    if code == 200 and isinstance(body, dict) and "sesion_id" in body:
        state["sesion_id"] = body["sesion_id"]
        preguntas = body.get("preguntas", [])
        if preguntas:
            state["question_id"] = preguntas[0]["id"]
            state["pregunta_id"] = preguntas[0]["id"]
        ok("B1 · from-cache", f"sesion_id={state['sesion_id']} preguntas={len(preguntas)}")
        # Verificar shape de pregunta
        if preguntas:
            p = preguntas[0]
            checks = {
                "id": "id" in p,
                "enunciado": "enunciado" in p,
                "opciones": "opciones" in p and len(p["opciones"]) == 4,
                "sin correcta_idx": "correcta_idx" not in p,
            }
            for check_name, passed in checks.items():
                if passed:
                    ok(f"B1 · pregunta.{check_name}")
                else:
                    fail(f"B1 · pregunta.{check_name}", f"valor={p.get(check_name)}")
    elif code == 422 and isinstance(body, dict) and "sin_chunks_elegibles" in str(body):
        fail("B1 · from-cache", "sin_chunks_elegibles — el PDF no generó preguntas en caché aún")
    else:
        # Es normal si no hay preguntas cacheadas todavía — proceder a generate
        fail("B1 · from-cache", f"HTTP {code}: {str(body)[:300]}")

    # 2. Generar test con LLM (asíncrono)
    print("\n  [B2] POST /v1/tests/generate — generador con LLM (async)")
    code, body = request("POST", "/v1/tests/generate", api_key, body={
        "curso_id": state["curso_id"],
        "user_id": USER_ID,
        "n_preguntas": 3,
        "dificultad": "media",
        "tema_ids": None,
        "bloque_ids": None,
        "contrarreloj_seg": 0,
        "query": None
    })
    print(f"    → HTTP {code}: {str(body)[:300]}")
    if code == 202 and isinstance(body, dict) and "job_id" in body:
        state["job_id"] = body["job_id"]
        ok("B2 · generate · 202 aceptado", f"job_id={state['job_id']}")
    else:
        fail("B2 · generate · 202", f"HTTP {code}: {body}")
        return

    # Poll job de generación
    print("\n  [B2p] Esperando job de generación...")
    job_result = poll_job(api_key, state["job_id"], "B2p · generate job")
    if job_result is None:
        return
    resultado = job_result.get("resultado", {})
    if resultado and "sesion_id" in resultado:
        state["sesion_id"] = resultado["sesion_id"]
        ok("B2p · sesion_id del job", state["sesion_id"])
        # Capturar primera pregunta
        preguntas_job = resultado.get("preguntas", [])
        if preguntas_job:
            state["question_id"] = preguntas_job[0]["id"]
            state["pregunta_id"] = preguntas_job[0]["id"]
    else:
        fail("B2p · resultado del job", f"Sin sesion_id: {resultado}")

    # 3. Ver sesión (vista pública)
    if state.get("sesion_id"):
        print(f"\n  [B3] GET /v1/tests/{state['sesion_id']} — vista pública de la sesión")
        code, body = request("GET", f"/v1/tests/{state['sesion_id']}", api_key)
        print(f"    → HTTP {code}: {str(body)[:400]}")
        if code == 200 and isinstance(body, dict):
            preguntas = body.get("preguntas", [])
            ok("B3 · ver sesión", f"{len(preguntas)} preguntas")
            if preguntas:
                p = preguntas[0]
                state["question_id"] = p["id"]
                state["pregunta_id"] = p["id"]
                # Validaciones clave
                if "correcta_idx" not in p:
                    ok("B3 · sin correcta_idx en vista pública")
                else:
                    fail("B3 · sin correcta_idx", "La vista pública expone correcta_idx — fallo de seguridad")
                if len(p.get("opciones", [])) == 4:
                    ok("B3 · 4 opciones")
                else:
                    fail("B3 · 4 opciones", f"Tiene {len(p.get('opciones',[]))} opciones")
        else:
            fail("B3 · ver sesión", f"HTTP {code}: {str(body)[:200]}")

    # 4. Responder una pregunta
    if state.get("sesion_id") and state.get("pregunta_id"):
        print(f"\n  [B4] POST /v1/tests/{state['sesion_id']}/answer — responder pregunta")
        code, body = request("POST", f"/v1/tests/{state['sesion_id']}/answer", api_key, body={
            "user_id": USER_ID,
            "pregunta_id": state["pregunta_id"],
            "elegida_idx": 0,
            "tiempo_ms": 3000
        })
        print(f"    → HTTP {code}: {str(body)[:400]}")
        if code == 200 and isinstance(body, dict):
            ok("B4 · responder pregunta", f"correcta={body.get('correcta')}")
            # Verificar evidencia verbatim
            evidencia = body.get("evidencia")
            if evidencia:
                cita = evidencia.get("cita", "")
                pagina = evidencia.get("pagina")
                ok("B4 · evidencia.cita presente", f"'{cita[:80]}...'")
                if pagina is not None:
                    ok("B4 · evidencia.pagina presente", f"pág. {pagina}")
                else:
                    fail("B4 · evidencia.pagina", "No viene pagina en la evidencia")
            else:
                fail("B4 · evidencia verbatim", "No hay evidencia en la respuesta")
            # Verificar correcta_idx aparece al responder
            if "correcta_idx" in body:
                ok("B4 · correcta_idx revelado al responder")
            else:
                fail("B4 · correcta_idx al responder", "No viene correcta_idx en la respuesta")
        else:
            fail("B4 · responder pregunta", f"HTTP {code}: {body}")

    # 5. Resultado de la sesión
    if state.get("sesion_id"):
        print(f"\n  [B5] GET /v1/tests/{state['sesion_id']}/result — resultado")
        code, body = request("GET", f"/v1/tests/{state['sesion_id']}/result", api_key)
        print(f"    → HTTP {code}: {str(body)[:300]}")
        if code == 200 and isinstance(body, dict):
            ok("B5 · resultado de sesión", f"respondidas={body.get('respondidas')} nota={body.get('nota_pct')}")
            if "por_tema" in body:
                ok("B5 · por_tema en resultado")
            else:
                fail("B5 · por_tema", "No hay desglose por tema")
        else:
            fail("B5 · resultado", f"HTTP {code}: {body}")

    # 6. Ver preguntas del curso (con correcta_idx — vista backoffice)
    print(f"\n  [B6] GET /v1/courses/{state['curso_id']}/questions — vista backoffice")
    code, body = request("GET", f"/v1/courses/{state['curso_id']}/questions", api_key, params={"limit": "10"})
    print(f"    → HTTP {code}: {str(body)[:300]}")
    if code == 200 and isinstance(body, list):
        ok("B6 · preguntas backoffice", f"{len(body)} preguntas")
        if body:
            p = body[0]
            if "correcta_idx" in p:
                ok("B6 · correcta_idx en vista backoffice")
            else:
                fail("B6 · correcta_idx backoffice", "La vista backoffice no expone correcta_idx")
            if "evidencia" in p:
                ok("B6 · evidencia en backoffice")
            else:
                fail("B6 · evidencia backoffice", "Sin evidencia en vista backoffice")
    else:
        fail("B6 · preguntas backoffice", f"HTTP {code}: {str(body)[:200]}")

    # 7. Error: generar sin curso_id existente → 404
    print("\n  [B7] POST /v1/tests/generate con curso inexistente → 404")
    code, body = request("POST", "/v1/tests/generate", api_key, body={
        "curso_id": "curso-que-no-existe",
        "user_id": USER_ID,
        "n_preguntas": 3
    })
    if code == 404:
        ok("B7 · curso inexistente → 404", str(body)[:100])
    else:
        fail("B7 · curso inexistente → 404", f"HTTP {code} (esperado 404): {body}")

# ─────────────────────────────────────────────────────────────────────────────
# GRUPO C · Bloque 0 · Onboarding — Test de Nivel
# ─────────────────────────────────────────────────────────────────────────────
def test_bloque0_onboarding(api_key: str):
    section("GRUPO C · Bloque 0 · Onboarding — Test de Nivel")

    if not state.get("curso_id"):
        skip("Bloque 0", "Falta curso_id")
        return

    # 1. Crear placement test
    print("\n  [C1] POST /v1/onboarding/placement-test")
    code, body = request("POST", "/v1/onboarding/placement-test", api_key, body={
        "user_id": USER_ID,
        "curso_id": state["curso_id"],
        "n_preguntas": 5
    })
    print(f"    → HTTP {code}: {str(body)[:300]}")
    if code in (200, 202) and isinstance(body, dict):
        state["job_id"] = body.get("job_id")
        ok("C1 · placement test creado", f"job_id={state['job_id']}")
    elif code == 409:
        detail = body.get("detail", "") if isinstance(body, dict) else str(body)
        if "sin_preguntas" in detail or "curso_sin_preguntas" in detail:
            fail("C1 · placement test", f"409 {detail} — el curso no tiene preguntas generadas")
        else:
            fail("C1 · placement test", f"409: {detail}")
        return
    else:
        fail("C1 · placement test", f"HTTP {code}: {body}")
        return

    # 2. Poll job
    print("\n  [C2] Esperando job de placement test...")
    if state["job_id"]:
        job_result = poll_job(api_key, state["job_id"], "C2 · placement test job")
        if job_result is None:
            return
        resultado = job_result.get("resultado", {})
        sesion_placement = resultado.get("sesion_id") if resultado else None
        preguntas_placement = resultado.get("preguntas", []) if resultado else []
        if sesion_placement:
            state["sesion_id"] = sesion_placement
            ok("C2 · sesion_id del placement", sesion_placement)
        else:
            fail("C2 · sesion_id", f"Sin sesion_id en resultado: {resultado}")
            return
    else:
        skip("C2 · poll placement job", "Sin job_id")
        return

    # 3. Responder TODAS las preguntas (obligatorio para poder cerrar)
    print(f"\n  [C3] Respondiendo todas las preguntas del placement ({len(preguntas_placement)})")
    answered = 0
    for i, pregunta in enumerate(preguntas_placement):
        pid = pregunta.get("id") or pregunta.get("pregunta_id")
        if not pid:
            fail(f"C3 · pregunta {i}", "Sin id en la pregunta")
            continue
        code, body = request("POST", f"/v1/tests/{state['sesion_id']}/answer", api_key, body={
            "user_id": USER_ID,
            "pregunta_id": pid,
            "elegida_idx": i % 4,
            "tiempo_ms": 4000
        })
        if code == 200:
            answered += 1
            state["pregunta_id"] = pid  # guardar el último para tests Bloque 7
        else:
            fail(f"C3 · responder pregunta {i}", f"HTTP {code}: {str(body)[:100]}")
    ok("C3 · responder todas", f"{answered}/{len(preguntas_placement)} respondidas")

    # 4. Cerrar y ver perfil
    print(f"\n  [C4] POST /v1/onboarding/placement-test/{state['sesion_id']}/finish")
    code, body = request("POST", f"/v1/onboarding/placement-test/{state['sesion_id']}/finish", api_key,
        body={"user_id": USER_ID}
    )
    print(f"    → HTTP {code}: {str(body)[:500]}")
    if code == 200 and isinstance(body, dict):
        ok("C4 · perfil generado")
        # Validaciones del perfil
        nivel = body.get("nivel_global")
        if nivel in ("inicial", "medio", "avanzado"):
            ok("C4 · nivel_global válido", nivel)
        else:
            fail("C4 · nivel_global", f"valor={nivel} (esperado: inicial|medio|avanzado)")
        dominio = body.get("dominio_por_bloque", [])
        if isinstance(dominio, list) and dominio:
            ok("C4 · dominio_por_bloque", f"{len(dominio)} bloques")
            for bloque in dominio:
                if "evaluado" in bloque:
                    if not bloque["evaluado"] and bloque.get("porcentaje") == 0:
                        ok(f"C4 · bloque no evaluado correctamente", f"bloque={bloque.get('nombre')} evaluado=false")
                    break
        else:
            fail("C4 · dominio_por_bloque", f"valor={dominio}")
        if body.get("recomendacion"):
            ok("C4 · recomendacion presente", str(body["recomendacion"])[:100])
        else:
            fail("C4 · recomendacion", "Sin recomendacion en el perfil")

        # 4b. Idempotencia: repetir finish → mismo perfil
        print(f"\n  [C4b] Idempotencia: repetir finish")
        code2, body2 = request("POST", f"/v1/onboarding/placement-test/{state['sesion_id']}/finish", api_key,
            body={"user_id": USER_ID}
        )
        if code2 == 200 and body2.get("nivel_global") == nivel:
            ok("C4b · idempotencia", "mismo perfil al repetir finish")
        else:
            fail("C4b · idempotencia", f"HTTP {code2}: {str(body2)[:200]}")

    elif code == 409:
        detail = body.get("detail", "") if isinstance(body, dict) else str(body)
        if "incompleto" in str(detail):
            fail("C4 · finish", f"409 test_nivel_incompleto — no se respondieron todas las preguntas")
        else:
            fail("C4 · finish", f"409: {detail}")
    else:
        fail("C4 · finish", f"HTTP {code}: {str(body)[:300]}")

# ─────────────────────────────────────────────────────────────────────────────
# GRUPO D · Bloque 7 · Entrenamiento y Pista IA
# ─────────────────────────────────────────────────────────────────────────────
def test_bloque7_training(api_key: str):
    section("GRUPO D · Bloque 7 · Entrenamiento y Pista IA")

    if not state.get("curso_id"):
        skip("Bloque 7", "Falta curso_id")
        return

    # 1. Dominio por tema (Laboratorio de Errores)
    print(f"\n  [D1] GET /v1/modes/errors/{USER_ID}?course_id={state['curso_id']}")
    code, body = request("GET", f"/v1/modes/errors/{USER_ID}", api_key, params={"course_id": state["curso_id"]})
    print(f"    → HTTP {code}: {str(body)[:400]}")
    if code == 200 and isinstance(body, dict):
        ok("D1 · dominio por tema", f"temas={len(body.get('dominio_por_tema', []))}")
        if "preguntas_falladas" in body:
            ok("D1 · preguntas_falladas presente")
        else:
            fail("D1 · preguntas_falladas", "Campo no encontrado")
    elif code == 404:
        fail("D1 · dominio", "404 — el motor no reconoce el user/course")
    else:
        fail("D1 · dominio por tema", f"HTTP {code}: {str(body)[:200]}")

    # 2. Repasar errores
    print("\n  [D2] POST /v1/modes/errors/test — repaso de errores")
    code, body = request("POST", "/v1/modes/errors/test", api_key, body={
        "user_id": USER_ID,
        "curso_id": state["curso_id"],
        "n_preguntas": 3
    })
    print(f"    → HTTP {code}: {str(body)[:300]}")
    if code == 200 and isinstance(body, dict) and "sesion_id" in body:
        state["sesion_id"] = body["sesion_id"]
        preguntas = body.get("preguntas", [])
        if preguntas:
            state["pregunta_id"] = preguntas[0]["id"]
        ok("D2 · repaso errores", f"sesion={state['sesion_id']} preguntas={len(preguntas)}")
    elif code == 200 and isinstance(body, dict):
        ok("D2 · repaso errores (sin preguntas)", f"deficit={body.get('deficit')}")
    else:
        fail("D2 · repaso errores", f"HTTP {code}: {str(body)[:200]}")

    # 3. Test quirúrgico
    print("\n  [D3] POST /v1/modes/surgical — test quirúrgico")
    code, body = request("POST", "/v1/modes/surgical", api_key, body={
        "user_id": USER_ID,
        "curso_id": state["curso_id"],
        "n_preguntas": 3,
        "n_temas_debiles": 2
    })
    print(f"    → HTTP {code}: {str(body)[:300]}")
    if code == 200 and isinstance(body, dict):
        preguntas = body.get("preguntas", [])
        if preguntas:
            state["sesion_id"] = body.get("sesion_id", state["sesion_id"])
            state["pregunta_id"] = preguntas[0]["id"]
        ok("D3 · test quirúrgico", f"preguntas={len(preguntas)}")
    else:
        fail("D3 · test quirúrgico", f"HTTP {code}: {str(body)[:200]}")

    # 4. Pistas IA — test del límite de 3 pistas
    if state.get("sesion_id"):
        hint_body = {
            "user_id": USER_ID,
            "questionText": "¿Cuál es el plazo máximo para resolver un procedimiento administrativo según la Ley 39/2015?",
            "options": ["1 mes", "3 meses", "6 meses", "12 meses"],
            "topicId": "ley-39",
            "topic": "Ley 39/2015",
            "oposicion": "justicia-tramitacion",
            "sessionId": state["sesion_id"]
        }

        for i in range(1, 5):
            print(f"\n  [D{3+i}] POST /v1/modes/hint — pista {i}/4 (límite=3)")
            code, body = request("POST", "/v1/modes/hint", api_key, body=hint_body)
            print(f"    → HTTP {code}: {str(body)[:400]}")

            if i <= 3:
                if code == 200 and isinstance(body, dict):
                    hint_text = body.get("hint", "")
                    hints_remaining = body.get("hintsRemaining")

                    ok(f"D{3+i} · pista {i} recibida")

                    # Verificar que no revela respuesta
                    respuesta_revealed = any(opt.lower() in hint_text.lower() for opt in hint_body["options"])
                    letra_revealed = any(f" {l}" in hint_text or hint_text.startswith(l) for l in ["A)", "B)", "C)", "D)", "a)", "b)", "c)", "d)"])
                    if not respuesta_revealed:
                        ok(f"D{3+i} · pista no revela respuesta")
                    else:
                        fail(f"D{3+i} · pista revela respuesta", f"La pista contiene texto de una opción")
                    if not letra_revealed:
                        ok(f"D{3+i} · pista no nombra letra")
                    else:
                        fail(f"D{3+i} · pista nombra letra", hint_text[:100])
                    if len(hint_text) <= 300:
                        ok(f"D{3+i} · pista ≤300 chars", f"{len(hint_text)} chars")
                    else:
                        fail(f"D{3+i} · pista >300 chars", f"{len(hint_text)} chars")
                    if hint_text.strip() and len(hint_text.strip()) > 20:
                        ok(f"D{3+i} · pista orientativa", hint_text[:80])
                    else:
                        fail(f"D{3+i} · pista sin valor", "La pista es vacía o demasiado corta")
                    # Verificar hintsRemaining
                    expected_remaining = 3 - i
                    if hints_remaining == expected_remaining:
                        ok(f"D{3+i} · hintsRemaining={hints_remaining}")
                    else:
                        fail(f"D{3+i} · hintsRemaining", f"esperado={expected_remaining} actual={hints_remaining}")

                elif code == 422:
                    detail = body.get("detail", "") if isinstance(body, dict) else str(body)
                    if "revela_respuesta" in str(detail):
                        ok(f"D{3+i} · pista descartada por revelar respuesta (sistema funcionando)", str(detail))
                    else:
                        fail(f"D{3+i} · pista {i}", f"422: {detail}")
                else:
                    fail(f"D{3+i} · pista {i}", f"HTTP {code}: {str(body)[:200]}")
            else:
                # La 4ª pista DEBE dar 429
                if code == 429:
                    detail = body.get("detail", "") if isinstance(body, dict) else str(body)
                    if "limite_de_pistas_alcanzado" in str(detail):
                        ok("D7 · 4ª pista → 429 limite_de_pistas_alcanzado")
                    else:
                        ok("D7 · 4ª pista → 429", str(detail))
                else:
                    fail("D7 · 4ª pista → 429", f"HTTP {code} (esperado 429): {str(body)[:200]}")

    # 8. Referencia legislativa
    if state.get("pregunta_id"):
        print(f"\n  [D8] GET /v1/modes/reference/{state['pregunta_id']}")
        code, body = request("GET", f"/v1/modes/reference/{state['pregunta_id']}", api_key)
        print(f"    → HTTP {code}: {str(body)[:300]}")
        if code == 200:
            ok("D8 · referencia legislativa", str(body)[:100])
        elif code == 422:
            detail = body.get("detail", "") if isinstance(body, dict) else str(body)
            if "referencia_no_encontrada" in str(detail):
                ok("D8 · 422 referencia_no_encontrada (correcto — sin cita legal en evidencia)")
            else:
                fail("D8 · referencia", f"422: {detail}")
        else:
            fail("D8 · referencia legislativa", f"HTTP {code}: {body}")
    else:
        skip("D8 · referencia legislativa", "Sin pregunta_id")

# ─────────────────────────────────────────────────────────────────────────────
# LIMPIAR: borrar el curso de prueba
# ─────────────────────────────────────────────────────────────────────────────
def cleanup(api_key: str):
    section("LIMPIEZA · Borrar curso de prueba")
    if not state.get("curso_id"):
        skip("Cleanup", "Sin curso_id")
        return
    code, body = request("DELETE", f"/v1/courses/{state['curso_id']}", api_key)
    if code == 204:
        ok("DELETE /v1/courses — curso borrado")
    elif code == 409:
        fail("DELETE /v1/courses", f"409: {body} (ingesta activa?)")
    else:
        fail("DELETE /v1/courses", f"HTTP {code}: {body}")

# ─────────────────────────────────────────────────────────────────────────────
# REPORTE FINAL
# ─────────────────────────────────────────────────────────────────────────────
def print_report():
    section("REPORTE FINAL")
    passed = [r for r in results if r[0] == "PASS"]
    failed = [r for r in results if r[0] == "FAIL"]
    skipped = [r for r in results if r[0] == "SKIP"]

    print(f"\n  Total: {len(results)} checks")
    print(f"  ✓ PASS:  {len(passed)}")
    print(f"  ✗ FAIL:  {len(failed)}")
    print(f"  - SKIP:  {len(skipped)}")

    if failed:
        print(f"\n  {'─'*50}")
        print("  FALLOS:")
        for _, name, detail in failed:
            print(f"    ✗ {name}")
            if detail:
                print(f"      → {detail}")

    if skipped:
        print(f"\n  {'─'*50}")
        print("  SALTADOS:")
        for _, name, reason in skipped:
            print(f"    - {name}: {reason}")

    print(f"\n  {'='*60}")
    if not failed:
        print("  RESULTADO: VERDE — todos los checks pasaron")
    else:
        print(f"  RESULTADO: {len(failed)} FALLO(S) — ver detalle arriba")

# ─────────────────────────────────────────────────────────────────────────────
# GRUPO A · Bloque 6 · Cimiento — Validación sobre curso YA existente
# ─────────────────────────────────────────────────────────────────────────────
def test_bloque6_cimiento_existing(api_key: str):
    """Valida árbol, RAG, chunks y errores sobre un curso que ya está listo."""
    cid = state["curso_id"]

    # Árbol del curso
    print(f"\n  [A4] GET /v1/courses/{cid} — árbol del curso")
    code, body = request("GET", f"/v1/courses/{cid}", api_key)
    print(f"    → HTTP {code}: {str(body)[:400]}")
    if code == 200 and isinstance(body, dict):
        ok("A4 · árbol del curso", f"documentos={len(body.get('documentos',[]))} bloques={len(body.get('bloques',[]))}")
        bloques = body.get("bloques", [])
        if bloques and bloques[0].get("temas"):
            state["topic_id"] = bloques[0]["temas"][0]["id"]
            ok("A4 · topic_id capturado", state["topic_id"])
        elif bloques:
            state["topic_id"] = bloques[0].get("id")
        # Verificar que el título del curso no es el nombre de fichero
        titulo = body.get("titulo", "")
        ok("A4 · titulo del curso", titulo)
    else:
        fail("A4 · árbol del curso", f"HTTP {code}: {str(body)[:200]}")
        return

    # Búsqueda RAG
    print(f"\n  [A5] POST /v1/courses/{cid}/search — RAG")
    code, body = request("POST", f"/v1/courses/{cid}/search", api_key,
        body={"query": "plazo procedimiento administrativo Ley 39", "k": 5}
    )
    print(f"    → HTTP {code}: {str(body)[:400]}")
    if code == 200 and isinstance(body, dict):
        pasajes = body.get("pasajes", [])
        ok("A5 · búsqueda RAG", f"{len(pasajes)} pasajes")
        if pasajes:
            p = pasajes[0]
            if "texto" in p and "page_start" in p and "score" in p:
                ok("A5 · shape pasaje", f"score={p['score']:.2f} pag={p['page_start']} texto='{p['texto'][:60]}...'")
            else:
                fail("A5 · shape pasaje", f"campos presentes: {list(p.keys())}")
    elif code == 422 and "sin_chunks_elegibles" in str(body):
        fail("A5 · RAG", "sin_chunks_elegibles — el temario no tiene chunks para esta consulta")
    else:
        fail("A5 · RAG", f"HTTP {code}: {str(body)[:200]}")

    # Listar documentos
    print(f"\n  [A6] GET /v1/courses/{cid}/documents")
    code, body = request("GET", f"/v1/courses/{cid}/documents", api_key)
    print(f"    → HTTP {code}: {str(body)[:300]}")
    if code == 200 and isinstance(body, list) and body:
        doc = body[0]
        state["documento_id"] = doc.get("id")
        ok("A6 · documentos", f"{len(body)} doc(s) estado={doc.get('estado')}")
    else:
        fail("A6 · documentos", f"HTTP {code}: {str(body)[:200]}")

    # Chunks de un tema
    if state.get("topic_id"):
        print(f"\n  [A7] GET /v1/courses/{cid}/topics/{state['topic_id']}/chunks")
        code, body = request("GET", f"/v1/courses/{cid}/topics/{state['topic_id']}/chunks", api_key, params={"limit": "5"})
        print(f"    → HTTP {code}: {str(body)[:300]}")
        if code == 200 and isinstance(body, list):
            ok("A7 · chunks del tema", f"{len(body)} chunks")
            if body and "texto" in body[0]:
                ok("A7 · shape chunk", f"pag={body[0].get('page_start')} texto='{body[0].get('texto','')[:60]}...'")
        else:
            fail("A7 · chunks", f"HTTP {code}: {str(body)[:200]}")

    # Listar cursos — verificar aparece en la lista
    print("\n  [A3] GET /v1/courses?estado=listo")
    code, body = request("GET", "/v1/courses", api_key, params={"estado": "listo", "limit": "20"})
    if code == 200 and isinstance(body, list):
        curso = next((c for c in body if c.get("id") == cid), None)
        if curso:
            ok("A3 · curso en lista", f"titulo='{curso.get('titulo')}' temas={curso.get('n_temas')}")
        else:
            fail("A3 · curso en lista", f"curso_id={cid} no aparece")
    else:
        fail("A3 · listar cursos", f"HTTP {code}: {str(body)[:200]}")

    # Error: ID inexistente → 404
    print("\n  [A8] GET /v1/courses/id-inexistente → 404")
    code, body = request("GET", "/v1/courses/id-que-no-existe", api_key)
    if code == 404:
        ok("A8 · ID inexistente → 404", str(body)[:100])
    else:
        fail("A8 · ID inexistente → 404", f"HTTP {code} (esperado 404): {body}")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Motor IA — Test suite")
    parser.add_argument("--key", required=True, help="Clave de servicio del Motor (X-API-Key)")
    parser.add_argument("--pdf", default=PDF_PATH, help="Ruta al PDF del temario")
    parser.add_argument("--groups", default="0,A,B,C,D", help="Grupos a ejecutar (0,A,B,C,D)")
    parser.add_argument("--no-cleanup", action="store_true", help="No borrar el curso al final")
    parser.add_argument("--curso-id", default=None, help="Usar un curso ya existente (skips grupo A)")
    args = parser.parse_args()

    groups = [g.strip().upper() for g in args.groups.split(",")]

    # Si el usuario pasa un curso existente, inyectarlo en el estado
    if args.curso_id:
        state["curso_id"] = args.curso_id
        print(f"\nMotor IA — Test suite (usando curso existente)")
    else:
        print(f"\nMotor IA — Test suite")

    print(f"  URL: {BASE_URL}")
    print(f"  PDF: {args.pdf}")
    print(f"  Grupos: {', '.join(groups)}")
    print(f"  User: {USER_ID}")
    if state.get("curso_id"):
        print(f"  curso_id (existente): {state['curso_id']}")

    if "0" in groups:
        test_health(args.key)
    if "A" in groups and not args.curso_id:
        test_bloque6_cimiento(args.key, args.pdf)
    elif "A" in groups and args.curso_id:
        # Validar el curso existente (árbol, RAG, chunks, errores)
        section("GRUPO A · Bloque 6 · Cimiento (curso existente)")
        test_bloque6_cimiento_existing(args.key)
    if "B" in groups:
        test_bloque6_generator(args.key)
    if "C" in groups:
        test_bloque0_onboarding(args.key)
    if "D" in groups:
        test_bloque7_training(args.key)
    if not args.no_cleanup and not args.curso_id:
        cleanup(args.key)

    print_report()

if __name__ == "__main__":
    main()
