from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class FHIRResourceResponse(BaseModel):
    resourceType: str
    id: str
    meta: Dict[str, Any]
    content: Dict[str, Any]


class CDISCDatasetMetadata(BaseModel):
    domain: str
    description: str
    record_count: int
    columns: List[str]
    sample_records: List[Dict[str, Any]]
