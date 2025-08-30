# backend/routes/vitals.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from database import reports_collection, ReportCategory
from auth import get_current_user
import logging
import re
import os
import numpy as np
from scipy import stats
import math
from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/vitals", tags=["vitals"])

def normalize_test_name(test_name: str) -> str:
    if not test_name or not isinstance(test_name, str):
        return ""
    normalized = test_name.strip().lower()
    normalized = re.sub(r'^serum\s+|^plasma\s+', '', normalized)
    normalized = re.sub(r'\s+level$|\s+levels$|\s+test$', '', normalized)
    replacements = {
        r'wbc\s+count': 'wbc',
        r'white\s+blood\s+cell': 'wbc',
        r'absolute\s+lymphocyte': 'aly',
        r'absolute\s+neutrophil': 'ane',
        r'absolute\s+monocyte': 'amo',
        r'absolute\s+eosinophil': 'aeo',
        r'absolute\s+basophil': 'abo',
        r'rbc\s+count': 'rbc',
        r'red\s+blood\s+cell': 'rbc',
        r'hemoglobin': 'hb',
        r'haemoglobin': 'hb',
        r'hematocrit': 'hct',
        r'packed\s+cell\s+volume': 'hct',
        r'mcv': 'mcv',
        r'mch': 'mch',
        r'mchc': 'mchc',
        r'rdw': 'rdw',
        r'platelet\s+count': 'plt',
        r'platelets': 'plt'
    }
    for pattern, replacement in replacements.items():
        if re.search(pattern, normalized):
            normalized = re.sub(pattern, replacement, normalized)
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    return normalized

def extract_date_from_report(report: dict) -> str:
    metadata = report.get("extracted_data", {}).get("metadata", {})
    date_str = metadata.get("report_date")
    if date_str:
        formats_to_try = [
            "%Y/%m/%d %H:%M", "%Y-%m-%d %H:%M", "%d/%m/%Y %H:%M", "%d-%m-%Y %H:%M",
            "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%Y-%m-%d",
            "%d %b %Y %H:%M", "%d %B %Y %H:%M", "%d %b %Y", "%d %B %Y"
        ]
        for fmt in formats_to_try:
            try:
                parsed_date = datetime.strptime(date_str, fmt)
                return parsed_date.strftime("%d/%m/%Y")
            except ValueError:
                continue
    return "Not Available"

def get_sortable_date(report: dict) -> datetime:
    metadata = report.get("extracted_data", {}).get("metadata", {})
    date_str = metadata.get("report_date")
    if date_str:
        formats_to_try = [
            "%Y/%m/%d %H:%M", "%Y-%m-%d %H:%M", "%d/%m/%Y %H:%M", "%d-%m-%Y %H:%M",
            "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%Y-%m-%d",
            "%d %b %Y %H:%M", "%d %B %Y %H:%M", "%d %b %Y", "%d %B %Y"
        ]
        for fmt in formats_to_try:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
    return datetime.min

def parse_report_date_for_analysis(date_str: str) -> Optional[datetime]:
    if not date_str:
        return None
    formats_to_try = [
        "%Y/%m/%d %H:%M", "%Y-%m-%d %H:%M", "%d/%m/%Y %H:%M", "%d-%m-%Y %H:%M",
        "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%Y-%m-%d",
        "%d %b %Y %H:%M", "%d %B %Y %H:%M", "%d %b %Y", "%d %B %Y"
    ]
    for fmt in formats_to_try:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None

def calculate_trend_slope(values: List[float], dates: List[datetime]) -> Optional[float]:
    if len(values) < 2 or len(dates) < 2 or len(values) != len(dates):
        return None
    date_ordinals = np.array([d.toordinal() for d in dates]).reshape(-1, 1)
    values_array = np.array(values)
    if np.var(date_ordinals.flatten()) == 0 or np.var(values_array) == 0:
        return 0.0
    try:
        slope, _, _, _, _ = stats.linregress(date_ordinals.flatten(), values_array)
        if np.isnan(slope) or np.isinf(slope):
            logger.warning(f"calculate_trend_slope produced invalid slope: {slope} for values {values} and dates {dates}")
            return 0.0
        return float(slope)
    except Exception as e:
        logger.error(f"Error calculating trend slope: {e}")
        return 0.0

