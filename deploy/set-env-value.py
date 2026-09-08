#!/usr/bin/env python3
"""Set one dotenv value from stdin without exposing it in process arguments."""

from __future__ import annotations

import os
from pathlib import Path
import sys


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: set-env-value.py ENV_FILE KEY")

    path = Path(sys.argv[1])
    key = sys.argv[2]
    value = sys.stdin.read().strip()
    if not value:
        raise SystemExit("empty value refused")

    file_stat = path.stat()
    lines = path.read_text(encoding="utf-8").splitlines()
    entry = f"{key}={value}"
    replaced = False

    for index, line in enumerate(lines):
        if line.startswith(f"{key}="):
            lines[index] = entry
            replaced = True

    if not replaced:
        lines.append(entry)

    temporary_path = path.with_name(f".{path.name}.tmp")
    temporary_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    os.chmod(temporary_path, file_stat.st_mode & 0o777)
    os.chown(temporary_path, file_stat.st_uid, file_stat.st_gid)
    os.replace(temporary_path, path)


if __name__ == "__main__":
    main()
