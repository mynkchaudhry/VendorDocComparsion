from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.models import Document, Vendor, Project, User
from app.auth import get_current_user
from pydantic import BaseModel
from bson import ObjectId

router = APIRouter(prefix="/comparison", tags=["comparison"])

class ComparisonRequest(BaseModel):
    vendor_ids: List[str]
    project_id: str

class VendorComparison(BaseModel):
    vendor_id: str
    vendor_name: str
    documents: List[Dict[str, Any]]
    aggregated_data: Dict[str, Any]

class ComparisonResponse(BaseModel):
    vendors: List[VendorComparison]
    comparison_summary: Dict[str, Any]

def aggregate_vendor_data(documents: List[Document]) -> Dict[str, Any]:
    pricing_items = []
    all_products = set()
    delivery_terms = []
    payment_terms = []
    
    for doc in documents:
        if doc.structured_data:
            if doc.structured_data.pricing:
                pricing_items.extend(doc.structured_data.pricing)
            if doc.structured_data.products_or_services:
                all_products.update(doc.structured_data.products_or_services)
            if doc.structured_data.delivery_terms:
                delivery_terms.append(doc.structured_data.delivery_terms)
            if doc.structured_data.payment_terms:
                payment_terms.append(doc.structured_data.payment_terms)
    
    total_price = 0
    for item in pricing_items:
        try:
            price = float(item.get('total_price', '0').replace(',', '').replace('$', ''))
            total_price += price
        except:
            pass
    
    return {
        "total_pricing": total_price,
        "pricing_items": pricing_items,
        "products_services": list(all_products),
        "delivery_terms": delivery_terms,
        "payment_terms": payment_terms,
        "document_count": len(documents)
    }

@router.post("/", response_model=ComparisonResponse)
async def compare_vendors(
    comparison: ComparisonRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        project = await Project.find_one(Project.id == ObjectId(comparison.project_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid project ID"
        )
    if not project or project.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if len(comparison.vendor_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 vendors required for comparison"
        )
    
    vendor_comparisons = []
    all_pricing = []
    
    for vendor_id in comparison.vendor_ids:
        try:
            vendor = await Vendor.find_one(Vendor.id == ObjectId(vendor_id))
        except:
            continue
        if not vendor or vendor.project_id != comparison.project_id:
            continue
        
        documents = await Document.find(
            Document.vendor_id == vendor_id,
            Document.processing_status == "completed"
        ).to_list()
        
        aggregated = aggregate_vendor_data(documents)
        all_pricing.append(aggregated["total_pricing"])
        
        vendor_comparisons.append(VendorComparison(
            vendor_id=vendor_id,
            vendor_name=vendor.name,
            documents=[{
                "id": str(doc.id),
                "filename": doc.filename,
                "structured_data": doc.structured_data.dict() if doc.structured_data else None
            } for doc in documents],
            aggregated_data=aggregated
        ))
    
    min_price = min(all_pricing) if all_pricing else 0
    max_price = max(all_pricing) if all_pricing else 0
    avg_price = sum(all_pricing) / len(all_pricing) if all_pricing else 0
    
    comparison_summary = {
        "vendor_count": len(vendor_comparisons),
        "price_range": {
            "min": min_price,
            "max": max_price,
            "average": avg_price
        },
        "lowest_price_vendor": next(
            (v.vendor_name for v in vendor_comparisons 
             if v.aggregated_data["total_pricing"] == min_price),
            None
        ) if min_price > 0 else None
    }
    
    return ComparisonResponse(
        vendors=vendor_comparisons,
        comparison_summary=comparison_summary
    )