"""
L-Diversity Attack Simulator.

Demonstrates various privacy attacks on anonymized hospital data,
including homogeneity attacks and background-knowledge attacks.
"""

import pandas as pd
from typing import List, Dict, Any
from collections import Counter
from anonymizer import find_equivalence_classes


def homogeneity_attack(
    df: pd.DataFrame,
    target_qi: Dict[str, str],
    sensitive_col: str = "diagnosis",
    qi_columns: List[str] = None
) -> Dict[str, Any]:
    """
    Perform a homogeneity attack.

    If all records in an equivalence class share the same sensitive value,
    an attacker who knows the quasi-identifiers can determine the sensitive attribute.

    Args:
        df: The anonymized DataFrame
        target_qi: Dict mapping QI column names to target values (e.g., {"age": "30-39", "zipcode": "130**"})
        sensitive_col: Name of the sensitive column
        qi_columns: List of quasi-identifier column names
    """
    if qi_columns is None:
        qi_columns = ["age", "zipcode", "gender"]

    # Find the equivalence class matching target QIs
    mask = pd.Series([True] * len(df), index=df.index)
    for col, val in target_qi.items():
        if col in df.columns:
            mask &= (df[col].astype(str) == str(val))

    matching_records = df[mask]

    if len(matching_records) == 0:
        return {
            "success": False,
            "attack_type": "homogeneity",
            "message": "No matching records found for the given quasi-identifiers.",
            "target_qi": target_qi,
            "matching_count": 0,
            "sensitive_values": [],
            "inferred_value": None,
            "confidence": 0.0
        }

    sensitive_values = matching_records[sensitive_col].tolist()
    unique_values = list(set(sensitive_values))
    value_counts = dict(Counter(sensitive_values))

    # Attack succeeds if there's only one unique sensitive value
    attack_success = len(unique_values) == 1
    most_common = Counter(sensitive_values).most_common(1)[0]

    return {
        "success": attack_success,
        "attack_type": "homogeneity",
        "message": (
            f"ATTACK SUCCESSFUL! All {len(matching_records)} records in this equivalence class "
            f"have diagnosis: '{unique_values[0]}'. The victim's diagnosis is definitively known."
            if attack_success else
            f"Attack partially successful. {len(unique_values)} distinct diagnoses found. "
            f"Most likely: '{most_common[0]}' ({most_common[1]}/{len(sensitive_values)} = "
            f"{round(most_common[1]/len(sensitive_values)*100, 1)}% probability)"
        ),
        "target_qi": target_qi,
        "matching_count": len(matching_records),
        "sensitive_values": unique_values,
        "sensitive_distribution": value_counts,
        "inferred_value": unique_values[0] if attack_success else most_common[0],
        "confidence": round(most_common[1] / len(sensitive_values) * 100, 2),
        "records": matching_records.to_dict("records")
    }


def background_knowledge_attack(
    df: pd.DataFrame,
    target_qi: Dict[str, str],
    known_exclusions: List[str],
    sensitive_col: str = "diagnosis",
    qi_columns: List[str] = None
) -> Dict[str, Any]:
    """
    Perform a background knowledge attack.

    Even if an equivalence class has diverse sensitive values, an attacker
    with background knowledge (e.g., knowing the victim doesn't have certain
    conditions) can narrow down possibilities.

    Args:
        df: The anonymized DataFrame
        target_qi: Dict mapping QI column names to target values
        known_exclusions: List of sensitive values the attacker knows the victim DOESN'T have
        sensitive_col: Name of the sensitive column
    """
    if qi_columns is None:
        qi_columns = ["age", "zipcode", "gender"]

    # Find matching records
    mask = pd.Series([True] * len(df), index=df.index)
    for col, val in target_qi.items():
        if col in df.columns:
            mask &= (df[col].astype(str) == str(val))

    matching_records = df[mask]

    if len(matching_records) == 0:
        return {
            "success": False,
            "attack_type": "background_knowledge",
            "message": "No matching records found.",
            "target_qi": target_qi,
            "known_exclusions": known_exclusions,
            "remaining_values": [],
            "inferred_value": None,
            "confidence": 0.0
        }

    sensitive_values = matching_records[sensitive_col].tolist()
    original_unique = list(set(sensitive_values))

    # Apply background knowledge to eliminate known non-matches
    remaining_records = matching_records[~matching_records[sensitive_col].isin(known_exclusions)]
    remaining_values = remaining_records[sensitive_col].tolist()
    remaining_unique = list(set(remaining_values))

    if len(remaining_unique) == 0:
        return {
            "success": False,
            "attack_type": "background_knowledge",
            "message": "Background knowledge eliminated all candidates - contradiction detected.",
            "target_qi": target_qi,
            "known_exclusions": known_exclusions,
            "original_diversity": len(original_unique),
            "remaining_values": [],
            "inferred_value": None,
            "confidence": 0.0
        }

    most_common = Counter(remaining_values).most_common(1)[0]
    attack_success = len(remaining_unique) == 1

    return {
        "success": attack_success,
        "attack_type": "background_knowledge",
        "message": (
            f"ATTACK SUCCESSFUL! After eliminating {known_exclusions}, only '{remaining_unique[0]}' "
            f"remains. The victim's diagnosis is definitively known."
            if attack_success else
            f"Diversity reduced from {len(original_unique)} to {len(remaining_unique)} possible diagnoses. "
            f"Most likely: '{most_common[0]}' ({round(most_common[1]/len(remaining_values)*100, 1)}% probability)"
        ),
        "target_qi": target_qi,
        "known_exclusions": known_exclusions,
        "original_diversity": len(original_unique),
        "remaining_diversity": len(remaining_unique),
        "original_values": original_unique,
        "remaining_values": remaining_unique,
        "remaining_distribution": dict(Counter(remaining_values)),
        "inferred_value": remaining_unique[0] if attack_success else most_common[0],
        "confidence": round(most_common[1] / len(remaining_values) * 100, 2),
        "records_before": matching_records.to_dict("records"),
        "records_after": remaining_records.to_dict("records")
    }


