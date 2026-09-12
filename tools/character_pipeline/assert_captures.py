"""Falha se as capturas não existirem, estiverem vazias ou forem mais velhas que o job."""
from __future__ import annotations

import argparse
import os
import sys
import time


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", required=True)
    parser.add_argument("--max-age-sec", type=int, default=3600)
    parser.add_argument("names", nargs="+")
    args = parser.parse_args()
    now = time.time()
    failed = []
    for name in args.names:
        path = os.path.join(args.dir, name)
        if not os.path.isfile(path):
            failed.append(f"MISSING {name}")
            continue
        size = os.path.getsize(path)
        if size <= 0:
            failed.append(f"EMPTY {name}")
            continue
        age = now - os.path.getmtime(path)
        if age > args.max_age_sec:
            failed.append(f"STALE {name} age={int(age)}s")
    if failed:
        print("CAPTURE JOB FAILED")
        for row in failed:
            print(row)
        sys.exit(1)
    print("CAPTURE JOB OK")
    for name in args.names:
        path = os.path.join(args.dir, name)
        print(f"{name} bytes={os.path.getsize(path)} mtime={int(os.path.getmtime(path))}")


if __name__ == "__main__":
    main()
