import asyncio
import subprocess
import os
import json
from pathlib import Path


FFMPEG = os.getenv("FFMPEG_PATH", "ffmpeg")
FFPROBE = "ffprobe"
HLS_DIR = Path(os.getenv("HLS_DIR", "./data/hls"))
THUMBNAILS_DIR = Path(os.getenv("THUMBNAILS_DIR", "./data/thumbnails"))


async def get_video_info(video_path: str) -> dict:
    cmd = [
        FFPROBE, "-v", "quiet", "-print_format", "json",
        "-show_streams", "-show_format", video_path,
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    stdout, _ = await proc.communicate()
    info = json.loads(stdout)
    fmt = info.get("format", {})
    video_stream = next(
        (s for s in info.get("streams", []) if s.get("codec_type") == "video"), {}
    )
    return {
        "duration": float(fmt.get("duration", 0)),
        "width": video_stream.get("width"),
        "height": video_stream.get("height"),
        "fps": eval(video_stream.get("r_frame_rate", "25/1")),
        "codec": video_stream.get("codec_name"),
        "size_bytes": int(fmt.get("size", 0)),
    }


async def generate_hls(video_path: str, match_id: int) -> str:
    output_dir = HLS_DIR / str(match_id)
    output_dir.mkdir(parents=True, exist_ok=True)
    playlist = output_dir / "index.m3u8"

    if playlist.exists():
        return str(playlist)

    cmd = [
        FFMPEG, "-i", video_path,
        "-c:v", "libx264", "-crf", "23", "-preset", "fast",
        "-c:a", "aac", "-b:a", "128k",
        "-hls_time", "6",
        "-hls_playlist_type", "vod",
        "-hls_segment_filename", str(output_dir / "seg%04d.ts"),
        str(playlist),
        "-y",
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg HLS error: {stderr.decode()}")
    return str(playlist)


async def extract_thumbnail(video_path: str, match_id: int, time_offset: float = 5.0) -> str:
    THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)
    out = THUMBNAILS_DIR / f"{match_id}.jpg"
    cmd = [
        FFMPEG, "-ss", str(time_offset), "-i", video_path,
        "-vframes", "1", "-vf", "scale=640:-1", str(out), "-y",
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    await proc.communicate()
    return str(out) if out.exists() else ""


async def extract_segment_clip(video_path: str, start: float, end: float, output_path: str) -> str:
    duration = end - start
    cmd = [
        FFMPEG, "-ss", str(start), "-i", video_path,
        "-t", str(duration),
        "-c:v", "libx264", "-crf", "23", "-preset", "fast",
        "-c:a", "aac",
        output_path, "-y",
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg clip error: {stderr.decode()}")
    return output_path
