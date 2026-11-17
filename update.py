"""每週自動更新小島的市場數據（由 GitHub Actions 執行）。

流程：執行 claude-trading-skills 的三個技能 → 整理成中文 → 寫入 data/latest.json。
任何一個技能失敗時，會保留上一次的數據，不會讓網站壞掉。
"""
import json
import subprocess
import sys
import datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / "_skills" / "skills"
OUT = ROOT / "_out"
DATA = ROOT / "data" / "latest.json"
CAL_FULL = ROOT / "data" / "calendar_full.json"
TW = dt.timezone(dt.timedelta(hours=8))

SECTOR_ZH = {
    "Healthcare": "醫療", "Communication Services": "通訊服務", "Consumer Defensive": "必需消費",
    "Technology": "科技", "Financial": "金融", "Real Estate": "不動產", "Industrials": "工業",
    "Consumer Cyclical": "非必需消費", "Basic Materials": "原物料", "Energy": "能源", "Utilities": "公用事業",
}
REGIME_ZH = {"balanced": "平衡", "risk_on": "偏多", "risk_off": "偏空", "cyclical": "偏多", "defensive": "偏空"}
ZONE_ZH = {
    "Stable (No Transition)": "格局穩定，暫無轉換訊號",
    "Early Signal (Monitoring)": "出現初步轉換訊號",
    "Transition Zone (Preparing)": "多項指標進入轉換區",
    "Active Transition (Repositioning)": "格局轉換進行中",
    "Confirmed Transition (Completing)": "格局轉換確認中",
}
# 對外用的描述性說法（不放「緊縮」「衰退」等格局標籤）
DIRECTION_PHRASE = {
    ("sector_rotation", "risk_off"): "資金偏向防禦",
    ("sector_rotation", "risk_on"): "資金偏向景氣循環股",
    ("credit_conditions", "tightening"): "信用略轉緊",
    ("credit_conditions", "easing"): "信用轉鬆",
    ("concentration", "broadening"): "等權重股開始追上權值股",
    ("concentration", "concentrating"): "權值股持續主導",
    ("size_factor", "large_cap_leading"): "大型股領先",
    ("size_factor", "small_cap_leading"): "小型股轉強",
    ("yield_curve", "steepening"): "殖利率曲線轉陡",
    ("yield_curve", "flattening"): "殖利率曲線趨平",
    ("equity_bond", "risk_off"): "股債關係偏避險",
    ("equity_bond", "risk_on"): "股債關係偏積極",
}
EVENT_ZH = {
    "retail_sales": "零售銷售", "policy_minutes": "FOMC 會議紀要", "core_pce": "PCE", "pce": "PCE",
    "gdp": "GDP", "employment": "非農就業", "non_farm_payrolls": "非農就業",
    "non_farm_payrolls_change": "非農就業", "unemployment": "非農就業", "policy_rate": "FOMC 利率決議",
    "press_conference": "FOMC 利率決議", "core_inflation": "CPI", "inflation": "CPI",
}
WEEKDAY = "一二三四五六日"


def run(cmd, timeout=600):
    print("$", " ".join(str(c) for c in cmd), flush=True)
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, cwd=ROOT)
    if r.returncode != 0:
        print(r.stderr[-2000:], file=sys.stderr)
        raise RuntimeError(f"command failed: {cmd[1]}")
    return r.stdout


def load_old():
    if DATA.exists():
        return json.loads(DATA.read_text(encoding="utf-8"))
    return {}


def us_label(date_str):
    d = dt.date.fromisoformat(date_str)
    return f"{d.month}/{d.day}（{WEEKDAY[d.weekday()]}）"


def build_sector(old):
    out = run([sys.executable, str(SKILLS / "sector-analyst/scripts/analyze_sector_rotation.py"), "--json"])
    d = json.loads(out)
    rank = d["ranking"]
    g = d["groups"]
    rows = [{"name": SECTOR_ZH.get(r["sector"], r["sector"]), "ratio": r["ratio_pct"],
             "trend": r["trend"], "oversold": r["status"] == "Oversold"} for r in rank]
    prev = (old.get("sector") or {})
    data_date = d["meta"]["freshness"]["date"]
    prev_score = prev.get("score") if prev.get("data_date") != data_date else prev.get("prev_score")
    return {
        "data_date": data_date,
        "us_label": us_label(data_date),
        "score": g["score"],
        "prev_score": prev_score,
        "regime_zh": REGIME_ZH.get(g["regime"], g["regime"]),
        "cyclical_pct": g["cyclical_avg_pct"],
        "defensive_pct": g["defensive_avg_pct"],
        "up_names": [r["name"] for r in rows if r["trend"] == "Up"],
        "top3": rows[:3],
        "oversold": [r for r in rows if r["oversold"]],
        "all": rows,
    }


