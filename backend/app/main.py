from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

from .routers import data, ai, analytics, umlaeufe

app = FastAPI(title="VDV Schedule API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:5173", "http://127.0.0.1:3001", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(umlaeufe.router)

# Serve Frontend (Monolithic Mode)
# If the frontend/dist directory exists, we serve it as static files.
# This allows the app to be deployed as a single service on Render.
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "frontend", "dist")

if os.path.exists(frontend_dist):
    # Mount assets (CSS, JS, Images)
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    
    # Catch-all route for React Router (SPA)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Allow API calls to pass through
        if full_path.startswith("api/"):
            return {"detail": "API endpoint not found"} # Or let FastAPI handle it
            
        # Serve index.html for all other routes
        return FileResponse(os.path.join(frontend_dist, "index.html"))

@app.get("/")
def read_root():
    return {"message": "VDV Schedule API is running"}
