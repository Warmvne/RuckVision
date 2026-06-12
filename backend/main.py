import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from db.database import init_db
from routers import matches, segments, stats

app = FastAPI(title="Rugby Analyst API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static video/HLS files
for static_dir, mount_path in [
    (os.getenv("HLS_DIR", "./data/hls"), "/hls"),
    (os.getenv("THUMBNAILS_DIR", "./data/thumbnails"), "/thumbnails"),
    (os.getenv("VIDEOS_DIR", "./data/videos"), "/videos"),
]:
    Path(static_dir).mkdir(parents=True, exist_ok=True)
    app.mount(mount_path, StaticFiles(directory=static_dir), name=mount_path.strip("/"))

app.include_router(matches.router)
app.include_router(segments.router)
app.include_router(stats.router)


@app.on_event("startup")
async def startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}
