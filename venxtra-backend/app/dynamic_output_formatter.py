"""
Dynamic Output Formatter
Formats extracted dynamic fields and tables into various output formats
"""

import json
from typing import Dict, List, Any, Optional, Union
from dataclasses import asdict
from datetime import datetime
import logging

from app.dynamic_field_extractor import (
    DynamicExtractionResult, DynamicField, DynamicTable, DocumentCategory
)

logger = logging.getLogger(__name__)

class DynamicOutputFormatter:
    """Formats dynamic extraction results into various output formats"""
    
    def __init__(self):
        pass
    
    def format_as_json(self, result: DynamicExtractionResult, 
                      include_metadata: bool = True) -> Dict[str, Any]:
        """Format result as structured JSON"""
        output = {
            "document_info": {
                "category": result.document_category.value,
                "confidence": result.confidence,
                "extraction_timestamp": datetime.now().isoformat()
            },
            "extracted_fields": {},
            "extracted_tables": [],
            "key_insights": result.key_insights
        }
        
        # Organize fields by category
        field_categories = {}
        for field in result.fields:
            category = field.category
            if category not in field_categories:
                field_categories[category] = []
            
            field_data = {
                "key": field.key,
                "value": field.value,
                "data_type": field.data_type,
                "confidence": field.confidence
            }
            
            if include_metadata:
                field_data["source_chunks"] = field.source_chunk_ids
                field_data["metadata"] = field.metadata
            
            field_categories[category].append(field_data)
        
        output["extracted_fields"] = field_categories
        
        # Format tables
        for table in result.tables:
            table_data = {
                "title": table.title,
                "category": table.category,
                "confidence": table.confidence,
                "headers": table.headers,
                "rows": table.rows,
                "summary": {
                    "total_rows": len(table.rows),
                    "total_columns": len(table.headers)
                }
            }
            
            if include_metadata:
                table_data["source_chunks"] = table.source_chunk_ids
                table_data["metadata"] = table.metadata
            
            output["extracted_tables"].append(table_data)
        
        if include_metadata:
            output["processing_metrics"] = result.processing_metrics
        
        return output
    
    def format_as_key_value_table(self, result: DynamicExtractionResult) -> Dict[str, Any]:
        """Format result as simple key-value table structure"""
        
        # Main information table
        main_table = {
            "title": "Document Information",
            "type": "key_value",
            "data": []
        }
        
        # Add document metadata
        main_table["data"].append(["Document Category", result.document_category.value.title()])
        main_table["data"].append(["Confidence Score", f"{result.confidence:.1%}"])
        main_table["data"].append(["Fields Extracted", str(len(result.fields))])
        main_table["data"].append(["Tables Found", str(len(result.tables))])
        
        # Fields organized by category
        field_tables = {}
        for field in result.fields:
            category = field.category.title()
            if category not in field_tables:
                field_tables[category] = {
                    "title": f"{category} Information",
                    "type": "key_value",
                    "data": []
                }
            
            # Format value based on type
            formatted_value = self._format_field_value(field.value, field.data_type)
            confidence_indicator = "★" * int(field.confidence * 5)  # 1-5 stars
            
            field_tables[category]["data"].append([
                field.key.replace("_", " ").title(),
                formatted_value,
                confidence_indicator
            ])
        
        # Add headers to field tables
        for table in field_tables.values():
            table["headers"] = ["Field", "Value", "Confidence"]
        
        # Format extracted tables
        formatted_tables = []
        for table in result.tables:
            formatted_table = {
                "title": table.title,
                "category": table.category,
                "type": "data_table",
                "headers": table.headers,
                "data": table.rows,
                "summary": {
                    "rows": len(table.rows),
                    "columns": len(table.headers),
                    "confidence": f"{table.confidence:.1%}"
                }
            }
            formatted_tables.append(formatted_table)
        
        return {
            "main_info": main_table,
            "field_tables": field_tables,
            "data_tables": formatted_tables,
            "insights": {
                "title": "Key Insights",
                "type": "list",
                "data": result.key_insights
            }
        }
    
    def format_as_html_tables(self, result: DynamicExtractionResult) -> str:
        """Format result as HTML tables for display"""
        
        html_parts = []
        
        # Document overview
        html_parts.append("""
        <div class="document-overview">
            <h2>Document Analysis Results</h2>
            <table class="overview-table">
                <tr><th>Property</th><th>Value</th></tr>
                <tr><td>Document Category</td><td>{}</td></tr>
                <tr><td>Overall Confidence</td><td>{:.1%}</td></tr>
                <tr><td>Fields Extracted</td><td>{}</td></tr>
                <tr><td>Tables Found</td><td>{}</td></tr>
            </table>
        </div>
        """.format(
            result.document_category.value.title(),
            result.confidence,
            len(result.fields),
            len(result.tables)
        ))
        
        # Fields by category
        field_categories = {}
        for field in result.fields:
            if field.category not in field_categories:
                field_categories[field.category] = []
            field_categories[field.category].append(field)
        
        for category, fields in field_categories.items():
            html_parts.append(f"""
            <div class="field-category">
                <h3>{category.title()} Information</h3>
                <table class="field-table">
                    <thead>
                        <tr><th>Field</th><th>Value</th><th>Type</th><th>Confidence</th></tr>
                    </thead>
                    <tbody>
            """)
            
            for field in fields:
                confidence_bar = self._get_confidence_bar(field.confidence)
                formatted_value = self._format_field_value(field.value, field.data_type)
                html_parts.append(f"""
                    <tr>
                        <td>{field.key.replace('_', ' ').title()}</td>
                        <td>{formatted_value}</td>
                        <td>{field.data_type}</td>
                        <td>{confidence_bar}</td>
                    </tr>
                """)
            
            html_parts.append("</tbody></table></div>")
        
        # Data tables
        for table in result.tables:
            html_parts.append(f"""
            <div class="data-table-section">
                <h3>{table.title}</h3>
                <p><strong>Category:</strong> {table.category} | <strong>Confidence:</strong> {table.confidence:.1%}</p>
                <table class="data-table">
                    <thead>
                        <tr>
            """)
            
            for header in table.headers:
                html_parts.append(f"<th>{header}</th>")
            
            html_parts.append("</tr></thead><tbody>")
            
            for row in table.rows:
                html_parts.append("<tr>")
                for cell in row:
                    html_parts.append(f"<td>{cell}</td>")
                html_parts.append("</tr>")
            
            html_parts.append("</tbody></table></div>")
        
        # Insights
        if result.key_insights:
            html_parts.append("""
            <div class="insights-section">
                <h3>Key Insights</h3>
                <ul>
            """)
            
            for insight in result.key_insights:
                html_parts.append(f"<li>{insight}</li>")
            
            html_parts.append("</ul></div>")
        
        # Add CSS
        css = """
        <style>
        .overview-table, .field-table, .data-table {
            border-collapse: collapse;
            width: 100%;
            margin: 10px 0;
        }
        .overview-table th, .field-table th, .data-table th,
        .overview-table td, .field-table td, .data-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .overview-table th, .field-table th, .data-table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .field-category, .data-table-section, .insights-section {
            margin: 20px 0;
        }
        .confidence-bar {
            display: inline-block;
            background: linear-gradient(90deg, #4CAF50 0%, #FF9800 100%);
            height: 20px;
            border-radius: 10px;
            color: white;
            text-align: center;
            line-height: 20px;
            font-size: 12px;
        }
        .insights-section ul {
            list-style-type: disc;
            padding-left: 20px;
        }
        </style>
        """
        
        return css + "".join(html_parts)
    
    def format_as_markdown(self, result: DynamicExtractionResult) -> str:
        """Format result as Markdown for documentation"""
        
        markdown_parts = []
        
        # Title and overview
        markdown_parts.append(f"# Document Analysis Results\n")
        markdown_parts.append(f"**Document Category:** {result.document_category.value.title()}\n")
        markdown_parts.append(f"**Overall Confidence:** {result.confidence:.1%}\n")
        markdown_parts.append(f"**Fields Extracted:** {len(result.fields)}\n")
        markdown_parts.append(f"**Tables Found:** {len(result.tables)}\n\n")
        
        # Fields by category
        field_categories = {}
        for field in result.fields:
            if field.category not in field_categories:
                field_categories[field.category] = []
            field_categories[field.category].append(field)
        
        for category, fields in field_categories.items():
            markdown_parts.append(f"## {category.title()} Information\n\n")
            markdown_parts.append("| Field | Value | Type | Confidence |\n")
            markdown_parts.append("|-------|-------|------|------------|\n")
            
            for field in fields:
                confidence_stars = "★" * int(field.confidence * 5)
                formatted_value = self._format_field_value(field.value, field.data_type)
                # Escape pipes in values for markdown table
                formatted_value = str(formatted_value).replace("|", "\\|")
                markdown_parts.append(f"| {field.key.replace('_', ' ').title()} | {formatted_value} | {field.data_type} | {confidence_stars} |\n")
            
            markdown_parts.append("\n")
        
        # Data tables
        if result.tables:
            markdown_parts.append("## Extracted Tables\n\n")
            
            for i, table in enumerate(result.tables, 1):
                markdown_parts.append(f"### {table.title}\n")
                markdown_parts.append(f"**Category:** {table.category} | **Confidence:** {table.confidence:.1%}\n\n")
                
                if table.headers and table.rows:
                    # Create markdown table
                    markdown_parts.append("| " + " | ".join(table.headers) + " |\n")
                    markdown_parts.append("| " + " | ".join(["-" * len(h) for h in table.headers]) + " |\n")
                    
                    for row in table.rows:
                        # Escape pipes and format row
                        escaped_row = [str(cell).replace("|", "\\|") for cell in row]
                        markdown_parts.append("| " + " | ".join(escaped_row) + " |\n")
                
                markdown_parts.append("\n")
        
        # Insights
        if result.key_insights:
            markdown_parts.append("## Key Insights\n\n")
            for insight in result.key_insights:
                markdown_parts.append(f"- {insight}\n")
            markdown_parts.append("\n")
        
        return "".join(markdown_parts)
    
    def format_as_csv_data(self, result: DynamicExtractionResult) -> Dict[str, str]:
        """Format result as CSV data for export"""
        csv_files = {}
        
        # Fields CSV
        field_rows = [["Category", "Field", "Value", "Data_Type", "Confidence"]]
        for field in result.fields:
            formatted_value = self._format_field_value(field.value, field.data_type)
            field_rows.append([
                field.category,
                field.key,
                str(formatted_value),
                field.data_type,
                str(field.confidence)
            ])
        
        csv_files["fields.csv"] = "\n".join([",".join(row) for row in field_rows])
        
        # Each table as separate CSV
        for i, table in enumerate(result.tables):
            table_rows = []
            if table.headers:
                table_rows.append(table.headers)
            table_rows.extend(table.rows)
            
            filename = f"table_{i+1}_{table.title.lower().replace(' ', '_')}.csv"
            csv_files[filename] = "\n".join([",".join([str(cell) for cell in row]) for row in table_rows])
        
        # Summary CSV
        summary_rows = [
            ["Metric", "Value"],
            ["Document_Category", result.document_category.value],
            ["Overall_Confidence", str(result.confidence)],
            ["Fields_Extracted", str(len(result.fields))],
            ["Tables_Found", str(len(result.tables))],
            ["Processing_Time", str(result.processing_metrics.get("processing_time", 0))]
        ]
        csv_files["summary.csv"] = "\n".join([",".join(row) for row in summary_rows])
        
        return csv_files
    
    def _format_field_value(self, value: Any, data_type: str) -> str:
        """Format field value based on data type"""
        if value is None:
            return ""
        
        if data_type == "list" and isinstance(value, list):
            return ", ".join([str(item) for item in value])
        elif data_type == "number":
            try:
                if isinstance(value, (int, float)):
                    return f"{value:,.2f}" if value % 1 else f"{int(value):,}"
                else:
                    return str(value)
            except:
                return str(value)
        elif data_type == "boolean":
            return "Yes" if value else "No"
        else:
            return str(value)
    
    def _get_confidence_bar(self, confidence: float) -> str:
        """Generate HTML confidence bar"""
        percentage = int(confidence * 100)
        return f'<div class="confidence-bar" style="width: {max(50, percentage)}px;">{percentage}%</div>'

# Global formatter instance
output_formatter = DynamicOutputFormatter()