def find_correlations(test_data: Dict[str, List[Dict[str, Union[float, datetime, str]]]]) -> List[Dict[str, Any]]:
    correlations = []
    test_names = list(test_data.keys())
    for i in range(len(test_names)):
        for j in range(i + 1, len(test_names)):
            test1_name = test_names[i]
            test2_name = test_names[j]
            paired_data = []
            test1_points = test_data[test1_name]
            test2_points = test_data[test2_name]
            test1_dict = {point.get('date_str'): point for point in test1_points if point.get('date_str')}
            test2_dict = {point.get('date_str'): point for point in test2_points if point.get('date_str')}
            common_dates = set(test1_dict.keys()).intersection(set(test2_dict.keys()))
            for date_key in common_dates:
                val1 = test1_dict[date_key].get('value')
                val2 = test2_dict[date_key].get('value')
                if val1 is not None and val2 is not None:
                    paired_data.append((val1, val2))
            if len(paired_data) >= 2:
                try:
                    x_vals = [p[0] for p in paired_data]
                    y_vals = [p[1] for p in paired_data]
                    if np.var(x_vals) == 0 or np.var(y_vals) == 0:
                        correlation_coefficient = 0.0
                        p_value = 1.0
                    else:
                        correlation_coefficient, p_value = stats.pearsonr(x_vals, y_vals)
                    if np.isnan(correlation_coefficient) or np.isinf(correlation_coefficient):
                        logger.warning(f"find_correlations produced invalid r for {test1_name} vs {test2_name}")
                        correlation_coefficient = 0.0
                    if np.isnan(p_value) or np.isinf(p_value):
                        logger.warning(f"find_correlations produced invalid p for {test1_name} vs {test2_name}")
                        p_value = 1.0
                    corr_val = abs(float(correlation_coefficient))
                    if corr_val > 0.7:
                        strength = "Strong"
                    elif corr_val > 0.4:
                        strength = "Moderate"
                    elif corr_val > 0.2:
                        strength = "Weak"
                    else:
                        strength = "Very Weak / None"
                    direction = "Positive" if float(correlation_coefficient) > 0 else "Negative"
                    correlations.append({
                        "test1": test1_name,
                        "test2": test2_name,
                        "correlation_coefficient": round(float(correlation_coefficient), 3),
                        "p_value": round(float(p_value), 4),
                        "strength": strength,
                        "direction": direction,
                        "data_points": len(paired_data)
                    })
                except Exception as e:
                    logger.warning(f"Error calculating correlation for {test1_name} vs {test2_name}: {e}")
    return correlations

@router.get("/history")
async def get_vitals_history(
    category: Optional[ReportCategory] = Query(default=None),
    current_user: dict = Depends(get_current_user)
):
    try:
        user_email = current_user["email"]
        query_filter = {"user_id": user_email}
        if category is not None:
            query_filter["category"] = category.value
        projection = {"_id": 0, "filename": 1, "extracted_data": 1, "category": 1}
        cursor = reports_collection.find(query_filter, projection)
        history = list(cursor)
        if not history:
            logger.info(f"No vitals history found for user {user_email}" + (f" in category {category.value}" if category else ""))
            return {"message": "No vitals history found.", "history": []}
        history.sort(key=get_sortable_date, reverse=True)
        logger.info(f"Fetched {len(history)} reports for user {user_email}" + (f" in category {category.value}" if category else ""))
        return {"history": history}
    except Exception as e:
        logger.error(f"Error fetching vitals history for {current_user.get('email', 'Unknown')}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve vitals history.")

@router.get("/latest")
async def get_latest_report(current_user: dict = Depends(get_current_user)):
    try:
        user_email = current_user["email"]
        cursor = reports_collection.find(
            {"user_id": user_email},
            {"_id": 0, "filename": 1, "extracted_data": 1, "category": 1}
        )
        reports = list(cursor)
        if not reports:
            return {"message": "No reports found.", "report": None}
        latest_report = max(reports, key=get_sortable_date, default=None)
        return {"report": latest_report}
    except Exception as e:
        logger.error(f"Error fetching latest report for {user_email}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve latest report.")

