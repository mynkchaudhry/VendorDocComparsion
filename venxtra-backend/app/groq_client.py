from groq import Groq
from app.config import settings
from app.models import StructuredData
import json
from typing import Optional

class GroqClient:
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        
    async def extract_structured_data(self, document_text: str) -> Optional[StructuredData]:
        system_prompt = """You are a document understanding AI that extracts structured vendor information.
        Extract the following information from the document and return it as JSON:
        - vendor_name: Name of the vendor/supplier (string, never null)
        - document_type: Type of document like quote, invoice, proposal, contract (string, never null)
        - pricing: Array of items with fields: item, quantity, unit_price, total_price (array, can be empty)
        - products_or_services: List of products or services offered (array of strings, can be empty)
        - delivery_terms: Delivery conditions and timelines (string, never null)
        - payment_terms: Payment conditions and schedules (string, never null)
        - special_clauses: Any special terms, conditions, or clauses (string, never null)
        - notes: Additional important information (string, never null)
        - fields maybe different, but always return all fields with empty defaults if not found.
        
        IMPORTANT: All string fields must contain actual string values, never null/None. Use empty string "" if no information is found.
        All array fields must be arrays, never null/None. Use empty array [] if no items are found.
        
        Return ONLY valid JSON without any markdown formatting or explanations.
        
        Example format:
        {
          "vendor_name": "Example Corp",
          "document_type": "quote",
          "pricing": [{"item": "Service A", "quantity": "1", "unit_price": "100", "total_price": "100"}],
          "products_or_services": ["Service A", "Service B"],
          "delivery_terms": "30 days",
          "payment_terms": "Net 30",
          "special_clauses": "Standard terms apply",
          "notes": "Additional notes here"
        }"""
        
        user_prompt = f"""Extract structured vendor information from this document:
        
        {document_text[:8000]}"""
        
        try:
            completion = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            response_text = completion.choices[0].message.content
            response_text = response_text.strip()
            print(f"Raw Groq response: {response_text}")
            
            # Handle various code block formats
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            elif response_text.startswith("```"):
                response_text = response_text[3:]
                
            if response_text.endswith("```"):
                response_text = response_text[:-3]
                
            response_text = response_text.strip()
            
            structured_data = json.loads(response_text)
            print(f"Parsed JSON: {structured_data}")
            print(f"JSON type: {type(structured_data)}")
            
            # If the response is not a dict, create default structure
            if not isinstance(structured_data, dict):
                print(f"Warning: Expected dict but got {type(structured_data)}, creating default structure")
                structured_data = {}
            
            # Initialize with all required fields as empty defaults
            cleaned_data = {
                'vendor_name': '',
                'document_type': '',
                'pricing': [],
                'products_or_services': [],
                'delivery_terms': '',
                'payment_terms': '',
                'special_clauses': '',
                'notes': ''
            }
            
            # Update with any valid values from the response
            for field in cleaned_data.keys():
                value = structured_data.get(field)
                if value is not None:
                    if field in ['pricing', 'products_or_services']:
                        # Handle list fields
                        if isinstance(value, list):
                            cleaned_data[field] = value
                        elif isinstance(value, str) and value.strip():
                            # Convert non-empty string to list
                            cleaned_data[field] = [value.strip()]
                        else:
                            cleaned_data[field] = []
                    else:
                        # Handle string fields
                        if isinstance(value, str):
                            cleaned_data[field] = value.strip()
                        elif isinstance(value, list):
                            cleaned_data[field] = " | ".join(str(item).strip() for item in value if item)
                        else:
                            cleaned_data[field] = str(value).strip() if value else ''
            
            # Clean pricing data specifically
            if cleaned_data['pricing']:
                cleaned_pricing = []
                for item in cleaned_data['pricing']:
                    if isinstance(item, dict):
                        # Ensure all pricing fields are strings
                        clean_item = {}
                        for key, val in item.items():
                            if val is not None:
                                clean_item[key] = str(val)
                            else:
                                clean_item[key] = ""
                        cleaned_pricing.append(clean_item)
                cleaned_data['pricing'] = cleaned_pricing
            
            print(f"Cleaned data: {cleaned_data}")
            
            return StructuredData(**cleaned_data)
            
        except Exception as e:
            print(f"Error extracting structured data: {str(e)}")
            return None

groq_client = GroqClient()