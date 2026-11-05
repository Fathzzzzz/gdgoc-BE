"""Serve only frontend/ and data/; never expose .env, .git or backend/."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class PublicHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        path = Path(self.translate_path(self.path)).resolve()
        allowed = any(path.is_relative_to(ROOT / folder) for folder in ("frontend", "data"))
        if not allowed or any(part.startswith(".") for part in path.relative_to(ROOT).parts):
            self.send_error(404)
            return None
        return super().send_head()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=3000)
    args = parser.parse_args()
    handler = partial(PublicHandler, directory=str(ROOT))
    print(f"Frontend: http://localhost:{args.port}/frontend/", flush=True)
    ThreadingHTTPServer(("127.0.0.1", args.port), handler).serve_forever()
