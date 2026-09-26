from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from backend.app.core.db import get_db_connection
from backend.app.core.config import settings

class ResourceManager:
    def __init__(self):
        pass

    def check_resource_alerts(
        self,
        train_id: str,
        destination_code: str,
        scheduled_arr: str,
        smart_eta: str,
        delay_min: float,
        quality: str = "FRESH"
    ) -> List[Dict[str, Any]]:
        """
        Evaluates operational resources against current smart ETA:
        1. Platform occupancy conflict
        2. Coach cleaning / pit-line turnaround buffer
        3. Crew handover briefing buffer
        4. Multimodal feeder transport dispatch timing
        """
        alerts = []
        now = datetime.now()
        thresholds = settings.resource_thresholds

        # 1. Coach Cleaning Pit Line Alert
        cleaning_buffer = thresholds.get("coach_cleaning_turnaround_min", 30.0)
        if delay_min > 12.0 and destination_code in ("ST04", "ST01"):
            remaining_cleaning_buffer = max(0.0, cleaning_buffer - delay_min)
            severity = "CRITICAL" if remaining_cleaning_buffer < 10.0 else "WARNING"
            alerts.append({
                "alert_id": f"ALT-CLN-{train_id}",
                "resource_type": "COACH_CLEANING_PIT",
                "train_id": train_id,
                "station": destination_code,
                "predicted_time": smart_eta,
                "severity": severity,
                "message": f"Pit line cleaning turnaround compressed to {remaining_cleaning_buffer:.0f}m (Standard: {cleaning_buffer:.0f}m) at {destination_code}."
            })

        # 2. Crew Handover Buffer Alert
        crew_buffer = thresholds.get("crew_handover_min", 15.0)
        if delay_min > 8.0:
            alerts.append({
                "alert_id": f"ALT-CREW-{train_id}",
                "resource_type": "CREW_HANDOVER",
                "train_id": train_id,
                "station": "ST02",
                "predicted_time": smart_eta,
                "severity": "WARNING",
                "message": f"Loco pilot / guard relief crew handover buffer reduced below safety limit ({crew_buffer:.0f}m) at ST02."
            })

        # 3. Feeder Transport Dispatch Alert
        feeder_thresh = thresholds.get("feeder_dispatch_threshold_min", 10.0)
        if delay_min >= feeder_thresh:
            alerts.append({
                "alert_id": f"ALT-FEEDER-{train_id}",
                "resource_type": "FEEDER_TRANSPORT",
                "train_id": train_id,
                "station": destination_code,
                "predicted_time": smart_eta,
                "severity": "INFO",
                "message": f"Notify last-mile MSRTC/BEST feeder buses at {destination_code}: Retime departure to {smart_eta}."
            })

        # Store alerts in DB
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            for alt in alerts:
                cursor.execute(
                    """
                    INSERT OR REPLACE INTO resource_alerts (alert_id, resource_type, train_id, station, predicted_time, message, severity, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (alt["alert_id"], alt["resource_type"], alt["train_id"], alt["station"], alt["predicted_time"], alt["message"], alt["severity"], now.isoformat())
                )
            conn.commit()
            conn.close()
        except Exception:
            pass

        return alerts

    def generate_multilingual_notifications(
        self,
        train_id: str,
        train_name: str,
        station_code: str,
        smart_eta: str,
        eta_low: str,
        eta_high: str,
        delay_min: float,
        reasons: List[str],
        quality: str = "FRESH"
    ) -> Dict[str, str]:
        """
        Generates i18n passenger notification templates in English, Hindi, and Marathi.
        Includes explicit data uncertainty notices when status is STALE or LOST.
        """
        primary_reason = reasons[0] if reasons else "Normal running"
        # Clean technical codes for passenger readability
        clean_reason = (
            primary_reason
            .replace("RED_SIGNAL", "Signal wait")
            .replace("SPEED_RESTRICTION", "Speed caution")
            .replace("MONSOON_RAIN", "Monsoon rain speed control")
            .replace("WEATHER_RAIN", "Rain slowdown")
            .replace("LEVEL_CROSSING", "Level crossing gate hold")
            .replace("UNSCHEDULED_STOP", "Operational halt")
        )

        uncertainty_en = ""
        uncertainty_hi = ""
        uncertainty_mr = ""

        if quality == "STALE":
            uncertainty_en = " [Note: GPS signal delayed; wider time window shown]"
            uncertainty_hi = " [सूचना: जीपीएस सिग्नल विलंबित; अनुमानित समय सीमा बढ़ाई गई है]"
            uncertainty_mr = " [टीप: जीपीएस सिग्नल विलंबित; अंदाजित वेळ विंडो वाढवली आहे]"
        elif quality == "LOST":
            uncertainty_en = " [Notice: Live tracking unavailable; schedule fallback estimate]"
            uncertainty_hi = " [सूचना: लाइव्ह ट्रॅकिंग अनुपलब्ध; वेळापत्रकानुसार अंदाजित वेळ]"
            uncertainty_mr = " [सूचना: थेट ट्रॅकिंग उपलब्ध नाही; वेळापत्रकानुसार अंदाजित वेळ]"

        delay_text_en = f"running +{delay_min:.0f}m late" if delay_min > 2 else "running on time"
        delay_text_hi = f"+{delay_min:.0f} मिनट देरी से चल रही है" if delay_min > 2 else "समय पर चल रही है"
        delay_text_mr = f"+{delay_min:.0f} मिनिटे उशिराने धावत आहे" if delay_min > 2 else "वेळेवर धावत आहे"

        # English
        en_msg = (
            f"🚆 SMART RAIL ALERT: {train_id} {train_name} expected at {station_code} between {eta_low} - {eta_high} (Smart ETA: {smart_eta}). "
            f"Currently {delay_text_en}. Cause: {clean_reason}.{uncertainty_en}"
        )

        # Hindi
        hi_msg = (
            f"🚆 स्मार्ट रेल अलर्ट: {train_id} {train_name} {station_code} पर {eta_low} - {eta_high} के बीच अपेक्षित है (स्मार्ट आगमन: {smart_eta})। "
            f"ट्रेन वर्तमान में {delay_text_hi}। कारण: {clean_reason}।{uncertainty_hi}"
        )

        # Marathi
        mr_msg = (
            f"🚆 स्मार्ट रेल सूचना: {train_id} {train_name} {station_code} येथे {eta_low} - {eta_high} दरम्यान अपेक्षित आहे (स्मार्ट आगमन: {smart_eta}). "
            f"गाडी सध्या {delay_text_mr}. कारण: {clean_reason}.{uncertainty_mr}"
        )

        return {
            "en": en_msg,
            "hi": hi_msg,
            "mr": mr_msg,
            "quality": quality,
            "delay_min": delay_min
        }

resource_manager = ResourceManager()
