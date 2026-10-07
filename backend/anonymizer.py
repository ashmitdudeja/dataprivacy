"""
K-Anonymity and L-Diversity Anonymization Engine.

Implements generalization-based k-anonymity and checks for l-diversity
properties on hospital discharge data.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Any
from collections import Counter
import math


# ─── Generalization Hierarchies ───────────────────────────────────────────────

def generalize_age(age: int, level: int) -> str:
    """Generalize age by level.
    Level 0: exact age
    Level 1: 5-year ranges (20-24, 25-29, ...)
    Level 2: 10-year ranges (20-29, 30-39, ...)
    Level 3: 20-year ranges (20-39, 40-59, ...)
    Level 4: full suppression (*)
    """
    if level == 0:
        return str(age)
    elif level == 1:
        lower = (age // 5) * 5
        return f"{lower}-{lower + 4}"
    elif level == 2:
        lower = (age // 10) * 10
        return f"{lower}-{lower + 9}"
    elif level == 3:
        lower = (age // 20) * 20
        return f"{lower}-{lower + 19}"
    else:
        return "*"


def generalize_zipcode(zipcode: str, level: int) -> str:
    """Generalize zipcode by masking trailing digits.
    Level 0: full zip (13053)
    Level 1: 4-digit (1305*)
    Level 2: 3-digit (130**)
    Level 3: 2-digit (13***)
    Level 4: full suppression (*****)
    """
    if level == 0:
        return zipcode
    elif level >= len(zipcode):
        return "*" * len(zipcode)
    else:
        return zipcode[:len(zipcode) - level] + "*" * level


def generalize_gender(gender: str, level: int) -> str:
    """Generalize gender.
    Level 0: exact (Male/Female)
    Level 1: suppressed (*)
    """
    if level == 0:
        return gender
    else:
        return "*"


# ─── Anonymization Functions ─────────────────────────────────────────────────

def apply_generalization(
    df: pd.DataFrame,
    age_level: int = 0,
    zip_level: int = 0,
    gender_level: int = 0
) -> pd.DataFrame:
    """Apply generalization to quasi-identifiers."""
    result = df.copy()
    result["age"] = result["age"].apply(lambda x: generalize_age(x, age_level))
    result["zipcode"] = result["zipcode"].apply(lambda x: generalize_zipcode(x, zip_level))
    result["gender"] = result["gender"].apply(lambda x: generalize_gender(x, gender_level))
    return result


def find_equivalence_classes(df: pd.DataFrame, qi_columns: List[str] = None) -> Dict[str, pd.DataFrame]:
    """Find equivalence classes based on quasi-identifier columns."""
    if qi_columns is None:
        qi_columns = ["age", "zipcode", "gender"]

    groups = {}
    for name, group in df.groupby(qi_columns):
        key = str(name) if isinstance(name, tuple) else str((name,))
        groups[key] = group

    return groups


def check_k_anonymity(df: pd.DataFrame, k: int, qi_columns: List[str] = None) -> Dict[str, Any]:
    """Check if dataset satisfies k-anonymity."""
    if qi_columns is None:
        qi_columns = ["age", "zipcode", "gender"]

    eq_classes = find_equivalence_classes(df, qi_columns)
    class_sizes = {key: len(group) for key, group in eq_classes.items()}

    violations = {key: size for key, size in class_sizes.items() if size < k}
    satisfied = len(violations) == 0

    return {
        "satisfied": satisfied,
        "k": k,
        "total_classes": len(eq_classes),
        "min_class_size": min(class_sizes.values()) if class_sizes else 0,
        "max_class_size": max(class_sizes.values()) if class_sizes else 0,
        "avg_class_size": round(np.mean(list(class_sizes.values())), 2) if class_sizes else 0,
        "violations_count": len(violations),
        "violations": violations,
        "class_sizes": class_sizes
    }


def check_l_diversity(
    df: pd.DataFrame,
    l_value: int,
    sensitive_col: str = "diagnosis",
    qi_columns: List[str] = None
) -> Dict[str, Any]:
    """Check if dataset satisfies l-diversity (distinct l-diversity)."""
    if qi_columns is None:
        qi_columns = ["age", "zipcode", "gender"]

    eq_classes = find_equivalence_classes(df, qi_columns)
    class_details = []
    violations = []

    for key, group in eq_classes.items():
        sensitive_values = group[sensitive_col].tolist()
        distinct_count = len(set(sensitive_values))
        value_counts = dict(Counter(sensitive_values))

        detail = {
            "equivalence_class": key,
            "size": len(group),
            "distinct_sensitive_values": distinct_count,
            "sensitive_distribution": value_counts,
            "satisfies_l_diversity": distinct_count >= l_value,
            "records": group.to_dict("records")
        }

        class_details.append(detail)

        if distinct_count < l_value:
            violations.append(detail)

    return {
        "satisfied": len(violations) == 0,
        "l": l_value,
        "total_classes": len(eq_classes),
        "violations_count": len(violations),
        "violations": violations,
        "class_details": class_details
    }


def check_entropy_l_diversity(
    df: pd.DataFrame,
    l_value: int,
    sensitive_col: str = "diagnosis",
    qi_columns: List[str] = None
) -> Dict[str, Any]:
    """Check entropy l-diversity: H(S) >= log(l) for each equivalence class."""
    if qi_columns is None:
        qi_columns = ["age", "zipcode", "gender"]

    eq_classes = find_equivalence_classes(df, qi_columns)
    threshold = math.log(l_value) if l_value > 0 else 0
    class_details = []
    violations = []

    for key, group in eq_classes.items():
        sensitive_values = group[sensitive_col].tolist()
        total = len(sensitive_values)
        value_counts = Counter(sensitive_values)

        # Calculate entropy
        entropy = 0.0
        for count in value_counts.values():
            p = count / total
            if p > 0:
                entropy -= p * math.log(p)

        detail = {
            "equivalence_class": key,
            "size": total,
            "entropy": round(entropy, 4),
            "threshold": round(threshold, 4),
            "sensitive_distribution": dict(value_counts),
            "satisfies_entropy_l_diversity": entropy >= threshold
        }

        class_details.append(detail)

        if entropy < threshold:
            violations.append(detail)

    return {
        "satisfied": len(violations) == 0,
        "l": l_value,
        "entropy_threshold": round(threshold, 4),
        "total_classes": len(eq_classes),
        "violations_count": len(violations),
        "violations": violations,
        "class_details": class_details
    }


def auto_anonymize_for_k(df: pd.DataFrame, k: int) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """Automatically find minimum generalization levels to achieve k-anonymity."""
    qi_columns = ["age", "zipcode", "gender"]

    # Try increasing generalization levels
    for age_lvl in range(5):
        for zip_lvl in range(5):
            for gen_lvl in range(2):
                anon_df = apply_generalization(df, age_lvl, zip_lvl, gen_lvl)
                result = check_k_anonymity(anon_df, k, qi_columns)
                if result["satisfied"]:
                    levels = {
                        "age_level": age_lvl,
                        "zip_level": zip_lvl,
                        "gender_level": gen_lvl
                    }
                    return anon_df, levels

    # Maximum generalization
    anon_df = apply_generalization(df, 4, 4, 1)
    return anon_df, {"age_level": 4, "zip_level": 4, "gender_level": 1}
