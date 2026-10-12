from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.routers import auth, users, tickets, ws

app = FastAPI(title="Helpdesk Mini", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(StarletteHTTPException)
async def http_error(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={'error': {'status': exc.status_code, 'message':exc.detail}},
        headers=getattr(exc, 'headers', None),
    )
    
@app.exception_handler(RequestValidationError)
async def validation_exception(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={'error': {'status': 422, 'message': "Invalid Input", 'details': jsonable_encoder(exc.errors())}},
    )

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tickets.router)
app.include_router(ws.router)

@app.get("/health")
def health():
    return {"status": "ok"}