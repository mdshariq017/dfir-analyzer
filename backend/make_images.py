# make_labelled_images.py
import os
import hashlib

OUT = "test_labelled_images"
os.makedirs(OUT, exist_ok=True)

def write_test_file(path: str, size: int, marker: bytes):
    with open(path, "wb") as f:
        # write a repeating pattern + marker at start to be identifiable
        f.write(marker)
        remaining = size - len(marker)
        block = b"\x00" * 4096
        while remaining > 0:
            to_write = min(len(block), remaining)
            f.write(block[:to_write])
            remaining -= to_write

def sha256(p):
    import hashlib
    h = hashlib.sha256()
    with open(p, "rb") as f:
        while True:
            b = f.read(8192)
            if not b:
                break
            h.update(b)
    return h.hexdigest()

sizes = {
    ".dd": 2 * 1024 * 1024,
    ".img": 3 * 1024 * 1024,
    ".raw": 2 * 1024 * 1024,
}

for ext, sz in sizes.items():
    benign = os.path.join(OUT, f"benign_1{ext}")
    suspicious = os.path.join(OUT, f"suspicious_1{ext}")

    write_test_file(benign, sz, b"BENIGN_FILE_MARKER\n")
    write_test_file(suspicious, sz, b"SUSPICIOUS_FILE_MARKER\nMZ")  # include 'MZ' so it looks PE-ish in fallback

    print("Created:", benign, "sha256:", sha256(benign))
    print("Created:", suspicious, "sha256:", sha256(suspicious))

print("All files in", OUT)
