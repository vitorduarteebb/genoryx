#!/usr/bin/env python3
"""GENORYX Alpha Playable Loop — teste A/B na API local da VPS."""

from __future__ import annotations

import json
import subprocess
import sys
import time
import urllib.error
import urllib.request

API = "http://127.0.0.1:3101"
PASSWORD = "correct-horse-1"
SUFFIX = str(int(time.time()))[-8:]
REPORT: dict = {"ok": True, "steps": []}


def note(name: str, **extra) -> None:
    REPORT["steps"].append({"name": name, **extra})
    print(f"[ok] {name} {extra}", flush=True)


def fail(name: str, detail: str) -> None:
    REPORT["ok"] = False
    REPORT["error"] = {"name": name, "detail": detail}
    print(f"[fail] {name}: {detail}", file=sys.stderr, flush=True)
    print(json.dumps(REPORT, indent=2, default=str))
    raise SystemExit(1)


def req(method: str, path: str, token: str | None = None, body: dict | None = None, ok: tuple[int, ...] = (200, 201)):
    data = None if body is None else json.dumps(body).encode()
    headers = {"content-type": "application/json"}
    if token:
        headers["authorization"] = f"Bearer {token}"
    request = urllib.request.Request(f"{API}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read().decode()
            payload = json.loads(raw) if raw else {}
            if response.status not in ok:
                fail(f"{method} {path}", f"{response.status} {raw}")
            return payload
    except urllib.error.HTTPError as error:
        raw = error.read().decode()
        fail(f"{method} {path}", f"{error.code} {raw}")
    except Exception as error:  # noqa: BLE001
        fail(f"{method} {path}", str(error))


def sql(query: str) -> str:
    completed = subprocess.run(
        [
            "docker",
            "exec",
            "nexora-alpha-postgres",
            "psql",
            "-U",
            "nexora",
            "-d",
            "nexora",
            "-v",
            "ON_ERROR_STOP=1",
            "-t",
            "-A",
            "-c",
            query,
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        fail("sql", completed.stderr or completed.stdout or query)
    return completed.stdout.strip()


def boot(email: str, name: str, species: str) -> str:
    req("POST", "/auth/register", body={"email": email, "password": PASSWORD})
    login = req("POST", "/auth/login", body={"email": email, "password": PASSWORD})
    token = login["accessToken"]
    req("POST", "/characters", token=token, body={"name": name})
    starter = req("POST", "/creatures/starter", token=token, body={"speciesKey": species})
    if len(starter.get("loci") or []) != 10:
        fail("starter loci", f"{species} loci={starter.get('loci')}")
    return token


def play_turn(token: str, battle_id: str, state: dict) -> dict:
    side = state["sides"][state["activeSide"]]
    for card in list(side.get("hand") or []):
        played = req(
            "POST",
            f"/battles/{battle_id}/actions",
            token=token,
            body={"type": "PLAY_CARD", "cardInstanceId": card["instanceId"]},
        )
        state = played["state"]
        if state["status"] != "ACTIVE":
            return state
        if state.get("activeSide") != side and False:
            return state
        last = (state.get("log") or [{}])[-1]
        if last.get("type") == "REJECT":
            continue
    if state["status"] == "ACTIVE":
        ended = req("POST", f"/battles/{battle_id}/actions", token=token, body={"type": "END_TURN"})
        return ended["state"]
    return state


def capture_one(token: str) -> dict:
    for attempt in range(1, 14):
        battle = req("POST", "/battles/wild", token=token, body={})
        battle_id = battle["battleId"]
        state = battle["state"]
        note("wild-start", attempt=attempt, battleId=battle_id, wild=state.get("wildSpeciesKey"))
        captured = None
        for _turn in range(18):
            if state["status"] != "ACTIVE":
                break
            wild = (state["sides"][1].get("creatures") or [{}])[0]
            ratio = wild.get("hp", 1) / max(1, wild.get("maxHp", 1))
            if ratio <= 0.7 or _turn >= 2:
                cap = req(
                    "POST",
                    f"/battles/{battle_id}/actions",
                    token=token,
                    body={"type": "CAPTURE", "orbKey": "nexorb_plus" if _turn >= 4 else "nexorb"},
                )
                state = cap["state"]
                if cap.get("captured"):
                    captured = cap["captured"]
                    note("capture", attempt=attempt, chance=cap.get("chance"), creatureId=captured["id"])
                    return captured
            if state["status"] != "ACTIVE":
                break
            if state.get("activeSide") == 0:
                state = play_turn(token, battle_id, state)
            else:
                time.sleep(0.2)
                fresh = req("GET", f"/battles/{battle_id}", token=token)
                state = fresh["state"]
        if state["status"] == "ACTIVE":
            req("POST", f"/battles/{battle_id}/actions", token=token, body={"type": "FLEE"})
    fail("capture", "não capturou após várias tentativas")
    raise AssertionError


def finish_pvp(token_a: str, token_b: str, battle_id: str) -> dict:
    state = req("GET", f"/battles/{battle_id}", token=token_a)["state"]
    for _ in range(40):
        if state["status"] != "ACTIVE":
            return state
        side = state["sides"][state["activeSide"]]
        token = token_a if side.get("characterId") and side["characterId"] == state["sides"][0].get("characterId") else token_b
        # lado 0 é o primeiro da fila (A)
        token = token_a if state["activeSide"] == 0 else token_b
        state = play_turn(token, battle_id, state)
    if state["status"] == "ACTIVE":
        fail("pvp", "batalha não terminou")
    return state


def main() -> None:
    email_a = f"loop-a-{SUFFIX}@nexora.test"
    email_b = f"loop-b-{SUFFIX}@nexora.test"
    name_a = f"LpA{SUFFIX}"[:20]
    name_b = f"LpB{SUFFIX}"[:20]

    token_a = boot(email_a, name_a, "pyron")
    token_b = boot(email_b, name_b, "florune")
    note("accounts", a=email_a, b=email_b, nameA=name_a, nameB=name_b)

    again = None
    try:
        data = json.dumps({"speciesKey": "nympha"}).encode()
        request = urllib.request.Request(
            f"{API}/creatures/starter",
            data=data,
            headers={"content-type": "application/json", "authorization": f"Bearer {token_a}"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=20) as response:
            again = response.status
    except urllib.error.HTTPError as error:
        again = error.code
    if again != 409:
        fail("starter-once", f"esperado 409, veio {again}")
    note("starter-once")

    inv = req("GET", "/inventory", token=token_a)
    shop = req("POST", "/shop/buy", token=token_a, body={"itemKey": "nexorb", "quantity": 1})
    deck = req("GET", "/deck", token=token_a)
    quests = req("GET", "/quests", token=token_a)
    note("economy", inventory=len(inv if isinstance(inv, list) else inv.get("items", [])), shop=True, deck=len(deck if isinstance(deck, list) else deck.get("cards", [])), quests=quests)

    updated = sql(f"UPDATE characters SET map_key = 'verdantis' WHERE name = '{name_a}' RETURNING map_key;")
    if "verdantis" not in updated:
        fail("map", updated)
    note("map-verdantis")

    captured = capture_one(token_a)
    creatures_a = req("GET", "/creatures", token=token_a)
    if len(creatures_a) < 2:
        fail("collection", f"A deveria ter 2 criaturas, tem {len(creatures_a)}")
    ids = [row["id"] for row in creatures_a]
    preview = req("POST", "/breeding/preview", token=token_a, body={"parentAId": ids[0], "parentBId": ids[1]})
    breed = req("POST", "/breeding", token=token_a, body={"parentAId": ids[0], "parentBId": ids[1]})
    note("breed", eggId=breed["eggId"], cost=breed.get("costGold"), hatchesAt=breed.get("hatchesAt"), preview=preview)

    sql(f"UPDATE eggs SET hatches_at = NOW() - INTERVAL '5 seconds' WHERE id = '{breed['eggId']}';")
    hatched = req("POST", f"/eggs/{breed['eggId']}/hatch", token=token_a)
    if not hatched.get("fatherId") or not hatched.get("motherId"):
        fail("genealogy", str(hatched))
    note("hatch", creatureId=hatched["id"], generation=hatched.get("generation"), father=hatched.get("fatherId"))

    listed = req("POST", "/market/listings", token=token_a, body={"creatureId": hatched["id"], "priceGold": 50})
    bought = req("POST", f"/market/listings/{listed['id']}/buy", token=token_b)
    list_b = req("GET", "/creatures", token=token_b)
    if not any(row["id"] == hatched["id"] for row in list_b):
        fail("market-transfer", str(list_b))
    history = req("GET", "/market/history", token=token_b)
    note("market", listingId=listed["id"], bought=bought, history=len(history if isinstance(history, list) else history.get("items", [])))

    q1 = req("POST", "/pvp/queue", token=token_a)
    q2 = req("POST", "/pvp/queue", token=token_b)
    battle_id = q1.get("battleId") or q2.get("battleId")
    if not battle_id:
        status = req("GET", "/pvp/status", token=token_a)
        battle_id = status.get("battleId")
    if not battle_id:
        fail("pvp-queue", f"{q1} {q2}")
    note("pvp-matched", battleId=battle_id, q1=q1.get("status"), q2=q2.get("status"))
    pvp = finish_pvp(token_a, token_b, battle_id)
    winner = pvp.get("winnerSide")
    match_id = sql(
        f"SELECT id FROM pvp_matches WHERE battle_id = '{battle_id}' LIMIT 1;"
    )
    note("pvp-finished", status=pvp.get("status"), winnerSide=winner, pvpMatch=match_id)

    REPORT["players"] = {"a": email_a, "b": email_b}
    REPORT["captured"] = captured.get("speciesKey") or captured.get("id")
    REPORT["hatched"] = hatched["id"]
    print(json.dumps(REPORT, indent=2, default=str))


if __name__ == "__main__":
    main()
