from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routes import router
from backend.app.api.rate_limiter import rate_limit_middleware
from backend.app.core.db import init_db

# Initialize database on startup
init_db(seed_from_csv=True)

app = FastAPI(
    title="SMART RAIL AI - Dynamic ETA & Decision Support",
    description="Enterprise Railway Intelligence Platform: Hybrid SRT + Deterministic Rules + ML Residual + Conformal Uncertainty & Delay Propagation Engine.",
    version="3.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Rate Limiting Middleware
app.middleware("http")(rate_limit_middleware)

# Register API Router
app.include_router(router)

@app.get("/")
def root():
    return {
        "project": "SMART RAIL AI",
        "edition": "Enterprise Corridor Edition",
        "status": "ONLINE",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