@router.get("/compare")
async def compare_vitals_reports_with_ai(
    report_ids: List[str] = Query(None, description="One or more report filenames. Can be repeated."),
    current_user: dict = Depends(get_current_user)
):
    user_email = current_user["email"]
    if not report_ids:
        cursor = reports_collection.find(
            {"user_id": user_email},
            {"_id": 0, "filename": 1, "extracted_data": 1}
        )
        reports_data = list(cursor)
    else:
        filenames = [fn.strip() for fn in report_ids if fn and fn.strip()]
        if not filenames:
            raise HTTPException(status_code=400, detail="At least one report filename is required.")
        reports_data = []
        for fn in filenames:
            rpt = reports_collection.find_one(
                {"user_id": user_email, "filename": fn},
                {"_id": 0, "filename": 1, "extracted_data": 1}
            )
            if not rpt:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report '{fn}' not found.")
            reports_data.append(rpt)
    if not reports_data:
        return {"comparison_data": [], "reports": []}
    for rpt in reports_data:
        rpt["comparison_date"] = extract_date_from_report(rpt)
    try:
        reports_data.sort(key=lambda x: datetime.strptime(x["comparison_date"], "%d/%m/%Y") 
                         if x["comparison_date"] != "Not Available" 
                         else datetime.min)
    except ValueError:
        pass
    comparison_map: dict[str, dict] = {}
    for rpt in reports_data:
        for section in rpt.get("extracted_data", {}).get("results", []):
            for test in section.get("tests", []):
                raw_name = test.get("test_name") or ""
                norm = normalize_test_name(raw_name)
                if not norm:
                    continue
                if norm not in comparison_map:
                    comparison_map[norm] = {
                        "test_name": raw_name.strip(),
                        "readings": []
                    }
    for norm, entry in comparison_map.items():
        for rpt in reports_data:
            found = None
            for section in rpt.get("extracted_data", {}).get("results", []):
                for test in section.get("tests", []):
                    if normalize_test_name(test.get("test_name") or "") == norm:
                        found = {
                            "value": test.get("result") or "",
                            "unit": test.get("unit") or "",
                            "reference_range": test.get("reference_range") or "",
                            "remarks": test.get("remarks") or "",
                            "date": rpt["comparison_date"],
                            "filename": rpt["filename"],
                        }
                        break
                if found:
                    break
            entry["readings"].append(found)
    comparison_data = list(comparison_map.values())
    return {
        "comparison_data": comparison_data,
        "reports": [
            {"filename": rpt["filename"], "date": rpt["comparison_date"]}
            for rpt in reports_data
        ]
    }

