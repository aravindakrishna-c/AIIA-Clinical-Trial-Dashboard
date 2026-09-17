from fastapi import APIRouter
from app.api.v1 import auth, users, roles, audit_logs, trials, participants, ethics_regulatory, safety, dashboard, fhir, export

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(roles.router)
api_router.include_router(audit_logs.router)
api_router.include_router(trials.router)
api_router.include_router(participants.router)
api_router.include_router(ethics_regulatory.router)
api_router.include_router(safety.router)
api_router.include_router(dashboard.router)
api_router.include_router(fhir.router)
api_router.include_router(export.router)
