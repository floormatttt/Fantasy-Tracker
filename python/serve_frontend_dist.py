#!/usr/bin/env python3
"""
Serve the built frontend from frontend/dist with cache disabled so updated JSON
files are reflected immediately during local use.
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path


PORT = 4174
DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"


class NoCacheHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    server = HTTPServer(("localhost", PORT), NoCacheHandler)
    print(f"Serving no-cache frontend at http://localhost:{PORT}")
    server.serve_forever()