@router.get("/analyze")
async def analyze_vitals_history(
    current_user: dict = Depends(get_current_user)
):
    try:
        user_email = current_user["email"]
        query_filter = {"user_id": user_email}
        projection = {
            "_id": 0, 
            "filename": 1, 
            "extracted_data.metadata.report_date": 1, 
            "extracted_data.results": 1
        }
        cursor = reports_collection.find(query_filter, projection)
        reports = list(cursor)
        if not reports:
            return {
                "message": "No reports found for analysis.",
                "analysis": {
                    "trends": [],
                    "alerts": [],
                    "correlations": []
                }
            }
        test_data_points: Dict[str, List[Dict[str, Union[float, datetime, str]]]] = {}
        for report in reports:
            filename = report.get("filename")
            metadata = report.get("extracted_data", {}).get("metadata", {})
            report_date_str = metadata.get("report_date")
            report_date_obj = parse_report_date_for_analysis(report_date_str)
            if not report_date_obj:
                logger.warning(f"Skipping report {filename} due to unparseable date: {report_date_str}")
                continue
            results = report.get("extracted_data", {}).get("results", [])
            for section in results:
                for test in section.get("tests", []):
                    test_name_raw = test.get("test_name")
                    test_result_str = test.get("result")
                    if not test_name_raw or not test_result_str:
                        continue
                    test_name = normalize_test_name(test_name_raw)
                    if not test_name:
                        continue
                    try:
                        test_value = float(test_result_str)
                    except ValueError:
                        continue
                    if test_name not in test_data_points:
                        test_data_points[test_name] = []
                    test_data_points[test_name].append({
                        "value": test_value,
                        "date_obj": report_date_obj,
                        "date_str": report_date_str,
                        "filename": filename
                    })
        trends = []
        alerts = []
        MIN_DATA_POINTS_FOR_TREND = 3
        TREND_LOOKBACK_COUNT = 3
        for test_name, data_points in test_data_points.items():
            if len(data_points) < MIN_DATA_POINTS_FOR_TREND:
                continue
            sorted_points = sorted(data_points, key=lambda x: x['date_obj'])
            all_values = [p['value'] for p in sorted_points]
            all_dates = [p['date_obj'] for p in sorted_points]
            overall_slope = calculate_trend_slope(all_values, all_dates)
            if overall_slope is not None:
                EPSILON = 1e-10
                if overall_slope > EPSILON:
                    trend_direction = "Increasing"
                elif overall_slope < -EPSILON:
                    trend_direction = "Decreasing"
                else:
                    trend_direction = "Stable"
                trends.append({
                    "test_name": test_name,
                    "trend": trend_direction,
                    "slope": round(float(overall_slope), 5),
                    "data_points_count": len(sorted_points)
                })
                if len(sorted_points) >= TREND_LOOKBACK_COUNT:
                    recent_points = sorted_points[-TREND_LOOKBACK_COUNT:]
                    recent_values = [p['value'] for p in recent_points]
                    recent_dates = [p['date_obj'] for p in recent_points]
                    recent_slope = calculate_trend_slope(recent_values, recent_dates)
                    alert_message = None
                    if recent_slope is not None:
                        SLOPE_UPWARD_ALERT_THRESHOLD = 0.1
                        SLOPE_DOWNWARD_ALERT_THRESHOLD = -0.1
                        if recent_slope > SLOPE_UPWARD_ALERT_THRESHOLD + EPSILON:
                            alert_message = f"Your {test_name} level has shown a consistent upward trend over the last {TREND_LOOKBACK_COUNT} reports. Consider discussing this with your doctor."
                        elif recent_slope < SLOPE_DOWNWARD_ALERT_THRESHOLD - EPSILON:
                            alert_message = f"Your {test_name} level has shown a consistent downward trend over the last {TREND_LOOKBACK_COUNT} reports. Consider discussing this with your doctor."
                    if alert_message:
                        latest_date_str = sorted_points[-1]['date_str']
                        alerts.append({
                            "test_name": test_name,
                            "message": alert_message,
                            "latest_report_date": latest_date_str
                        })
        correlations = find_correlations(test_data_points)
        def ensure_serializable(obj):
            if isinstance(obj, dict):
                return {k: ensure_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [ensure_serializable(item) for item in obj]
            elif isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                if np.isnan(obj) or np.isinf(obj):
                    logger.warning(f"Replacing non-serializable NumPy float {obj} with None")
                    return None
                return float(obj)
            elif isinstance(obj, float):
                if math.isnan(obj) or math.isinf(obj):
                    logger.warning(f"Replacing non-serializable Python float {obj} with None")
                    return None
                return obj
            return obj
        return {
            "message": "Analysis complete.",
            "analysis": {
                "trends": ensure_serializable(trends),
                "alerts": ensure_serializable(alerts),
                "correlations": ensure_serializable(correlations)
            }
        }
    except Exception as e:
        logger.error(f"Error during vitals analysis for user {current_user.get('email', 'Unknown')}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to analyze vitals history due to an internal error.")

@router.delete("/{filename}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vitals_report(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        user_email = current_user["email"]
        deleted_report = reports_collection.find_one_and_delete(
            {"user_id": user_email, "filename": filename}
        )
        if not deleted_report:
            logger.warning(f"User {user_email} tried to delete non-existent report '{filename}'")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with filename '{filename}' not found."
            )
        upload_dir = os.getenv("UPLOAD_DIR", "uploads")
        file_path = os.path.join(upload_dir, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Successfully deleted file: {file_path}")
            except OSError as e:
                logger.error(f"Error deleting file {file_path}: {e}")
        else:
            logger.info(f"File not found on disk (or not stored locally), skipping file deletion for: {file_path}")
        logger.info(f"User '{user_email}' successfully deleted report '{filename}'")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting report '{filename}' for user '{user_email}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the report."
        )
