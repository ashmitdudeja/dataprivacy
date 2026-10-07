"""
Synthetic Hospital Discharge Data Generator.

Generates realistic hospital discharge records with quasi-identifiers
(age, zipcode, gender) and a sensitive attribute (diagnosis).
"""

import random
import pandas as pd
import numpy as np
from typing import List, Dict, Any

# Realistic diagnosis pools
DIAGNOSES = [
    "Flu", "Pneumonia", "Bronchitis", "Diabetes", "Heart Disease",
    "HIV", "Cancer", "Tuberculosis", "Hepatitis B", "Stroke",
    "Obesity", "Gastritis", "Asthma", "Depression", "Anxiety",
    "Hypertension", "Arthritis", "Kidney Disease"
]

# Sensitive diagnoses (ones people wouldn't want disclosed)
SENSITIVE_DIAGNOSES = ["HIV", "Cancer", "Tuberculosis", "Hepatitis B", "Depression"]

ZIPCODES = [
    "13053", "13068", "13021", "13032", "13040",
    "14850", "14853", "14867", "14882", "14886",
    "13901", "13902", "13905", "13850", "13760"
]

GENDERS = ["Male", "Female"]


def generate_hospital_data(n_records: int = 50, seed: int = 42) -> pd.DataFrame:
    """Generate synthetic hospital discharge data."""
    random.seed(seed)
    np.random.seed(seed)

    records = []
    for i in range(n_records):
        age = random.randint(20, 85)
        zipcode = random.choice(ZIPCODES)
        gender = random.choice(GENDERS)

        # Bias certain diagnoses toward certain demographics for realism
        if age > 60:
            diagnosis = random.choice(["Heart Disease", "Diabetes", "Stroke",
                                        "Hypertension", "Cancer", "Arthritis",
                                        "Kidney Disease", "Pneumonia"])
        elif age < 35:
            diagnosis = random.choice(["Flu", "Bronchitis", "Asthma",
                                        "Gastritis", "Depression", "Anxiety",
                                        "HIV", "Obesity"])
        else:
            diagnosis = random.choice(DIAGNOSES)

        records.append({
            "id": i + 1,
            "age": age,
            "zipcode": zipcode,
            "gender": gender,
            "diagnosis": diagnosis
        })

    return pd.DataFrame(records)


def get_diagnosis_categories() -> Dict[str, List[str]]:
    """Return diagnosis categories for reference."""
    return {
        "all": DIAGNOSES,
        "sensitive": SENSITIVE_DIAGNOSES,
        "non_sensitive": [d for d in DIAGNOSES if d not in SENSITIVE_DIAGNOSES]
    }
