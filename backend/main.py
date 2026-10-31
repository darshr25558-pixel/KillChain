from fastapi import FastAPI
from routes.routes import Fetch_router

app = FastAPI()
app.include_router(Fetch_router)


@app.get("/health")
def get_health():
    return {"status": "ok"}
