#!/usr/bin/env python3
"""
Orquestrador do pipeline de pecas de criatura. Roda FORA do Blender.

Encadeia as etapas, para no primeiro REJECT e atualiza o
CreatureMeshyManifest.json com o resultado de cada peca — evitando
reprocessar (e regerar) asset que ja passou, conforme regra 54 da spec.

  python tools/creature_pipeline/run_pipeline.py \
      --input var/creature-parts/raw/HORNS_03_CRYSTAL.glb \
      --slot HORNS --part-id HORNS_03_CRYSTAL

  python tools/creature_pipeline/run_pipeline.py --status
"""

import argparse
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
WORK = os.path.join(REPO, "var", "creature-parts")
MANIFEST = os.path.join(REPO, "apps", "unity-game", "Assets", "GENORYX",
                        "Creatures", "CreatureMeshyManifest.json")


def blender_binary():
    explicit = os.environ.get("BLENDER_PATH")
    if explicit and os.path.exists(explicit):
        return explicit

    found = shutil.which("blender")
    if found:
        return found

    for candidate in (
        r"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe",
        r"C:\Program Files\Blender Foundation\Blender 4.1\blender.exe",
        r"C:\Program Files\Blender Foundation\Blender 4.0\blender.exe",
        "/usr/bin/blender",
        "/Applications/Blender.app/Contents/MacOS/Blender",
    ):
        if os.path.exists(candidate):
            return candidate

    return None


def run_stage(blender, script, args, label):
    command = [blender, "-b", "--factory-startup", "-P", os.path.join(HERE, script), "--"] + args
    print("\n[%s] %s" % (label, " ".join(args)))
    result = subprocess.run(command, capture_output=True, text=True)

    payload = None
    for line in result.stdout.splitlines():
        if line.startswith("GENORYX_PIPELINE_JSON "):
            payload = json.loads(line[len("GENORYX_PIPELINE_JSON "):])

    if result.returncode != 0 or payload is None or not payload.get("accepted", False):
        print(result.stdout[-4000:])
        print(result.stderr[-4000:], file=sys.stderr)
        problems = payload.get("problems") if payload else ["etapa falhou sem relatorio"]
        return False, {"step": label, "accepted": False, "problems": problems}

    print("  ok: " + json.dumps({k: v for k, v in payload.items() if k != "step"}, ensure_ascii=False)[:300])
    return True, payload


def load_manifest():
    with open(MANIFEST, "r", encoding="utf-8") as handle:
        return json.load(handle)


