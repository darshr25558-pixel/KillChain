from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from helper.functions import fetch_package_metadata
from helper.scanner import ScanError, get_scan, list_scans, run_scan, save_scan
from models.models import Package


Fetch_router = APIRouter(tags=["packages", "scans"], prefix="/api")


@Fetch_router.post("/scan", status_code=201)
def create_scan(req: Package):
    try:
        result = run_scan(req.name, req.version)
        save_scan(result)
    except ScanError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    return {"id": result["id"]}


@Fetch_router.get("/scan/{scan_id}")
def read_scan(scan_id: str):
    result = get_scan(scan_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Scan was not found.")
    return result


@Fetch_router.get("/scans")
def read_scans():
    return list_scans()


@Fetch_router.post("/packages/fetch")
def fetch_packages(req: Package):
    metadata = fetch_package_metadata(req.name, req.version)

    if "error" in metadata:
        status_code = 404 if "not found" in metadata["error"].lower() or "no published" in metadata["error"].lower() else 400
        return JSONResponse(
            status_code=status_code,
            content={
                "error": metadata["error"],
                **(
                    {"available_versions": metadata.get("available_versions")}
                    if "available_versions" in metadata
                    else {}
                ),
            },
        )

    return {
        "status": "success",
        "package": metadata,
    }