def build_macro():
    OUT.mkdir(exist_ok=True)
    run([sys.executable, str(SKILLS / "macro-regime-detector/scripts/macro_regime_detector.py"), "--output-dir", str(OUT)], timeout=900)
    f = sorted(OUT.glob("macro_regime_*.json"))[-1]
    m = json.loads(f.read_text(encoding="utf-8"))
    comps = m["components"]
    sig = sorted([(k, v) for k, v in comps.items() if v.get("score", 0) >= 40], key=lambda kv: -kv[1]["score"])
    phrases = []
    for k, v in sig:
        p = DIRECTION_PHRASE.get((k, v.get("direction")))
        if p and p not in phrases:
            phrases.append(p)
    names = {"concentration": ("市場集中度", "RSP/SPY"), "yield_curve": ("殖利率曲線", "SHY/TLT"),
             "credit_conditions": ("信用環境", "HYG/LQD"), "size_factor": ("大小型股", "IWM/SPY"),
             "equity_bond": ("股債關係", "SPY/TLT"), "sector_rotation": ("類股輪動", "XLY/XLP")}
    dir_zh = {"broadening": "走向擴散", "concentrating": "走向集中", "flattening": "趨平", "steepening": "轉陡",
              "tightening": "轉緊", "easing": "轉鬆", "large_cap_leading": "大型股領先",
              "small_cap_leading": "小型股領先", "risk_off": "偏避險", "risk_on": "偏積極"}
    weights = m["composite"]["component_scores"]
    parts = []
    for k, (nm, ratio) in names.items():
        v = comps.get(k, {})
        parts.append({"key": k, "name": nm, "ratio": ratio,
                      "weight": round(weights.get(k, {}).get("weight", 0) * 100),
                      "score": v.get("score", 0), "direction": dir_zh.get(v.get("direction"), v.get("direction", ""))})
    parts.sort(key=lambda x: -x["score"])
    return {
        "parts": parts,
        "zone_zh": ZONE_ZH.get(m["composite"]["zone"], m["composite"]["zone"]),
        "score": m["composite"]["composite_score"],
        "signaling": m["composite"]["signaling_components"],
        "summary_zh": "、".join(phrases[:3]) if phrases else "各項指標穩定",
        "generated_at": m["metadata"]["generated_at"],
    }


def fetch_calendar_full():
    out = run([sys.executable, str(SKILLS / "fxmacrodata-calendar/scripts/fetch_calendar.py"), "--currency", "usd", "--min-tier", "1", "--limit", "200"])
    events = json.loads(out)["events"]
    CAL_FULL.write_text(json.dumps(events, ensure_ascii=False), encoding="utf-8")
    return events


def pick_calendar(events, days=28):
    now = dt.datetime.now(TW)
    seen, out = set(), []
    for e in events:
        t = dt.datetime.fromisoformat(e["announcement_datetime_utc"]).astimezone(TW)
        if not (now - dt.timedelta(hours=12) <= t <= now + dt.timedelta(days=days)):
            continue
        name = EVENT_ZH.get(e["release"], e.get("name", ""))
        key = (t.strftime("%m/%d"), name)
        if key in seen:
            continue
        seen.add(key)
        same = [x for x in out if x["date"] == t.strftime("%-m/%-d") and x["time"] == t.strftime("%H:%M")]
        if same:
            same[0]["event"] += "、" + name
            continue
        out.append({"date": t.strftime("%-m/%-d"), "weekday": WEEKDAY[t.weekday()], "time": t.strftime("%H:%M"), "event": name})
    return out


def mino_says(s):
    top = "、".join(r["name"] for r in s["top3"][:2])
    weak = "、".join(r["name"] for r in s["oversold"]) or "沒有類股超賣"
    return f"最新收盤：{top}跑在前面，{weak}偏弱～11 個類股有 {len(s['up_names'])} 個趨勢向上喔！"


def main():
    old = load_old()
    new = dict(old)
    for key, fn in (("sector", lambda: build_sector(old)), ("macro", build_macro)):
        try:
            new[key] = fn()
        except Exception as exc:  # 保留舊資料
            print(f"[warn] {key} 更新失敗，保留上次資料：{exc}", file=sys.stderr)
    try:
        events = fetch_calendar_full()
    except Exception as exc:
        print(f"[warn] 行事曆抓取失敗，改用上次存的完整行事曆：{exc}", file=sys.stderr)
        events = json.loads(CAL_FULL.read_text(encoding="utf-8")) if CAL_FULL.exists() else []
    new["calendar"] = pick_calendar(events)
    if "sector" in new:
        new["mino_says"] = mino_says(new["sector"])
    new["updated_at"] = dt.datetime.now(TW).strftime("%Y-%m-%d %H:%M")
    DATA.parent.mkdir(exist_ok=True)
    DATA.write_text(json.dumps(new, ensure_ascii=False, indent=2), encoding="utf-8")
    print("updated", DATA)


if __name__ == "__main__":
    main()
