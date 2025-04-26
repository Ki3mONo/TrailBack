from fastapi import APIRouter, Response, status

router = APIRouter(tags=["Meta"])

@router.get("/", include_in_schema=False)
async def root() -> dict:
    return {"status": "TrailBack API is running", "version": "2.0.0"}

@router.get("/health", tags=["Health"], include_in_schema=False)
async def health() -> dict:
    return {"status": "ok"}

@router.get("/favicon.ico", include_in_schema=False, status_code=status.HTTP_204_NO_CONTENT)
async def favicon() -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)