def skewness_attack(
    df: pd.DataFrame,
    sensitive_col: str = "diagnosis",
    qi_columns: List[str] = None,
    threshold: float = 70.0
) -> Dict[str, Any]:
    """
    Detect skewness vulnerabilities across all equivalence classes.

    Even with l-diversity, if the distribution of sensitive values is highly
    skewed (one value dominates), an attacker can still make high-confidence
    inferences.

    Args:
        df: The anonymized DataFrame
        sensitive_col: Name of the sensitive column
        qi_columns: List of quasi-identifier column names
        threshold: Percentage threshold to flag as skewed
    """
    if qi_columns is None:
        qi_columns = ["age", "zipcode", "gender"]

    eq_classes = find_equivalence_classes(df, qi_columns)
    vulnerable_classes = []

    for key, group in eq_classes.items():
        sensitive_values = group[sensitive_col].tolist()
        total = len(sensitive_values)
        value_counts = Counter(sensitive_values)
        most_common = value_counts.most_common(1)[0]
        dominance = (most_common[1] / total) * 100

        if dominance >= threshold:
            vulnerable_classes.append({
                "equivalence_class": key,
                "size": total,
                "dominant_value": most_common[0],
                "dominance_percentage": round(dominance, 2),
                "distribution": dict(value_counts),
                "distinct_values": len(set(sensitive_values)),
                "records": group.to_dict("records")
            })

    return {
        "attack_type": "skewness",
        "threshold": threshold,
        "total_classes": len(eq_classes),
        "vulnerable_count": len(vulnerable_classes),
        "vulnerability_rate": round(len(vulnerable_classes) / max(len(eq_classes), 1) * 100, 2),
        "vulnerable_classes": vulnerable_classes
    }


def full_vulnerability_scan(
    df: pd.DataFrame,
    l_value: int = 2,
    sensitive_col: str = "diagnosis",
    qi_columns: List[str] = None
) -> Dict[str, Any]:
    """Run all attack types and return comprehensive vulnerability report."""
    if qi_columns is None:
        qi_columns = ["age", "zipcode", "gender"]

    eq_classes = find_equivalence_classes(df, qi_columns)
    results = {
        "total_records": len(df),
        "total_equivalence_classes": len(eq_classes),
        "homogeneity_vulnerable": [],
        "low_diversity": [],
        "skewed_classes": [],
        "overall_risk_score": 0.0
    }

    for key, group in eq_classes.items():
        sensitive_values = group[sensitive_col].tolist()
        total = len(sensitive_values)
        value_counts = Counter(sensitive_values)
        unique_count = len(set(sensitive_values))
        most_common = value_counts.most_common(1)[0]
        dominance = (most_common[1] / total) * 100

        class_info = {
            "equivalence_class": key,
            "size": total,
            "distinct_values": unique_count,
            "dominant_value": most_common[0],
            "dominance_percentage": round(dominance, 2),
            "distribution": dict(value_counts)
        }

        if unique_count == 1:
            results["homogeneity_vulnerable"].append(class_info)
        elif unique_count < l_value:
            results["low_diversity"].append(class_info)

        if dominance >= 70 and unique_count > 1:
            results["skewed_classes"].append(class_info)

    # Calculate overall risk score (0-100)
    total_classes = max(len(eq_classes), 1)
    homo_risk = len(results["homogeneity_vulnerable"]) / total_classes * 50
    div_risk = len(results["low_diversity"]) / total_classes * 30
    skew_risk = len(results["skewed_classes"]) / total_classes * 20
    results["overall_risk_score"] = round(min(homo_risk + div_risk + skew_risk, 100), 2)

    results["risk_level"] = (
        "CRITICAL" if results["overall_risk_score"] >= 70 else
        "HIGH" if results["overall_risk_score"] >= 40 else
        "MEDIUM" if results["overall_risk_score"] >= 20 else
        "LOW"
    )

    return results
