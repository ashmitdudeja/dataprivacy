"""
FastAPI Backend for L-Diversity Attack Demonstration.

Provides API endpoints for:
- Generating synthetic hospital discharge data
- Applying k-anonymity generalization
- Checking l-diversity properties
- Simulating privacy attacks (homogeneity, background knowledge, skewness)
- Running full vulnerability scans
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import pandas as pd

from data_generator import generate_hospital_data, get_diagnosis_categories
from anonymizer import (
    apply_generalization,
    check_k_anonymity,
    check_l_diversity,
    check_entropy_l_diversity,
    auto_anonymize_for_k,
    find_equivalence_classes
)
from attacker import (
    homogeneity_attack,
    background_knowledge_attack,
    skewness_attack,
    full_vulnerability_scan
)

app = FastAPI(
    title="L-Diversity Attack Demonstration",
    description="Interactive demonstration of l-diversity privacy attacks on hospital discharge data",
    version="1.0.0"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory data store
data_store: Dict[str, pd.DataFrame] = {}


# ─── Request/Response Models ─────────────────────────────────────────────────

class GenerateDataRequest(BaseModel):
    n_records: int = Field(default=50, ge=10, le=500, description="Number of records to generate")
    seed: int = Field(default=42, description="Random seed for reproducibility")


class GeneralizationRequest(BaseModel):
    age_level: int = Field(default=0, ge=0, le=4, description="Age generalization level (0-4)")
    zip_level: int = Field(default=0, ge=0, le=4, description="Zipcode generalization level (0-4)")
    gender_level: int = Field(default=0, ge=0, le=1, description="Gender generalization level (0-1)")


class HomogeneityAttackRequest(BaseModel):
    target_qi: Dict[str, str] = Field(description="Quasi-identifier values to target")


class BackgroundKnowledgeAttackRequest(BaseModel):
    target_qi: Dict[str, str] = Field(description="Quasi-identifier values to target")
    known_exclusions: List[str] = Field(description="Diagnoses known to NOT apply to the victim")


# ─── Data Endpoints ──────────────────────────────────────────────────────────

@app.post("/api/generate")
def generate_data(req: GenerateDataRequest):
    """Generate new synthetic hospital discharge data."""
    df = generate_hospital_data(req.n_records, req.seed)
    data_store["original"] = df
    data_store.pop("anonymized", None)

    return {
        "status": "success",
        "records": df.to_dict("records"),
        "total": len(df),
        "diagnosis_categories": get_diagnosis_categories()
    }


@app.get("/api/data/original")
def get_original_data():
    """Get the current original dataset."""
    if "original" not in data_store:
        raise HTTPException(status_code=404, detail="No data generated yet. Call /api/generate first.")
    df = data_store["original"]
    return {
        "records": df.to_dict("records"),
        "total": len(df)
    }


@app.get("/api/data/anonymized")
def get_anonymized_data():
    """Get the current anonymized dataset."""
    if "anonymized" not in data_store:
        raise HTTPException(status_code=404, detail="No anonymized data. Apply generalization first.")
    df = data_store["anonymized"]
    return {
        "records": df.to_dict("records"),
        "total": len(df)
    }


# ─── Anonymization Endpoints ─────────────────────────────────────────────────

@app.post("/api/anonymize")
def anonymize_data(req: GeneralizationRequest):
    """Apply generalization to create anonymized dataset."""
    if "original" not in data_store:
        raise HTTPException(status_code=400, detail="No data generated yet.")

    df = data_store["original"]
    anon_df = apply_generalization(df, req.age_level, req.zip_level, req.gender_level)
    data_store["anonymized"] = anon_df

    return {
        "status": "success",
        "records": anon_df.to_dict("records"),
        "total": len(anon_df),
        "generalization_levels": {
            "age": req.age_level,
            "zipcode": req.zip_level,
            "gender": req.gender_level
        }
    }


@app.post("/api/auto-anonymize")
def auto_anonymize(k: int = Query(default=3, ge=2, le=20)):
    """Automatically find minimum generalization for k-anonymity."""
    if "original" not in data_store:
        raise HTTPException(status_code=400, detail="No data generated yet.")

    df = data_store["original"]
    anon_df, levels = auto_anonymize_for_k(df, k)
    data_store["anonymized"] = anon_df

    return {
        "status": "success",
        "records": anon_df.to_dict("records"),
        "total": len(anon_df),
        "k": k,
        "generalization_levels": levels
    }


# ─── Analysis Endpoints ──────────────────────────────────────────────────────

@app.get("/api/check/k-anonymity")
def check_k(k: int = Query(default=3, ge=2, le=20), dataset: str = Query(default="anonymized")):
    """Check k-anonymity on the specified dataset."""
    if dataset not in data_store:
        raise HTTPException(status_code=400, detail=f"Dataset '{dataset}' not found.")
    return check_k_anonymity(data_store[dataset], k)


@app.get("/api/check/l-diversity")
def check_l(l: int = Query(default=2, ge=2, le=10), dataset: str = Query(default="anonymized")):
    """Check distinct l-diversity on the specified dataset."""
    if dataset not in data_store:
        raise HTTPException(status_code=400, detail=f"Dataset '{dataset}' not found.")
    return check_l_diversity(data_store[dataset], l)


@app.get("/api/check/entropy-l-diversity")
def check_entropy_l(l: int = Query(default=2, ge=2, le=10), dataset: str = Query(default="anonymized")):
    """Check entropy l-diversity on the specified dataset."""
    if dataset not in data_store:
        raise HTTPException(status_code=400, detail=f"Dataset '{dataset}' not found.")
    return check_entropy_l_diversity(data_store[dataset], l)


@app.get("/api/equivalence-classes")
def get_equivalence_classes(dataset: str = Query(default="anonymized")):
    """Get all equivalence classes from the specified dataset."""
    if dataset not in data_store:
        raise HTTPException(status_code=400, detail=f"Dataset '{dataset}' not found.")

    df = data_store[dataset]
    eq_classes = find_equivalence_classes(df)

    result = []
    for key, group in eq_classes.items():
        from collections import Counter
        sensitive_values = group["diagnosis"].tolist()
        result.append({
            "key": key,
            "size": len(group),
            "distinct_diagnoses": len(set(sensitive_values)),
            "diagnosis_distribution": dict(Counter(sensitive_values)),
            "records": group.to_dict("records")
        })

    return {
        "total_classes": len(result),
        "classes": sorted(result, key=lambda x: x["size"], reverse=True)
    }


# ─── Attack Endpoints ────────────────────────────────────────────────────────

@app.post("/api/attack/homogeneity")
def perform_homogeneity_attack(req: HomogeneityAttackRequest):
    """Perform a homogeneity attack on the anonymized data."""
    if "anonymized" not in data_store:
        raise HTTPException(status_code=400, detail="No anonymized data. Apply generalization first.")
    return homogeneity_attack(data_store["anonymized"], req.target_qi)


@app.post("/api/attack/background-knowledge")
def perform_background_knowledge_attack(req: BackgroundKnowledgeAttackRequest):
    """Perform a background knowledge attack on the anonymized data."""
    if "anonymized" not in data_store:
        raise HTTPException(status_code=400, detail="No anonymized data. Apply generalization first.")
    return background_knowledge_attack(
        data_store["anonymized"], req.target_qi, req.known_exclusions
    )


@app.get("/api/attack/skewness")
def perform_skewness_attack(
    dataset: str = Query(default="anonymized"),
    threshold: float = Query(default=70.0, ge=50.0, le=100.0)
):
    """Detect skewness vulnerabilities across all equivalence classes."""
    if dataset not in data_store:
        raise HTTPException(status_code=400, detail=f"Dataset '{dataset}' not found.")
    return skewness_attack(data_store[dataset], threshold=threshold)


@app.get("/api/vulnerability-scan")
def run_vulnerability_scan(
    l: int = Query(default=2, ge=2, le=10),
    dataset: str = Query(default="anonymized")
):
    """Run a full vulnerability scan on the specified dataset."""
    if dataset not in data_store:
        raise HTTPException(status_code=400, detail=f"Dataset '{dataset}' not found.")
    return full_vulnerability_scan(data_store[dataset], l)


# ─── Info Endpoints ───────────────────────────────────────────────────────────

@app.get("/api/info/generalization-levels")
def get_generalization_info():
    """Get information about available generalization levels."""
    return {
        "age": {
            0: "Exact age (e.g., 35)",
            1: "5-year range (e.g., 35-39)",
            2: "10-year range (e.g., 30-39)",
            3: "20-year range (e.g., 20-39)",
            4: "Suppressed (*)"
        },
        "zipcode": {
            0: "Full zip (e.g., 13053)",
            1: "4-digit (e.g., 1305*)",
            2: "3-digit (e.g., 130**)",
            3: "2-digit (e.g., 13***)",
            4: "Suppressed (*****)"
        },
        "gender": {
            0: "Exact (Male/Female)",
            1: "Suppressed (*)"
        }
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "data_loaded": "original" in data_store}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
