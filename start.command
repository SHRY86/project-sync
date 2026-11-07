#!/bin/zsh
cd "$(dirname "$0")"
echo "PROJECT SYNC – Starting local development server at http://localhost:8765"
open "http://localhost:8765"
python3 -m http.server 8765
