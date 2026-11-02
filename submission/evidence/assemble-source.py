"""Build an application-source archive, excluding private/runtime/media artifacts."""
from pathlib import Path
import hashlib
import json
import subprocess
import zipfile

root = Path(__file__).resolve().parents[2]
allowed_dirs = {"src", "tests", "scripts", "fixtures", ".github", "guardrails", "docs", "designs", "research", "architecture"}
excluded_root = {"opencode.json", "ORCHESTRATION.md"}
private = []
env = root / ".env"
if env.exists():
    for line in env.read_text(encoding="utf-8").splitlines():
        name, sep, value = line.partition("=")
        if sep and name in {"MOD_TOKEN", "LLM_API_KEY", "TWITCH_CLIENT_SECRET"}:
            value = value.strip().strip('"').strip("'")
            if value:
                private.append(value.encode())
token_file = root / "data" / "tokens.json"
if token_file.exists():
    for value in json.loads(token_file.read_text()).values():
        if isinstance(value, str) and len(value) >= 12:
            private.append(value.encode())
names = subprocess.check_output(["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=root).decode().split("\0")
out = root / "submission" / "source-code.zip"
count = 0
with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    archive.writestr("SOURCE-ARCHIVE.txt", "Lore Boss application source, tests and documentation. Not a demo-media package. Run npm ci, npm run build, npm start. Credentials and installed dependencies are excluded. Public repository: https://github.com/Vedant817/lore-boss\n")
    for name in sorted(set(names)):
        if not name:
            continue
        rel = Path(name)
        if len(rel.parts) > 1 and rel.parts[0] not in allowed_dirs:
            continue
        if len(rel.parts) == 1 and (name in excluded_root or name.startswith(".env") and name != ".env.example"):
            continue
        path = root / rel
        if not path.is_file():
            continue
        if not path.resolve().is_relative_to(root):
            raise RuntimeError("Archive candidate escaped workspace")
        data = path.read_bytes()
        if any(value in data for value in private):
            raise RuntimeError("Private credential found in source candidate; archive rejected")
        archive.writestr(name, data)
        count += 1
with zipfile.ZipFile(out) as archive:
    if archive.testzip() is not None:
        raise RuntimeError("Source ZIP CRC failed")
receipt = {"file": "source-code.zip", "sourceFiles": count, "bytes": out.stat().st_size, "sha256": hashlib.sha256(out.read_bytes()).hexdigest(), "crc": "PASS", "activeCredentialScan": "PASS", "excludes": [".git", "node_modules", ".env", "data", "submission media", "orchestration configuration"]}
(root / "submission/evidence/source-archive.json").write_text(json.dumps(receipt, indent=2))
print(json.dumps(receipt))
