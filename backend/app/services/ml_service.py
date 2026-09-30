from __future__ import annotations

import math
from typing import Any
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, accuracy_score, f1_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.linear_model import LinearRegression, Ridge, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.neighbors import KNeighborsRegressor, KNeighborsClassifier
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
    preferred_model: str | None = None,
) -> dict[str, Any]:
    """
    Multi-Model AutoML Engine:
    Trains and compares multiple competitive models (Linear, Ridge, Random Forest, KNN, XGBoost),
    evaluates them on a holdout test split, builds a performance leaderboard, selects the champion,
    and calculates feature explainability with interactive charts.
    """
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in dataset.")

    df_clean = df.copy()

    # 1. Feature Selection (Drop ID-like or high-cardinality text)
    if not feature_cols:
        exclude_set = {target_col}
        for col in df_clean.columns:
            norm = col.lower()
            if norm in {"id", "index"} or norm.endswith(("_id", "_key")):
                exclude_set.add(col)
            elif df_clean[col].dtype == "object" and df_clean[col].nunique() > 100:
                exclude_set.add(col)
        feature_cols = [c for c in df_clean.columns if c not in exclude_set]

    if not feature_cols:
        raise ValueError("Not enough valid feature columns found for machine learning.")

    # 2. Target Variable Preparation & Task Detection
    y_raw = df_clean[target_col].dropna()
    valid_indices = y_raw.index
    df_features = df_clean.loc[valid_indices, feature_cols].copy()
    y = y_raw.copy()

    is_numeric_target = pd.api.types.is_numeric_dtype(y)
    unique_target_count = y.nunique()
    is_binary = set(y.dropna().unique()).issubset({0, 1, 0.0, 1.0, "0", "1", True, False, "yes", "no", "true", "false"})
    is_classification = (not is_numeric_target) or is_binary or (unique_target_count <= 8 and len(y) >= 15)

    label_encoder = None
    if is_classification:
        class_counts = y.astype(str).value_counts()
        rare_classes = class_counts[class_counts < 2].index
        if len(rare_classes) > 0:
            keep_mask = ~y.astype(str).isin(rare_classes)
            y = y[keep_mask]
            df_features = df_features.loc[y.index]

        if y.nunique() < 2:
            raise ValueError(
                f"'{target_col}' doesn't have enough variety (at least 2 categories with 2+ examples each) to train a model."
            )

        label_encoder = LabelEncoder()
        y = pd.Series(label_encoder.fit_transform(y.astype(str)), index=y.index)
        num_classes = len(label_encoder.classes_)
    else:
        y = pd.to_numeric(y, errors="coerce").fillna(y.median())

    # 3. Feature Preprocessing
    processed_X = pd.DataFrame(index=df_features.index)
    for col in feature_cols:
        s = df_features[col]
        if pd.api.types.is_numeric_dtype(s):
            processed_X[col] = s.fillna(s.median())
        else:
            le = LabelEncoder()
            processed_X[col] = le.fit_transform(s.astype(str).fillna("missing"))

    stratify_arg = y if is_classification else None
    X_train, X_test, y_train, y_test = train_test_split(
        processed_X, y, test_size=0.2, random_state=42, stratify=stratify_arg
    )

    # Scaled features for linear/distance models (Linear Regression, Ridge, Logistic, KNN)
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=processed_X.columns, index=X_train.index)
    X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=processed_X.columns, index=X_test.index)

    models_suite: list[dict[str, Any]] = []

    # 4. Train Multi-Model Suite
    if not is_classification:
        # --- REGRESSION SUITE ---
        # 1. Linear Regression (OLS)
        try:
            lr = LinearRegression()
            lr.fit(X_train_scaled, y_train)
            preds_lr = lr.predict(X_test_scaled)
            models_suite.append({
                "id": "linear",
                "name": "Linear Regression (OLS)",
                "model": lr,
                "needs_scaled": True,
                "r2_score": _clean_number(r2_score(y_test, preds_lr)),
                "rmse": _clean_number(np.sqrt(mean_squared_error(y_test, preds_lr))),
                "mae": _clean_number(mean_absolute_error(y_test, preds_lr)),
                "primary_metric": _clean_number(r2_score(y_test, preds_lr)),
            })
        except Exception:
            pass

        # 2. Ridge Regression (L2 Regularized)
        try:
            ridge = Ridge(alpha=1.0)
            ridge.fit(X_train_scaled, y_train)
            preds_ridge = ridge.predict(X_test_scaled)
            models_suite.append({
                "id": "ridge",
                "name": "Ridge Regression (L2)",
                "model": ridge,
                "needs_scaled": True,
                "r2_score": _clean_number(r2_score(y_test, preds_ridge)),
                "rmse": _clean_number(np.sqrt(mean_squared_error(y_test, preds_ridge))),
                "mae": _clean_number(mean_absolute_error(y_test, preds_ridge)),
                "primary_metric": _clean_number(r2_score(y_test, preds_ridge)),
            })
        except Exception:
            pass

        # 3. Random Forest Regressor
        try:
            rf = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
            rf.fit(X_train, y_train)
            preds_rf = rf.predict(X_test)
            models_suite.append({
                "id": "random_forest",
                "name": "Random Forest Regressor",
                "model": rf,
                "needs_scaled": False,
                "r2_score": _clean_number(r2_score(y_test, preds_rf)),
                "rmse": _clean_number(np.sqrt(mean_squared_error(y_test, preds_rf))),
                "mae": _clean_number(mean_absolute_error(y_test, preds_rf)),
                "primary_metric": _clean_number(r2_score(y_test, preds_rf)),
            })
        except Exception:
            pass

        # 4. XGBoost Regressor
        try:
            model_xgb = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=4,
                learning_rate=0.08,
                random_state=42,
            )
            model_xgb.fit(X_train, y_train)
            preds_xgb = model_xgb.predict(X_test)
            models_suite.append({
                "id": "xgboost",
                "name": "XGBoost Regressor",
                "model": model_xgb,
                "needs_scaled": False,
                "r2_score": _clean_number(r2_score(y_test, preds_xgb)),
                "rmse": _clean_number(np.sqrt(mean_squared_error(y_test, preds_xgb))),
                "mae": _clean_number(mean_absolute_error(y_test, preds_xgb)),
                "primary_metric": _clean_number(r2_score(y_test, preds_xgb)),
            })
        except Exception:
            pass

        # Sort Leaderboard by R2 descending
        models_suite.sort(key=lambda m: m["primary_metric"], reverse=True)

    else:
        # --- CLASSIFICATION SUITE ---
        # 1. Logistic Regression
        try:
            logreg = LogisticRegression(max_iter=500, random_state=42)
            logreg.fit(X_train_scaled, y_train)
            preds_log = logreg.predict(X_test_scaled)
            models_suite.append({
                "id": "logistic",
                "name": "Logistic Regression",
                "model": logreg,
                "needs_scaled": True,
                "accuracy": _clean_number(accuracy_score(y_test, preds_log) * 100),
                "f1_score": _clean_number(f1_score(y_test, preds_log, average="weighted")),
                "primary_metric": _clean_number(accuracy_score(y_test, preds_log) * 100),
            })
        except Exception:
            pass

        # 2. Random Forest Classifier
        try:
            rf_cls = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
            rf_cls.fit(X_train, y_train)
            preds_rf = rf_cls.predict(X_test)
            models_suite.append({
                "id": "random_forest",
                "name": "Random Forest Classifier",
                "model": rf_cls,
                "needs_scaled": False,
                "accuracy": _clean_number(accuracy_score(y_test, preds_rf) * 100),
                "f1_score": _clean_number(f1_score(y_test, preds_rf, average="weighted")),
                "primary_metric": _clean_number(accuracy_score(y_test, preds_rf) * 100),
            })
        except Exception:
            pass

        # 3. K-Nearest Neighbors (KNN)
        try:
            k = min(5, max(1, len(X_train) - 1))
            knn = KNeighborsClassifier(n_neighbors=k)
            knn.fit(X_train_scaled, y_train)
            preds_knn = knn.predict(X_test_scaled)
            models_suite.append({
                "id": "knn",
                "name": f"K-Nearest Neighbors (k={k})",
                "model": knn,
                "needs_scaled": True,
                "accuracy": _clean_number(accuracy_score(y_test, preds_knn) * 100),
                "f1_score": _clean_number(f1_score(y_test, preds_knn, average="weighted")),
                "primary_metric": _clean_number(accuracy_score(y_test, preds_knn) * 100),
            })
        except Exception:
            pass

        # 4. XGBoost Classifier
        try:
            xgb_cls = xgb.XGBClassifier(
                n_estimators=100,
                max_depth=4,
                learning_rate=0.08,
                random_state=42,
                eval_metric="logloss" if num_classes == 2 else "mlogloss",
            )
            xgb_cls.fit(X_train, y_train)
            preds_xgb = xgb_cls.predict(X_test)
            models_suite.append({
                "id": "xgboost",
                "name": "XGBoost Classifier",
                "model": xgb_cls,
                "needs_scaled": False,
                "accuracy": _clean_number(accuracy_score(y_test, preds_xgb) * 100),
                "f1_score": _clean_number(f1_score(y_test, preds_xgb, average="weighted")),
                "primary_metric": _clean_number(accuracy_score(y_test, preds_xgb) * 100),
            })
        except Exception:
            pass

        # Sort Leaderboard by Accuracy descending, then F1
        models_suite.sort(key=lambda m: (m["accuracy"], m["f1_score"]), reverse=True)

    if not models_suite:
        raise ValueError("Could not train any machine learning models on this dataset.")

    # 5. Determine Champion Model
    champion_entry = models_suite[0]
    if preferred_model:
        norm_pref = preferred_model.lower().strip()
        matched = next((m for m in models_suite if norm_pref in m["id"] or norm_pref in m["name"].lower()), None)
        if matched:
            champion_entry = matched

    # 6. Format Leaderboard
    leaderboard = []
    for idx, m in enumerate(models_suite):
        is_champ = (m["id"] == champion_entry["id"])
        badge = f"#{idx + 1}"
        entry = {
            "rank": idx + 1,
            "badge_rank": badge,
            "id": m["id"],
            "name": m["name"],
            "is_champion": is_champ,
        }
        if not is_classification:
            entry["r2_score"] = m["r2_score"]
            entry["rmse"] = m["rmse"]
            entry["mae"] = m["mae"]
        else:
            entry["accuracy"] = m["accuracy"]
            entry["f1_score"] = m["f1_score"]
        leaderboard.append(entry)

    # 7. Compute Feature Explainability for the Champion Model
    champion_model = champion_entry["model"]
    top_features = []

    # Tree-based model (SHAP TreeExplainer)
    if hasattr(champion_model, "feature_importances_"):
        try:
            explainer = shap.TreeExplainer(champion_model)
            shap_sample = X_test.head(min(len(X_test), 150))
            shap_values = explainer.shap_values(shap_sample)

            if isinstance(shap_values, list):  # Multi-class
                mean_shap = np.mean([np.abs(sv).mean(axis=0) for sv in shap_values], axis=0)
            elif len(getattr(shap_values, "shape", ())) == 3:
                mean_shap = np.abs(shap_values).mean(axis=(0, 2))
            else:
                mean_shap = np.abs(shap_values).mean(axis=0)

            top_features = [
                {"feature": str(col), "importance": _clean_number(val)}
                for col, val in zip(processed_X.columns, mean_shap)
            ]
        except Exception:
            # Fallback to feature_importances_ if SHAP sample fails
            top_features = [
                {"feature": str(col), "importance": _clean_number(val)}
                for col, val in zip(processed_X.columns, champion_model.feature_importances_)
            ]
    # Linear model (Normalized absolute coefficients)
    elif hasattr(champion_model, "coef_"):
        raw_coef = champion_model.coef_
        if len(raw_coef.shape) > 1:
            coef_mag = np.mean(np.abs(raw_coef), axis=0)
        else:
            coef_mag = np.abs(raw_coef)
        total_mag = float(np.sum(coef_mag)) or 1.0
        normalized_imp = coef_mag / total_mag
        top_features = [
            {"feature": str(col), "importance": _clean_number(val)}
            for col, val in zip(processed_X.columns, normalized_imp)
        ]
    else:
        # Distance / Instance based model (e.g. KNN)
        # Use correlation with target as proxy importance
        corr_series = processed_X.corrwith(y).abs().fillna(0)
        top_features = [
            {"feature": str(col), "importance": _clean_number(val)}
            for col, val in corr_series.items()
        ]

    top_features.sort(key=lambda x: x["importance"], reverse=True)
    top_chart_features = top_features[:10]

    chart_data = [
        {"label": item["feature"], "value": item["importance"]}
        for item in top_chart_features
    ]

    task_name = "Classification" if is_classification else "Regression"
    chart_metric_label = "Mean |SHAP Value|" if hasattr(champion_model, "feature_importances_") else "Relative Feature Weight"

    shap_chart = {
        "type": "bar",
        "title": f"Feature Importance for '{target_col}' ({champion_entry['name']})",
        "data": chart_data,
        "x_field": "label",
        "y_field": "value",
        "x_label": "Feature Name",
        "y_label": chart_metric_label,
        "orientation": "horizontal",
        "reason": f"Calculated game-theoretic and predictive contributions using {champion_entry['name']}.",
    }

    return {
        "target": target_col,
        "task": "classification" if is_classification else "regression",
        "leaderboard": leaderboard,
        "champion": {
            "id": champion_entry["id"],
            "name": champion_entry["name"],
            "is_user_selected": bool(preferred_model and champion_entry["id"] != models_suite[0]["id"]),
            "metrics": {
                k: v for k, v in champion_entry.items()
                if k in {"r2_score", "rmse", "mae", "accuracy", "f1_score"}
            },
        },
        "features_used": feature_cols,
        "top_features": top_chart_features,
        "shap_chart": shap_chart,
    }
