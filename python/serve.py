#!/usr/bin/env python3
"""
Simple HTTP server for viewing the NBA stats dashboard locally.
Run this script, then visit http://localhost:8000/nba_stats.html
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8000

class MyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add headers to allow local file loading
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    server = HTTPServer(('localhost', PORT), MyHTTPRequestHandler)
    print(f"🚀 Server running at http://localhost:{PORT}")
    print(f"📊 Open http://localhost:{PORT}/nba_stats.html in your browser")
    print(f"   Press Ctrl+C to stop the server\n")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n✓ Server stopped")
        sys.exit(0)
