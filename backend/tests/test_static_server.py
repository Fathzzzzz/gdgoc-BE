import importlib.util
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer
from threading import Thread
import httpx


def test_static_server_exposes_only_public_files():
    path = Path(__file__).resolve().parents[2] / "scripts" / "serve_frontend.py"
    spec = importlib.util.spec_from_file_location("serve_frontend", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(module.PublicHandler, directory=str(module.ROOT)))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with httpx.Client(base_url=f"http://127.0.0.1:{server.server_port}") as client:
            assert client.get("/frontend/").status_code == 200
            assert len(client.get("/data/movies.json").json()) == 20
            for private in ["/.env", "/.git/config", "/backend/app/main.py", "/frontend/%2e%2e/.env"]:
                assert client.get(private).status_code == 404
    finally:
        server.shutdown()
        server.server_close()
        thread.join()
