#!/usr/bin/env python3
"""Query a daily AI Radar snapshot and emit a JSON selection of signals."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path
from typing import Any


DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
SNAPSHOT_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})\.json$")
DEFAULT_DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "daily"
ORDER_CHOICES = ("input", "newest", "oldest", "priority", "id-asc", "id-desc")
ORDER_ALIASES = {
    "editorial": "input",
    "original": "input",
    "reciente": "newest",
    "más-reciente": "newest",
    "mas-reciente": "newest",
    "antigua": "oldest",
    "antiguo": "oldest",
    "prioridad": "priority",
}
PRIORITY_RANK = {"high": 0, "medium": 1, "low": 2}


class QueryError(Exception):
    """An expected, user-correctable query error."""


def parse_date(value: str) -> date:
    """Parse an ISO calendar date and raise a useful CLI error on failure."""

    if not DATE_RE.fullmatch(value):
        raise QueryError(f"La fecha debe usar el formato YYYY-MM-DD: {value}")
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise QueryError(f"La fecha no es válida: {value}") from exc


def available_snapshot_dates(data_dir: Path) -> list[date]:
    """Return dates for primary snapshots, excluding alternative snapshots."""

    if not data_dir.is_dir():
        raise QueryError(f"No existe el directorio de snapshots: {data_dir}")

    dates: list[date] = []
    for path in data_dir.iterdir():
        match = SNAPSHOT_RE.fullmatch(path.name)
        if not match or not path.is_file():
            continue
        dates.append(parse_date(match.group(1)))
    return sorted(set(dates))


def resolve_snapshot_path(data_dir: Path, requested_date: str | None) -> tuple[Path, date]:
    """Resolve an explicit date or the newest available primary snapshot."""

    if requested_date is None:
        dates = available_snapshot_dates(data_dir)
        if not dates:
            raise QueryError(f"No hay snapshots diarios en {data_dir}")
        snapshot_date = dates[-1]
    else:
        snapshot_date = parse_date(requested_date)

    path = data_dir / f"{snapshot_date.isoformat()}.json"
    if not path.is_file():
        available = available_snapshot_dates(data_dir)
        available_text = ", ".join(item.isoformat() for item in available) or "ninguna"
        raise QueryError(
            f"No existe un snapshot primario para {snapshot_date.isoformat()}. "
            f"Disponibles: {available_text}"
        )
    return path, snapshot_date


def load_snapshot(path: Path, expected_date: date) -> dict[str, Any]:
    """Load the snapshot and check the fields needed by this tool."""

    try:
        snapshot = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise QueryError(f"El snapshot no contiene JSON válido: {path}: {exc.msg}") from exc
    except OSError as exc:
        raise QueryError(f"No se pudo leer el snapshot {path}: {exc}") from exc

    if not isinstance(snapshot, dict):
        raise QueryError(f"El snapshot debe ser un objeto JSON: {path}")
    if snapshot.get("snapshot_date") != expected_date.isoformat():
        raise QueryError(
            f"La fecha declarada en {path} no coincide con el nombre del archivo"
        )
    signals = snapshot.get("signals")
    if not isinstance(signals, list) or not all(isinstance(signal, dict) for signal in signals):
        raise QueryError(f"El snapshot debe contener una lista de señales: {path}")
    return snapshot


def normalize_order(value: str) -> str:
    normalized = ORDER_ALIASES.get(value.lower(), value.lower())
    if normalized not in ORDER_CHOICES:
        choices = ", ".join(ORDER_CHOICES)
        raise QueryError(f"Orden no soportado: {value}. Usa uno de: {choices}")
    return normalized


def newest_source_date(signal: dict[str, Any]) -> str:
    """Return the newest publication date, keeping malformed data sortable."""

    source = signal.get("source", [])
    if not isinstance(source, list):
        return ""
    dates = [
        item.get("published_at", "")
        for item in source
        if isinstance(item, dict) and isinstance(item.get("published_at", ""), str)
    ]
    return max(dates, default="")


def oldest_source_date(signal: dict[str, Any]) -> str:
    """Return the oldest publication date, keeping malformed data sortable."""

    source = signal.get("source", [])
    if not isinstance(source, list):
        return "9999-12-31"
    dates = [
        item.get("published_at", "")
        for item in source
        if isinstance(item, dict) and isinstance(item.get("published_at", ""), str)
    ]
    return min(dates, default="9999-12-31")


def priority_rank(signal: dict[str, Any]) -> int:
    """Rank a signal by its highest-priority recommended action."""

    actions = signal.get("action", [])
    if not isinstance(actions, list):
        return len(PRIORITY_RANK)
    return min(
        (PRIORITY_RANK.get(action.get("priority", ""), len(PRIORITY_RANK))
         for action in actions
         if isinstance(action, dict)),
        default=len(PRIORITY_RANK),
    )


def order_signals(signals: list[dict[str, Any]], order: str) -> list[dict[str, Any]]:
    """Return signals in the requested stable order."""

    if order == "input":
        return list(signals)
    if order == "newest":
        return sorted(signals, key=newest_source_date, reverse=True)
    if order == "oldest":
        return sorted(signals, key=oldest_source_date)
    if order == "priority":
        return sorted(signals, key=priority_rank)
    if order == "id-asc":
        return sorted(signals, key=lambda signal: str(signal.get("id", "")))
    if order == "id-desc":
        return sorted(signals, key=lambda signal: str(signal.get("id", "")), reverse=True)
    raise QueryError(f"Orden no soportado: {order}")


def query_signals(
    data_dir: Path,
    requested_date: str | None,
    limit: int,
    requested_order: str,
) -> dict[str, Any]:
    """Select exactly ``limit`` signals from a daily snapshot."""

    if limit < 1:
        raise QueryError("La cantidad debe ser un entero mayor que cero")

    order = normalize_order(requested_order)
    path, snapshot_date = resolve_snapshot_path(data_dir, requested_date)
    snapshot = load_snapshot(path, snapshot_date)
    signals = snapshot["signals"]
    if limit > len(signals):
        raise QueryError(
            f"Se solicitaron {limit} señales, pero el snapshot tiene {len(signals)}"
        )

    selected = order_signals(signals, order)[:limit]
    return {
        "snapshot_date": snapshot_date.isoformat(),
        "count": len(selected),
        "order": order,
        "signals": selected,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Devuelve señales de un snapshot diario de AI Radar en JSON."
    )
    parser.add_argument(
        "--day",
        "--date",
        dest="date",
        help="Día del snapshot en formato YYYY-MM-DD; por defecto usa el más reciente.",
    )
    parser.add_argument(
        "-n",
        "--count",
        "--limit",
        dest="limit",
        type=int,
        default=5,
        help="Cantidad exacta de señales (por defecto: 5).",
    )
    parser.add_argument(
        "--order",
        default="input",
        help=(
            "Orden: input, newest, oldest, priority, id-asc o id-desc "
            "(por defecto: input)."
        ),
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=DEFAULT_DATA_DIR,
        help="Directorio que contiene los snapshots diarios.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        result = query_signals(args.data_dir, args.date, args.limit, args.order)
    except QueryError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
