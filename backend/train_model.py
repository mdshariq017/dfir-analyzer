import argparse
import logging
from pathlib import Path
from typing import List

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

# Define the feature schema — must match ml_pipeline.py
FEATURE_NAMES: List[str] = [
    "file_size_bytes",
    "entropy",
    "yara_match_count",
    "suspicious_string_count",
    "has_mz_header",
    "has_macro_keywords",
    "has_url",
    "has_base64_chunk",
]


def _synthesize_dataset(num_samples: int = 5000, rng_seed: int = 42):
    """
    Generate a synthetic dataset simulating benign vs malicious files.
    Benign: smaller size, lower entropy, fewer YARA hits.
    Malicious: larger size, higher entropy, more suspicious strings/flags.
    """
    rng = np.random.default_rng(rng_seed)

    # Create synthetic distributions for benign samples
    size_benign = rng.normal(loc=500_000, scale=150_000, size=num_samples // 2).clip(1_000, 5_000_000)
    entropy_benign = rng.normal(loc=4.8, scale=0.8, size=num_samples // 2).clip(0.1, 8.0)
    yara_benign = rng.poisson(lam=0.2, size=num_samples // 2)
    suscnt_benign = rng.poisson(lam=0.5, size=num_samples // 2)
    mz_benign = rng.binomial(1, 0.05, size=num_samples // 2)
    macro_benign = rng.binomial(1, 0.05, size=num_samples // 2)
    url_benign = rng.binomial(1, 0.1, size=num_samples // 2)
    b64_benign = rng.binomial(1, 0.05, size=num_samples // 2)

    # Create synthetic distributions for malicious samples
    size_mal = rng.normal(loc=1_500_000, scale=700_000, size=num_samples // 2).clip(5_000, 25_000_000)
    entropy_mal = rng.normal(loc=6.5, scale=0.7, size=num_samples // 2).clip(0.1, 8.0)
    yara_mal = rng.poisson(lam=2.5, size=num_samples // 2)
    suscnt_mal = rng.poisson(lam=5.0, size=num_samples // 2)
    mz_mal = rng.binomial(1, 0.4, size=num_samples // 2)
    macro_mal = rng.binomial(1, 0.35, size=num_samples // 2)
    url_mal = rng.binomial(1, 0.45, size=num_samples // 2)
    b64_mal = rng.binomial(1, 0.3, size=num_samples // 2)

    # Stack features for benign and malicious into arrays
    X_benign = np.vstack([
        size_benign, entropy_benign, yara_benign, suscnt_benign,
        mz_benign, macro_benign, url_benign, b64_benign,
    ]).T
    X_mal = np.vstack([
        size_mal, entropy_mal, yara_mal, suscnt_mal,
        mz_mal, macro_mal, url_mal, b64_mal,
    ]).T

    # Combine X and labels (0=benign, 1=malicious)
    X = np.vstack([X_benign, X_mal]).astype(np.float64)
    y = np.hstack([np.zeros(X_benign.shape[0], dtype=np.int64),
                   np.ones(X_mal.shape[0], dtype=np.int64)])
    return X, y


def train_and_save(model_path: Path, num_samples: int = 5000, random_state: int = 1337) -> None:
    """
    Train a RandomForest model on the synthetic dataset,
    evaluate on a test split, and save the model with metadata.
    """
    X, y = _synthesize_dataset(num_samples=num_samples, rng_seed=random_state)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2,
                                                        random_state=random_state, stratify=y)

    # Train RandomForest (robust, handles mixed features, interpretable)
    clf = RandomForestClassifier(
        n_estimators=300,             # number of trees
        max_depth=None,               # no depth limit
        min_samples_split=2,          # classic defaults
        min_samples_leaf=1,
        n_jobs=-1,                    # use all CPU cores
        random_state=random_state,
        class_weight="balanced_subsample",  # handle class imbalance
    )
    clf.fit(X_train, y_train)

    # Evaluate and log classification report
    y_pred = clf.predict(X_test)
    report = classification_report(y_test, y_pred)
    logging.info("Validation report:\n%s", report)

    # Save model + feature schema + version in a dict
    payload = {
        "model": clf,
        "feature_names": FEATURE_NAMES,
        "version": 1,
    }
    joblib.dump(payload, model_path)
    logging.info("Saved model to %s", model_path)


def main():
    """
    Command-line entrypoint.
    Allows passing output path, sample size, and random seed.
    """
    parser = argparse.ArgumentParser(description="Train and save the DFIR risk scoring model.")
    parser.add_argument("--output", type=Path,
                        default=Path(__file__).with_name("risk_model.pkl"),
                        help="Path to save model pkl")
    parser.add_argument("--samples", type=int, default=5000,
                        help="Number of synthetic samples to generate")
    parser.add_argument("--seed", type=int, default=1337,
                        help="Random seed")
    args = parser.parse_args()

    # Configure logging and start training
    logging.basicConfig(level=logging.INFO,
                        format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    train_and_save(args.output, num_samples=args.samples, random_state=args.seed)


if __name__ == "__main__":
    main()