def save_manifest(data):
    with open(MANIFEST, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def already_passed(manifest, part_id):
    for job in manifest.get("jobs", []):
        if job.get("partId") == part_id and job.get("validation") == "PASSED":
            return job
    return None


def record(manifest, entry):
    jobs = [job for job in manifest.get("jobs", []) if job.get("partId") != entry["partId"]]
    jobs.append(entry)
    manifest["jobs"] = jobs
    manifest["assetsGenerated"] = sum(1 for job in jobs if job.get("validation") == "PASSED")
    manifest["assetsRejected"] = sum(1 for job in jobs if job.get("validation") == "REJECTED")
    save_manifest(manifest)


def status():
    manifest = load_manifest()
    jobs = manifest.get("jobs", [])
    print("manifest: %s" % MANIFEST)
    print("creditos gastos: %s | jobs: %s | aprovados: %s | rejeitados: %s"
          % (manifest.get("creditsSpent", 0), manifest.get("jobsSubmitted", 0),
             manifest.get("assetsGenerated", 0), manifest.get("assetsRejected", 0)))
    if not jobs:
        print("nenhuma peca processada pelo pipeline: V1 usa as 37 malhas proprias bakeadas pelo Unity")
        return 0
    for job in jobs:
        print("  %-24s %-8s %-10s %s" % (job.get("partId"), job.get("slot"),
                                         job.get("validation"), job.get("outputPath", "")))
    return 0


def main():
    ap = argparse.ArgumentParser(description="Pipeline Meshy -> Blender -> Unity de pecas de criatura")
    ap.add_argument("--input")
    ap.add_argument("--slot")
    ap.add_argument("--part-id")
    ap.add_argument("--task-id", default=None, help="task id do Meshy, se veio de lá")
    ap.add_argument("--credits", type=int, default=0)
    ap.add_argument("--weights-from", default=None, help=".blend de referencia para transfer_weights")
    ap.add_argument("--max-tris", type=int, default=None)
    ap.add_argument("--zup", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--status", action="store_true")
    args = ap.parse_args()

    if args.status:
        return status()

    if not (args.input and args.slot and args.part_id):
        ap.error("--input, --slot e --part-id sao obrigatorios")

    manifest = load_manifest()
    if not args.force:
        passed = already_passed(manifest, args.part_id)
        if passed:
            print("%s ja passou (%s). Use --force para reprocessar." % (args.part_id, passed.get("outputPath")))
            return 0

    blender = blender_binary()
    if blender is None:
        print("Blender nao encontrado. Defina BLENDER_PATH.", file=sys.stderr)
        return 3

    slot = args.slot.upper()
    work = os.path.join(WORK, "work")
    reports = os.path.join(WORK, "reports", args.part_id)
    previews = os.path.join(WORK, "previews")
    for path in (work, reports, previews):
        os.makedirs(path, exist_ok=True)

    normalized = os.path.join(work, args.part_id + "_norm.blend")
    fitted = os.path.join(work, args.part_id + "_fit.blend")
    bound = os.path.join(work, args.part_id + "_bound.blend")

    max_tris = args.max_tris or {"EYES": 400, "CORE": 700, "HORNS": 1200}.get(slot, 3000)

    stages = [
        ("inspect", "inspect_asset.py", [
            "--input", os.path.abspath(args.input), "--slot", slot,
            "--json", os.path.join(reports, "01_inspect.json")]),
        ("normalize", "normalize_part.py", [
            "--input", os.path.abspath(args.input), "--slot", slot,
            "--output", normalized, "--max-tris", str(max_tris),
            "--json", os.path.join(reports, "02_normalize.json")]
            + (["--zup"] if args.zup else [])),
        ("fit", "fit_to_chassis.py", [
            "--input", normalized, "--slot", slot, "--output", fitted,
            "--json", os.path.join(reports, "03_fit.json")]),
    ]

    if args.weights_from:
        stages.append(("transfer_weights", "transfer_weights.py", [
            "--source", os.path.abspath(args.weights_from), "--target", fitted,
            "--slot", slot, "--output", bound,
            "--json", os.path.join(reports, "04_weights.json")]))
    else:
        stages.append(("bind", "bind_to_skeleton.py", [
            "--input", fitted, "--slot", slot, "--output", bound,
            "--json", os.path.join(reports, "04_bind.json")]))

    stages += [
        ("validate", "validate_socket.py", [
            "--input", bound, "--slot", slot,
            "--json", os.path.join(reports, "05_validate.json")]),
        ("export", "export_unity_fbx.py", [
            "--input", bound, "--slot", slot, "--part-id", args.part_id,
            "--unity-root", os.path.join(REPO, "apps", "unity-game"),
            "--json", os.path.join(reports, "06_export.json")]),
        ("preview", "generate_preview.py", [
            "--input", bound,
            "--output", os.path.join(previews, args.part_id + ".png"),
            "--json", os.path.join(reports, "07_preview.json")]),
    ]

    output_path = None
    for label, script, stage_args in stages:
        ok, payload = run_stage(blender, script, stage_args, label)
        if not ok:
            record(manifest, {
                "partId": args.part_id,
                "taskId": args.task_id,
                "generationType": "image-to-3d" if args.task_id else "local",
                "slot": slot,
                "prompt": manifest.get("promptTemplates", {}).get(slot),
                "status": "FAILED_" + label.upper(),
                "credits": args.credits,
                "sourceReference": args.input,
                "outputPath": None,
                "validation": "REJECTED",
                "problems": payload.get("problems", []),
            })
            print("\nREJECTED em '%s': %s" % (label, payload.get("problems")), file=sys.stderr)
            return 1

        if label == "export":
            output_path = payload.get("output")

    record(manifest, {
        "partId": args.part_id,
        "taskId": args.task_id,
        "generationType": "image-to-3d" if args.task_id else "local",
        "slot": slot,
        "prompt": manifest.get("promptTemplates", {}).get(slot),
        "status": "SUCCEEDED",
        "credits": args.credits,
        "sourceReference": args.input,
        "outputPath": output_path,
        "validation": "PASSED",
        "problems": [],
    })

    print("\nPASSED %s -> %s" % (args.part_id, output_path))
    print("Aponte CreaturePartDefinition.mesh do %s para a malha deste FBX." % args.part_id)
    return 0


if __name__ == "__main__":
    sys.exit(main())
