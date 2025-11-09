import hashlib
import logging
import os
import tempfile
import math
from dataclasses import dataclass
from typing import Dict, Generator, List, Optional, Tuple, Any

logger = logging.getLogger(__name__)

# Suspicious extensions to flag (lowercase)
_SUSPICIOUS_EXTENSIONS = {".exe", ".dll", ".js", ".vbs", ".ps1", ".bat", ".scr"}
_SUSP_EXT = set(_SUSPICIOUS_EXTENSIONS)
_MAX_READ = 1024 * 1024  # 1MB for heuristics

# Optional ML scoring helper
try:  # lazy optional import; analysis should not fail if ML isn't available
    from .ml_pipeline import score_bytes  # type: ignore
except Exception:
    try:
        from ml_pipeline import score_bytes  # type: ignore
    except Exception:  # noqa: F401
        score_bytes = None  # type: ignore

try:
    import pytsk3  # type: ignore
except Exception:  # pragma: no cover - runtime dependency
    pytsk3 = None  # type: ignore


def _entropy(data: bytes) -> float:
    if not data:
        return 0.0
    freq = [0] * 256
    for b in data:
        freq[b] += 1
    n = len(data)
    h = 0.0
    for c in freq:
        if c:
            p = c / n
            h -= p * math.log2(p)
    return h


def _sha256_stream(tsk_file) -> str:
    h = hashlib.sha256()
    try:
        size = int(getattr(tsk_file.info.meta, "size", 0) or 0)
    except Exception:
        size = 0
    offset = 0
    while offset < size:
        try:
            chunk = tsk_file.read_random(offset, min(8192, size - offset))
        except Exception:
            break
        if not chunk:
            break
        h.update(chunk)
        offset += len(chunk)
    return h.hexdigest()


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
            data = tsk_file.read_random(offset, min(chunk_size, size - offset))
            if not data:
                break
            hasher.update(data)
            offset += len(data)
        return size, hasher.hexdigest()
    except Exception as exc:
        logger.debug("Hashing failed for file: %s", exc)
        try:
            meta = tsk_file.info.meta
            return int(getattr(meta, "size", 0) or 0), None
        except Exception:
            return 0, None


def _validate_disk_image(file_bytes: bytes) -> Tuple[bool, str]:
    """
    Validate if the file appears to be a valid disk image.
    Returns (is_valid, reason).
    """
    if not file_bytes or len(file_bytes) < 512:
        return False, "File too small to be a disk image (< 512 bytes)"

    # MBR signature (0x55AA at offset 510-511)
    if file_bytes[510:512] == b'\x55\xAA':
        return True, "Valid MBR signature found"

    # GPT header at LBA1 (offset 512) starts with b"EFI PART"
    if len(file_bytes) >= 520 and file_bytes[512:520] == b"EFI PART":
        return True, "GPT header detected at LBA1"

    # Common filesystem signatures
    signatures = {
        b'NTFS    ': (3, "NTFS filesystem"),
        b'FAT32   ': (82, "FAT32 filesystem"),
        b'FAT16   ': (54, "FAT16 filesystem"),
        b'FAT12   ': (54, "FAT12 filesystem"),
        b'\x53\xef': (0x438, "EXT2/3/4 filesystem"),  # loose check in superblock area
        b'HFS+': (0x400, "HFS+ filesystem"),
    }
    for sig, (offset, desc) in signatures.items():
        if offset + len(sig) < len(file_bytes):
            if file_bytes[offset:offset+len(sig)] == sig:
                return True, f"{desc} detected"

    # Heuristic: large and mostly binary
    if len(file_bytes) > 1_024_000:  # > ~1MB
        sample = file_bytes[:10_000]
        text_chars = sum(1 for b in sample if 32 <= b <= 126 or b in (9, 10, 13))
        if text_chars / len(sample) < 0.8:
            return True, "Large binary file, likely a disk image"

    return False, "No recognizable disk image signatures found"


MAX_SAMPLES = 8
SAMPLE_SLICE = 256 * 1024  # 256KB


def _head_slice(entry, size: int) -> bytes:
    try:
        return entry.as_file().read_random(0, min(SAMPLE_SLICE, max(0, size)))
    except Exception:
        return b""


