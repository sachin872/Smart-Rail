import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from backend.app.ml.residual_model import ml_predictor

def main():
    print("Executing residual regressor model training pipeline...")
    ml_predictor._train_default_baseline()
    print(f"Model trained and serialized successfully!")
    print(f"  Version: {ml_predictor.version}")
    print(f"  Metrics: {ml_predictor.model.trained_metrics}")

if __name__ == "__main__":
    main()
