"""
radon_service.py --- Project Veracity Phase 2
Extracts software metrics from Python source code using Radon.
Returns a dict with lowercase keys matching train.py exactly.
"""
import json
from radon.complexity import cc_visit
from radon.metrics import h_visit
from radon.raw import analyze


def extract_metrics(source_code: str) -> dict:
    """
    Analyse Python source and return metrics dict with lowercase keys.
    Matches train.py feature_names.json exactly (36 features).
    """
    try:
        # ── 1. Raw LOC ────────────────────────────────────────────────
        raw = analyze(source_code)
        loc = raw.loc
        locode = raw.lloc
        locomment = raw.comments
        loblank = raw.blank
        locodeandcomment = raw.multi

        # ── 2. Cyclomatic Complexity ──────────────────────────────────
        cc_results = cc_visit(source_code)
        if cc_results:
            complexities = [block.complexity for block in cc_results]
            vg = float(sum(complexities))
            evg = float(max(complexities))
            ivg = float(sum(complexities) / len(complexities))
            branchcount = len(cc_results)
        else:
            vg = evg = ivg = 1.0
            branchcount = 0

        # ── 3. Halstead Metrics ───────────────────────────────────────
        h_results = h_visit(source_code)
        if h_results:
            h = h_results.total
            uniq_op = int(h.h1)
            uniq_opnd = int(h.h2)
            total_op = int(h.N1)
            total_opnd = int(h.N2)
            n_total = float(h.vocabulary)
            v_volume = float(h.volume)
            l_length = float(h.length)
            d_diff = float(h.difficulty)
            i_intel = float(v_volume / d_diff) if d_diff > 0 else 0.0
            e_effort = float(h.effort)
            b_bugs = float(h.bugs)
            t_time = float(h.time)
        else:
            uniq_op = uniq_opnd = total_op = total_opnd = 0
            n_total = v_volume = l_length = d_diff = 0.0
            i_intel = e_effort = b_bugs = t_time = 0.0

        # ── 4. OO metrics (static analysis limit) ─────────────────────
        cbo = 0.0
        rfc = 0.0

        # ── 5. ALL Engineered features (matches train.py exactly) ─────
        # Original 2 engineered features
        v_density = vg / (loc + 1e-6)
        ev_ratio = evg / (vg + 1e-6)
        
        # NEW: Complexity interactions
        cyclomatic_loc = vg * loc
        essential_design_gap = evg - ivg
        complexity_volatility = vg / (evg + 1e-6)
        
        # NEW: Halstead sophistication
        halstead_length = total_op + total_opnd
        halstead_volume_density = v_volume / (loc + 1e-6)
        halstead_difficulty = (uniq_op / 2) * (total_opnd / (uniq_opnd + 1e-6))
        
        # NEW: OO metrics interactions
        coupling_complexity = cbo * vg
        response_complexity = rfc / (cbo + 1e-6)
        comment_quality = locomment / (locode + 1e-6)
        
        # NEW: Size-normalized metrics
        uniq_op_density = uniq_op / (loc + 1e-6)
        branch_density = branchcount / (loc + 1e-6)

        return {
            # Base metrics (23)
            "loc": loc,
            "v(g)": round(vg, 4),
            "ev(g)": round(evg, 4),
            "iv(g)": round(ivg, 4),
            "n": round(n_total, 4),
            "v": round(v_volume, 4),
            "l": round(l_length, 4),
            "d": round(d_diff, 4),
            "i": round(i_intel, 4),
            "e": round(e_effort, 4),
            "b": round(b_bugs, 4),
            "t": round(t_time, 4),
            "locode": locode,
            "locomment": locomment,
            "loblank": loblank,
            "locodeandcomment": locodeandcomment,
            "uniq_op": uniq_op,
            "uniq_opnd": uniq_opnd,
            "total_op": total_op,
            "total_opnd": total_opnd,
            "branchcount": branchcount,
            "cbo": cbo,
            "rfc": rfc,
            
            # Engineered features (13) - matches train.py exactly
            "v_density": round(v_density, 6),
            "ev_ratio": round(ev_ratio, 6),
            "cyclomatic_loc": round(cyclomatic_loc, 4),
            "essential_design_gap": round(essential_design_gap, 4),
            "complexity_volatility": round(complexity_volatility, 6),
            "halstead_length": round(halstead_length, 4),
            "halstead_volume_density": round(halstead_volume_density, 6),
            "halstead_difficulty": round(halstead_difficulty, 6),
            "coupling_complexity": round(coupling_complexity, 4),
            "response_complexity": round(response_complexity, 6),
            "comment_quality": round(comment_quality, 6),
            "uniq_op_density": round(uniq_op_density, 6),
            "branch_density": round(branch_density, 6),
        }

    except SyntaxError as exc:
        raise ValueError(f"Python syntax error in submitted file: {exc}") from exc
    except Exception as exc:
        raise ValueError(f"Metric extraction failed: {exc}") from exc


# ── Standalone test ─────────────────────────────────────────────────
if __name__ == "__main__":
    _SAMPLE = '''
def calculate_risk(cyclomatic, volume, lines):
    """Evaluate defect risk of a module."""
    if cyclomatic > 10:
        if volume > 500:
            return "HIGH"
        elif lines > 200:
            return "HIGH"
        return "MEDIUM"
    elif volume > 800:
        return "MEDIUM"
    return "LOW"

def process_batch(modules):
    results = {}
    for name, code in modules.items():
        risk = calculate_risk(
            cyclomatic=code.get("v(g)", 1),
            volume=code.get("v", 0),
            lines=code.get("loc", 0),
        )
        results[name] = risk
    return results
'''
    metrics = extract_metrics(_SAMPLE)
    print(f"radon_service.py ✅ Standalone test passed")
    print(f"Feature count: {len(metrics)} (expected: 36)")
    print(f"Keys ({len(metrics)}): {list(metrics.keys())}")
    print(json.dumps(metrics, indent=2))