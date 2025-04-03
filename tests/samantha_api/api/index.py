from pathlib import Path
import sys

# Add the parent directory to the Python path
parent_dir = str(Path(__file__).parent.parent.absolute())
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Import and create app instance from your main.py
from main import app
