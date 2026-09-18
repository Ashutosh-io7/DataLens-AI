from __future__ import annotations

import math
from typing import Any
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, f1_score
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
import shap


def _clean_number(val: Any) -> float:
    try:
        f = float(val)
        return round(f, 4) if math.isfinite(f) else 0.0
    except (ValueError, TypeError):
        return 0.0


def train_and_explain_model(
    df: pd.DataFrame,
    target_col: str,
    feature_cols: list[str] | None = None,
) -> dict[str, Any]:
    """
    Trains an XGBoost model and calculates exact SHAP feature importance.
    """
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in dataset.")

    # 1. Clean dataset for training
    df_clean = df.copy()

    # Drop non-feature columns like raw text, identifiers, urls
    if not feature_cols:
        exclude_set = {target_col}
        for col in df_clean.columns:
            # Exclude id-like columns or high cardinality text
            norm = col.lower()
            if norm in {"id", "index"} or norm.endswith(("_id", "_key")):
                exclude_set.add(col)
            elif df_clean[col].dtype == "object" and df_clean[col].nunique() > 100:
                exclude_set.add(col)
        feature_cols = [c for c in df_clean.columns if c not in exclude_set]

    if not feature_cols:
        raise ValueError("Not enough valid feature columns found for machine learning.")

    # 2. Handle Target Variable
    y_raw = df_clean[target_col].dropna()
    valid_indices = y_raw.index
    df_features = df_clean.loc[valid_indices, feature_cols].copy()
    y = y_raw.copy()

    # Determine Task: Classification vs Regression
    is_numeric_target = pd.api.types.is_numeric_dtype(y)
    unique_target_count = y.nunique()

    is_classification = (not is_numeric_target) or (unique_target_count <= 10 and len(y) > 30)

    label_encoder = None
    if is_classification:
        # Drop categories that are too rare to appear in both the train
        # and test split (a category with only 1 example can end up
        # entirely on one side, which breaks XGBoost's class validation).
        class_counts = y.astype(str).value_counts()
        rare_classes = class_counts[class_counts < 2].index
        if len(rare_classes) > 0:
            keep_mask = ~y.astype(str).isin(rare_classes)
            y = y[keep_mask]
            df_features = df_features.loc[y.index]

        if y.nunique() < 2:
            raise ValueError(
                f"'{target_col}' doesn't have enough variety (at least 2 "
                "categories with 2+ examples each) to train a model."
            )

        label_encoder = LabelEncoder()
        y = pd.Series(label_encoder.fit_transform(y.astype(str)), index=y.index)
        num_classes = len(label_encoder.classes_)
    else:
        y = pd.to_numeric(y, errors="coerce").fillna(y.median())

    # 3. Handle Feature Preprocessing
    processed_X = pd.DataFrame(index=df_features.index)
    for col in feature_cols:
        s = df_features[col]
        if pd.api.types.is_numeric_dtype(s):
            processed_X[col] = s.fillna(s.median())
        else:
            # Categorical encoding
            le = LabelEncoder()
            processed_X[col] = le.fit_transform(s.astype(str).fillna("missing"))

    # Train / Test split (stratify keeps class proportions balanced
    # across train and test when this is a classification task)
    stratify_arg = y if is_classification else None
    X_train, X_test, y_train, y_test = train_test_split(
        processed_X, y, test_size=0.2, random_state=42, stratify=stratify_arg
    )

    # 4. Train XGBoost Model
    if is_classification:
        if num_classes == 2:
            model = xgb.XGBClassifier(
                n_estimators=100,
                max_depth=4,
                learning_rate=0.08,
                random_state=42,
                eval_metric="logloss",
            )
        else:
            model = xgb.XGBClassifier(
                n_estimators=100,
                max_depth=4,
                learning_rate=0.08,
                random_state=42,
                eval_metric="mlogloss",
            )
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        acc = accuracy_score(y_test, preds)
        f1 = f1_score(y_test, preds, average="weighted")
        metrics = {
            "task": "classification",
            "accuracy": _clean_number(acc * 100),
            "f1_score": _clean_number(f1),
            "classes": [str(c) for c in label_encoder.classes_],
        }
    else:
        model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.08,
            random_state=42,
        )
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        r2 = r2_score(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        metrics = {
            "task": "regression",
            "r2_score": _clean_number(r2),
            "rmse": _clean_number(rmse),
        }

    # 5. Compute SHAP Explainability
    explainer = shap.TreeExplainer(model)
    # Use small representative sample for speed
    shap_sample = X_test.head(min(len(X_test), 150))
    shap_values = explainer.shap_values(shap_sample)

    # Calculate mean absolute SHAP values per feature
    if isinstance(shap_values, list):  # Multi-class
        mean_shap = np.mean([np.abs(sv).mean(axis=0) for sv in shap_values], axis=0)
    elif len(shap_values.shape) == 3:
        mean_shap = np.abs(shap_values).mean(axis=(0, 2))
    else:
        mean_shap = np.abs(shap_values).mean(axis=0)

    # Feature Importance ranking
    shap_importance = [
        {"feature": str(col), "importance": _clean_number(val)}
        for col, val in zip(processed_X.columns, mean_shap)
    ]
    shap_importance.sort(key=lambda x: x["importance"], reverse=True)

    # Chart data format for frontend
    top_shap = shap_importance[:10]
    chart_data = [
        {"label": item["feature"], "value": item["importance"]}
        for item in top_shap
    ]

    return {
        "target": target_col,
        "task": metrics["task"],
        "metrics": metrics,
        "features_used": feature_cols,
        "top_features": top_shap,
        "shap_chart": {
            "type": "bar",
            "title": f"SHAP Feature Importance for '{target_col}'",
            "data": chart_data,
            "x_field": "label",
            "y_field": "value",
            "x_label": "Feature Name",
            "y_label": "Mean |SHAP Value| (Impact on Prediction)",
            "orientation": "horizontal",
            "reason": "Calculated exact Shapley game-theoretic contributions to explain how features influence model predictions.",
        },
    }
