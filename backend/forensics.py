import hashlib
import logging
import os
import tempfile
from dataclasses import dataclass
from typing import Dict, Generator, List, Optional, Tuple


logger = logging.getLogger(__name__)


# Suspicious extensions to flag in the report (lowercase)
_SUSPICIOUS_EXTENSIONS = {".exe", ".dll", ".js", ".vbs", ".ps1", ".bat", ".scr"}


@dataclass
class FileRecord:
    path: str
    size: int
    ctime: Optional[int]
    mtime: Optional[int]
    atime: Optional[int]
    sha256: Optional[str]


def _safe_name(tsk_file) -> str:
    try:
        name = tsk_file.info.name.name
        if isinstance(name, bytes):
            return name.decode(errors="ignore")
        return str(name)
    except Exception:
        return "<unknown>"


def _iter_fs_entries(fs, directory=None, base_path: str = "") -> Generator[Tuple[str, object], None, None]:
    """
    Depth-first traversal of the filesystem entries yielding (path, tsk_file) for regular files.
    """
    import pytsk3  # type: ignore

    try:
        if directory is None:
            directory = fs.open_dir(path="/")
    except Exception as exc:
        logger.warning("Failed to open root directory: %s", exc)
        return

    for entry in directory:
        try:
            if not hasattr(entry, "info") or entry.info is None:
                continue
            name = entry.info.name
            meta = entry.info.meta
            if name is None:
                continue
            fname = name.name
            # Skip special entries
            if fname in (b".", b".."):
                continue
            try:
                fname_str = fname.decode(errors="ignore") if isinstance(fname, (bytes, bytearray)) else str(fname)
            except Exception:
                fname_str = "<nondecodable>"

            path = f"{base_path}/{fname_str}" if base_path else f"/{fname_str}"

            # If it is a directory, recurse
            if meta and meta.type == pytsk3.TSK_FS_META_TYPE_DIR:
                try:
                    subdir = fs.open_dir(path=path)
                    yield from _iter_fs_entries(fs, subdir, path)
                except Exception:
                    continue
                continue

            # Regular files
            if meta and meta.type == pytsk3.TSK_FS_META_TYPE_REG:
                yield path, entry
        except Exception:
            # Continue traversal even if one entry fails
            continue


def _hash_file(tsk_file) -> Tuple[int, Optional[str]]:
    """
    Compute size and SHA256 of a TSK file-like object by reading content in chunks.
    Returns (size, sha256_hex or None on failure).
    """
    try:
        meta = tsk_file.info.meta
        size = int(getattr(meta, "size", 0) or 0)
        hasher = hashlib.sha256()
        offset = 0
        chunk_size = 1024 * 1024
        while offset < size:
            # read_random may return fewer bytes than requested
            data = tsk_file.read_random(offset, min(chunk_size, size - offset))
            if not data:
                break
            hasher.update(data)
            offset += len(data)
        # If size is 0, still return the hash of empty content
        return size, hasher.hexdigest()
    except Exception as exc:
        logger.debug("Hashing failed for file: %s", exc)
        try:
            meta = tsk_file.info.meta
            return int(getattr(meta, "size", 0) or 0), None
        except Exception:
            return 0, None


def analyze_raw_image(file_bytes: bytes, top_n: int = 10) -> Dict:
    """
    Analyze a RAW forensic disk image using pytsk3, enumerate files and compute SHA256.

    Returns a summary dictionary with keys:
    - num_files: total number of regular files discovered
    - top_files: list of up to top_n largest files with name, size, sha256
    - suspicious: list of filenames (basename) with suspicious extensions observed
    - hashes: list of {name, sha256} for all files (size omitted for brevity)
    """
    import pytsk3  # type: ignore

    if not file_bytes:
        raise ValueError("Empty RAW image provided")

    # Persist to a temporary file because pytsk3 requires a file path
    with tempfile.NamedTemporaryFile(prefix="dfir_raw_", suffix=".img", delete=True) as tmp:
        tmp.write(file_bytes)
        tmp.flush()

        # Open the image and detect volumes/filesystems
        img_info = pytsk3.Img_Info(tmp.name)

        # Attempt to open as a filesystem directly first
        fs_objects: List[Tuple[str, object]] = []
        try:
            fs = pytsk3.FS_Info(img_info)
            fs_objects.append(("/", fs))
        except Exception:
            # If not a single FS, try volume system (partitioned image)
            try:
                vs = pytsk3.Volume_Info(img_info)
                for part in vs:
                    try:
                        if getattr(part, "len", 0) <= 0:
                            continue
                        start_offset = part.start * 512  # sectors to bytes
                        fs = pytsk3.FS_Info(img_info, offset=start_offset)
                        label = getattr(part, "desc", b"")
                        label_str = label.decode(errors="ignore") if isinstance(label, (bytes, bytearray)) else str(label)
                        mount = f"partition@{start_offset}:{label_str}".strip(":")
                        fs_objects.append((mount, fs))
                    except Exception:
                        continue
            except Exception as exc:
                logger.warning("Failed to open volume system: %s", exc)

        records: List[FileRecord] = []
        suspicious_names: List[str] = []
        all_hashes: List[Dict[str, str]] = []

        for mount_label, fs in fs_objects:
            try:
                for path, entry in _iter_fs_entries(fs):
                    try:
                        tsk_file = entry.as_file()
                    except Exception:
                        # Open via path as a fallback
                        try:
                            tsk_file = fs.open(path)
                        except Exception:
                            continue

                    size, sha256_hex = _hash_file(tsk_file)

                    # Times (may be None depending on FS)
                    ctime = None
                    mtime = None
                    atime = None
                    try:
                        meta = tsk_file.info.meta
                        ctime = int(getattr(meta, "crtime", 0) or 0) or None
                        mtime = int(getattr(meta, "mtime", 0) or 0) or None
                        atime = int(getattr(meta, "atime", 0) or 0) or None
                    except Exception:
                        pass

                    rec = FileRecord(
                        path=f"{mount_label}{path}" if mount_label != "/" else path,
                        size=size,
                        ctime=ctime,
                        mtime=mtime,
                        atime=atime,
                        sha256=sha256_hex,
                    )
                    records.append(rec)

                    # Suspicious extension tracking
                    _, ext = os.path.splitext(rec.path.lower())
                    if ext in _SUSPICIOUS_EXTENSIONS:
                        suspicious_names.append(os.path.basename(rec.path))

                    if sha256_hex:
                        all_hashes.append({"name": rec.path, "sha256": sha256_hex})
            except Exception as exc:
                logger.debug("Traversal failed on %s: %s", mount_label, exc)
                continue

    # Prepare summary
    records.sort(key=lambda r: r.size, reverse=True)
    top_records = records[:top_n]
    summary = {
        "num_files": len(records),
        "top_files": [
            {"name": r.path, "size": r.size, "sha256": r.sha256} for r in top_records
        ],
        "suspicious": sorted(list(dict.fromkeys(suspicious_names))),
        "hashes": all_hashes,
    }
    return summary