def analyze_raw_image(file_bytes: bytes, top_n: int = 10) -> Dict[str, Any]:
    """
    Analyze a RAW forensic disk image using pytsk3, enumerate files and compute SHA256.

    Returns keys:
      - num_files
      - top_files: list[{name,size,sha256}]
      - suspicious: list[str]  (compat, basenames)
      - suspicious_detail: list[{path,ext,size,reason}]
      - hashes: list[{name|path, sha256}]
      - timeline
      - validation_message
      - (optional) file_scores, ml_image_score, parse_warnings
      - (internal) samples: list[...]  (binary blobs; main.py removes before HTTP)
    """
    if not file_bytes:
        raise ValueError("Empty RAW image provided")
    if pytsk3 is None:
        raise RuntimeError("RAW image analysis requires pytsk3. Please install pytsk3==20240302.")

    is_valid, validation_msg = _validate_disk_image(file_bytes)
    logger.info(f"Image validation: {validation_msg}")

    import time

    tmp_path = None
    records: List[FileRecord] = []
    suspicious_items: List[Dict[str, object]] = []
    all_hashes: List[Dict[str, str]] = []
    file_scores: List[Dict[str, float]] = []
    parse_errors: List[str] = []

    # 1) Create a real file path + write bytes, then CLOSE handle before pytsk3 opens it
    fd = None
    try:
        fd, tmp_path = tempfile.mkstemp(prefix="dfir_raw_", suffix=".img")
        with os.fdopen(fd, "wb") as f:
            f.write(file_bytes)
            f.flush()
            os.fsync(f.fileno())
        fd = None  # fd is owned by the closed file object now

        # 2) Open with pytsk3 (with small retry to dodge locks)
        img_info = None
        last_error = None
        for attempt in range(5):
            try:
                img_info = pytsk3.Img_Info(tmp_path)
                logger.info(f"Successfully opened image with pytsk3 (attempt {attempt + 1})")
                break
            except OSError as e:
                last_error = str(e)
                logger.warning(f"Attempt {attempt + 1} failed: {e}")
                if attempt < 4:
                    time.sleep(0.2 * (attempt + 1))
                    continue
                parse_errors.append(f"Failed to open image after {attempt + 1} attempts: {e}")
                raise ValueError(f"Cannot open disk image: {e}")

        # 3) Try FS directly; if that fails, try partitioned volume
        fs_objects: List[Tuple[str, object]] = []

        try:
            fs = pytsk3.FS_Info(img_info)
            fs_objects.append(("/", fs))
            logger.info("Opened filesystem directly (unpartitioned image)")
        except Exception as fs_err:
            logger.info(f"Direct FS access failed: {fs_err}, trying volume system...")

            try:
                vs = pytsk3.Volume_Info(img_info)
                logger.info("Opened volume system")
                partition_count = 0
                for part in vs:
                    try:
                        part_len = int(getattr(part, "len", 0) or 0)
                        part_start = int(getattr(part, "start", 0) or 0)

                        if part_len <= 0:
                            logger.debug(f"Skipping partition with invalid length: {part_len}")
                            continue

                        start_offset = part_start * 512  # sectors -> bytes
                        try:
                            fs = pytsk3.FS_Info(img_info, offset=start_offset)
                            label = getattr(part, "desc", b"")
                            label_str = (
                                label.decode(errors="ignore")
                                if isinstance(label, (bytes, bytearray))
                                else str(label)
                            )
                            mount = f"partition_{partition_count}@{start_offset}:{label_str}".strip(":")
                            fs_objects.append((mount, fs))
                            partition_count += 1
                            logger.info(f"Mounted partition {partition_count}: {mount}")
                        except Exception as part_err:
                            logger.warning(f"Failed FS mount at {start_offset}: {part_err}")
                            parse_errors.append(f"Partition at offset {start_offset}: {str(part_err)}")
                            continue
                    except Exception as part_iter_err:
                        logger.warning(f"Partition iteration error: {part_iter_err}")
                        parse_errors.append(f"Partition iteration error: {str(part_iter_err)}")
                        continue

                if partition_count == 0:
                    logger.error("No valid partitions found in volume system")
                    parse_errors.append("Volume system detected but no accessible partitions found")

            except Exception as vs_err:
                logger.error(f"Failed to open volume system: {vs_err}")
                parse_errors.append(f"Volume system error: {str(vs_err)}")

        # If no filesystem objects were successfully opened, return error details
        if not fs_objects:
            error_summary = "\n".join(parse_errors) if parse_errors else "Unknown error opening filesystem"
            logger.error(f"Failed to parse disk image: {error_summary}")
            return {
                "num_files": 0,
                "top_files": [],
                "suspicious": [],
                "suspicious_detail": [],
                "hashes": [{"path": "[raw_image]", "sha256": hashlib.sha256(file_bytes).hexdigest()}],
                "error": "Failed to parse disk image",
                "error_details": parse_errors,
                "validation_message": validation_msg,
                "fallback_entropy": _entropy(file_bytes[:1024*1024]),
                "fallback_size": len(file_bytes),
            }

        # 4) Traverse and hash + signals
        samples: List[Dict[str, object]] = []
        suspicious_first: List[Dict[str, object]] = []
        largest_rest: List[Dict[str, object]] = []

        for mount_label, fs in fs_objects:
            logger.info(f"Traversing filesystem: {mount_label}")
            try:
                for path, entry in _iter_fs_entries(fs):
                    try:
                        tsk_file = entry.as_file()
                    except Exception:
                        try:
                            tsk_file = fs.open(path)
                        except Exception:
                            continue

                    size, sha256_hex = _hash_file(tsk_file)

                    ctime = mtime = atime = None
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

                    # Signals on head bytes
                    try:
                        head = tsk_file.read_random(0, min(_MAX_READ, max(0, rec.size))) if rec.size > 0 else b""
                    except Exception:
                        head = b""
                    head_l = head.lower()
                    is_pe = head[:2] == b"MZ"
                    is_js = (b"function" in head_l) or (b"eval(" in head_l) or (b"<script" in head_l)
                    is_vbs = (b"createobject" in head_l) or (b"wscript" in head_l)
                    is_ps1 = (b"param(" in head_l) or (b"invoke-" in head_l)
                    ent = _entropy(head)
                    _, ext = os.path.splitext(rec.path.lower())

                    reasons: List[str] = []
                    if is_pe:
                        reasons.append("pe_header")
                    if is_js:
                        reasons.append("js_keywords")
                    if is_vbs:
                        reasons.append("vbs_keywords")
                    if is_ps1:
                        reasons.append("ps1_keywords")
                    if ext in _SUSP_EXT:
                        reasons.append("susp_ext")
                    if ent >= 7.5 and rec.size > 50_000:
                        reasons.append("high_entropy")

                    if reasons:
                        suspicious_item = {
                            "path": rec.path,
                            "ext": ext,
                            "size": rec.size,
                            "reason": ",".join(reasons),
                        }
                        suspicious_items.append(suspicious_item)

                        # Optional per-file ML score (cap to first 1MB)
                        if score_bytes is not None:
                            try:
                                to_read = min(_MAX_READ, max(0, rec.size))
                                chunk = tsk_file.read_random(0, to_read) if to_read > 0 else b""
                                try:
                                    s = float(score_bytes(chunk, os.path.basename(rec.path)))  # type: ignore
                                    file_scores.append({"path": rec.path, "score": s})
                                except Exception:
                                    pass
                            except Exception:
                                pass

                    # Build sampling pools for ML triage
                    try:
                        name = rec.path.rsplit("/", 1)[-1] if "/" in rec.path else rec.path
                        is_explicit = any(t in (",".join(reasons)) for t in ("pe_header", "js_keywords", "vbs_keywords", "ps1_keywords", "susp_ext"))
                        if is_explicit and len(suspicious_first) < MAX_SAMPLES:
                            suspicious_first.append({
                                "path": rec.path,
                                "name": name,
                                "head": head,
                                "size": rec.size,
                                "reason": ",".join(reasons),
                            })
                        else:
                            largest_rest.append({
                                "path": rec.path,
                                "name": name,
                                "size": rec.size,
                                "entry": entry,
                            })
                    except Exception:
                        pass

                    if sha256_hex:
                        all_hashes.append({"name": rec.path, "path": rec.path, "sha256": sha256_hex})

            except Exception as exc:
                logger.error(f"Traversal failed on {mount_label}: {exc}", exc_info=True)
                parse_errors.append(f"Traversal error in {mount_label}: {str(exc)}")
                continue

    finally:
        # Cleanup temp file
        try:
            if fd is not None:
                try:
                    os.close(fd)
                except Exception:
                    pass
            if tmp_path:
                os.remove(tmp_path)
        except Exception as e:
            logger.warning(f"Cleanup failed: {e}")

    # Build timeline
    timeline = [
        {"path": r.path, "size": r.size, "ctime": r.ctime, "mtime": r.mtime, "atime": r.atime}
        for r in records
    ]
    timeline.sort(
        key=lambda item: (
            item["mtime"] is None,
            -item["mtime"] if item["mtime"] is not None else 0,
            item["ctime"] is None,
            -item["ctime"] if item["ctime"] is not None else 0,
        )
    )

    # Finalize samples (fill remaining from largest_rest)
    try:
        largest_rest.sort(key=lambda x: x.get("size", 0), reverse=True)
        pick_more: List[Dict[str, object]] = []
        for item in largest_rest:
            if len(suspicious_first) + len(pick_more) >= MAX_SAMPLES:
                break
            try:
                head_more = item["entry"].as_file().read_random(0, min(SAMPLE_SLICE, max(0, item.get("size", 0))))
                pick_more.append({
                    "path": item.get("path"),
                    "name": item.get("name"),
                    "head": head_more,
                    "size": item.get("size", 0),
                    "reason": "",
                })
            except Exception:
                continue
        picked_samples = suspicious_first + pick_more
    except Exception:
        picked_samples = []

    total_files = len(records)
    if total_files == 0:
        logger.warning("No files found in disk image - falling back to raw analysis")
        # Fallback: inspect raw image bytes directly
        try:
            head = file_bytes[:1024 * 1024 * 5]  # first 5 MB
        except Exception:
            head = b""
        suspicious_fallback: List[Dict[str, object]] = []

        hl = head.lower()
        if b"mz" in hl:
            suspicious_fallback.append({"path": "[raw_image]", "ext": ".exe", "size": len(file_bytes), "reason": "pe_header"})
        if (b"function" in hl) or (b"eval(" in hl) or (b"<script" in hl):
            suspicious_fallback.append({"path": "[raw_image]", "ext": ".js", "size": len(file_bytes), "reason": "js_keywords"})
        if (b"createobject" in hl) or (b"wscript" in head):
            suspicious_fallback.append({"path": "[raw_image]", "ext": ".vbs", "size": len(file_bytes), "reason": "vbs_keywords"})
        if (b"param(" in hl) or (b"invoke-" in head):
            suspicious_fallback.append({"path": "[raw_image]", "ext": ".ps1", "size": len(file_bytes), "reason": "ps1_keywords"})

        ent_fb = _entropy(head)
        suspicious_names_fb = [os.path.basename(x["path"]) for x in suspicious_fallback] if suspicious_fallback else []

        return {
            "num_files": 0,
            "top_files": [],
            "suspicious": suspicious_names_fb,
            "suspicious_detail": suspicious_fallback,
            "hashes": [{"path": "[raw_image]", "sha256": hashlib.sha256(file_bytes).hexdigest()}],
            "fallback_entropy": ent_fb,
            "fallback_size": len(file_bytes),
            "parse_errors": parse_errors,
            "validation_message": validation_msg,
            "samples": picked_samples,  # kept for backend ML triage; main.py removes before HTTP
        }

    # Aggregate ML image score if any per-file scores collected (gate weak scores)
    image_score_ml: Optional[float] = None
    try:
        if file_scores:
            max_ml = max(float(item["score"]) for item in file_scores)
            image_score_ml = max_ml if max_ml >= 60.0 else None
    except Exception:
        image_score_ml = None

    # Back-compat: keep simple suspicious names list as well
    suspicious_names = []
    for it in suspicious_items:
        try:
            suspicious_names.append(os.path.basename(str(it.get("path",""))))
        except Exception:
            pass

    # top_files include sha256 to match earlier API
    records.sort(key=lambda r: r.size, reverse=True)
    top_records = records[:top_n]
    top_files = [{"name": r.path, "size": r.size, "sha256": r.sha256} for r in top_records]

    summary: Dict[str, Any] = {
        "num_files": len(records),
        "top_files": top_files,
        "suspicious": suspicious_names,          # simple list (compat)
        "suspicious_detail": suspicious_items,   # rich detail
        "hashes": all_hashes,
        "timeline": timeline,
        "validation_message": validation_msg,
        "samples": picked_samples,               # kept for backend ML triage; main.py removes
    }

    if parse_errors:
        summary["parse_warnings"] = parse_errors
    if image_score_ml is not None:
        summary["ml_image_score"] = image_score_ml
    if file_scores:
        summary["file_scores"] = file_scores[:20]

    logger.info(f"Successfully analyzed disk image: {len(records)} files found")
    return summary
