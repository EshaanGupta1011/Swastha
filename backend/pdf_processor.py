# backend/pdf_processor.py
import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

def process_pdf_with_gemini(file_path):
    """Send PDF directly to Gemini for processing and return structured JSON."""
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        pdf_file = genai.upload_file(file_path)
        
        prompt = """
        Analyze this medical lab report (PDF or image) and extract all information into a structured JSON format.
        Return ONLY valid JSON with this structure:
        {
            "metadata": {
                "card_no": "string",
                "name": "string", 
                "age_sex": "string",
                "lab_no": "string",
                "reg_no": "string", 
                "sample_collection_date": "string",
                "report_date": "string",
                "ref_dr": "string"
            },
            "results": [
                {
                    "section": "string",
                    "tests": [
                        {
                            "test_name": "string",
                            "result": "string",
                            "unit": "string",
                            "reference_range": "string",
                            "remarks": "string"
                        }
                    ]
                }
            ]
        }
        
        CRITICAL STANDARDIZATION INSTRUCTIONS:
        
        1. STANDARDIZE ALL NAMES USING THESE EXACT MAPPINGS:
           - "WBC" or "WBC Count" or "White Blood Cell Count" → "WBC"
           - "RBC" or "RBC Count" or "Red Blood Cell Count" → "RBC"
           - "Hemoglobin" or "Haemoglobin" or "HGB" or "Hb" → "Hemoglobin"
           - "Hematocrit" or "HCT" or "Packed Cell Volume" → "Hematocrit"
           - "Platelets" or "PLT" or "Platelet Count" → "Platelets"
           - "MCV" or "Mean Corpuscular Volume" → "MCV"
           - "MCH" or "Mean Corpuscular Hemoglobin" → "MCH"
           - "MCHC" or "Mean Corpuscular Hemoglobin Concentration" → "MCHC"
           - "RDW-CV" or "RDW" → "RDW-CV"
           - "RDW-SD" → "RDW-SD"
           - "MPV" or "Mean Platelet Volume" → "MPV"
           - "PDW-CV" or "PDW" → "PDW-CV"
           - "PDW-SD" → "PDW-SD"
           - "PCT" → "PCT"
           - "P-LCR" or "Platelet Large Cell Ratio" → "P-LCR"
           - "P-LCC" or "Platelet Large Cell Count" → "P-LCC"
           - "Neu%" or "Neut%" or "Neutrophil%" → "Neutrophil %"
           - "Lym%" or "Lymphocyte%" → "Lymphocyte %"
           - "Mon%" or "Monocyte%" → "Monocyte %"
           - "Eos%" or "Eosinophil%" → "Eosinophil %"
           - "Bas%" or "Basophil%" → "Basophil %"
           - "Neu#" or "Neut#" or "Neutrophil#" → "Neutrophil Absolute"
           - "Lym#" or "Lymphocyte#" → "Lymphocyte Absolute"
           - "Mon#" or "Monocyte#" → "Monocyte Absolute"
           - "Eos#" or "Eosinophil#" → "Eosinophil Absolute"
           - "Bas#" or "Basophil#" → "Basophil Absolute"
           - "ALY#" or "ALY" or "*ALY#" or "*ALY%" or "Atypical Lymphocyte Absolute" or "Atypical Lymphocytes Absolute" → "Atypical Lymphocyte Absolute"
           - "ALY%" or "Atypical Lymphocyte %" or "Atypical Lymphocytes %" → "Atypical Lymphocyte %"
           - "LIC#" or "LIC" or "*LIC#" or "*LIC%" or "Large Immature Cells Absolute" or "Large Immature Cell Absolute" → "Large Immature Cells Absolute"
           - "LIC%" or "Large Immature Cells %" or "Large Immature Cell %" → "Large Immature Cells %"
           - "Mentzer" or "Mentzer Index" or "RDWI" → "Mentzer Index"
           - "Urea" or "UREA" → "Urea"
           - "Creatinine" or "CREATININE" → "Creatinine"
           - "Uric Acid" or "URIC ACID" → "Uric Acid"
           - "Calcium" or "CAL 1S" or "CALCIUM" → "Calcium"
           - "Total Bilirubin" or "TOTAL BILIRUBIN" → "Total Bilirubin"
           - "Direct Bilirubin" or "DIRECT BILIRUBIN" or "DIRECT BILIRUB." → "Direct Bilirubin"
           - "AST" or "AST(GOT)" or "AST (GOT)" or "SGOT" → "AST (SGOT)"
           - "ALT" or "ALT(GPT)" or "ALT (GPT)" or "SGPT" → "ALT (SGPT)"
           - "Gamma GT" or "Gamma-GT" or "GAMMA GT" → "Gamma GT"
           - "Total Protein" or "TPROT" or "TPROT 1 SHOT" → "Total Protein"
           - "Albumin" or "ALBUMIN" → "Albumin"
           - "Alkaline Phosphatase" or "ALK PHOS" → "Alkaline Phosphatase"
           - "Cholesterol" or "CHOLESTEROL" → "Cholesterol"
           - "Triglycerides" or "TRIGLYCERIDES" → "Triglycerides"
           - "HDL Cholesterol" or "HDL" or "DIRECT HDL" → "HDL Cholesterol"
           - "Blood Sugar Fasting" or "BSf-(1u2" → "Blood Sugar Fasting"
           
        2. GROUPING RULES:
           - Percentage values and absolute values for the same cell type are DIFFERENT measurements and should be kept separate but standardized
           - Only group terms that represent the EXACT same measurement with different naming
           - When in doubt about whether two names refer to the same measurement, keep them separate
           
        3. CONSISTENCY ACROSS REPORTS:
           - Use the EXACT same standardized names consistently across all reports
           - This is CRITICAL for proper comparison - same measurements MUST have identical names
           - Focus on making the comparison table readable by ensuring the same measurements have the same names
           
        4. PRESERVE DATA: Include ALL test results, even if values seem abnormal.
        5. RETURN ONLY JSON: No explanations, no markdown, just the JSON structure.
        """
        
        response = model.generate_content([prompt, pdf_file])
        response_text = response.text.strip()
        
        # Clean up markdown if present
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
        
        if not response_text:
            return {}
            
        try:
            structured_data = json.loads(response_text)
            print(f"Successfully parsed Gemini response: {type(structured_data)}")
            return structured_data
        except json.JSONDecodeError:
            print(f"Failed to parse JSON. Raw response: {response_text}")
            return {"error": "Failed to parse", "raw": response_text}
            
    except Exception as e:
        print(f"Gemini processing error: {e}")
        return {"error": str(e)}