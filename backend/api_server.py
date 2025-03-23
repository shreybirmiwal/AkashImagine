# api_server.py
import os
import base64
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline
from hy3dgen.texgen import Hunyuan3DPaintPipeline

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize pipelines
shape_pipeline = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(
    'tencent/Hunyuan3D-2'
)
texture_pipeline = Hunyuan3DPaintPipeline.from_pretrained(
    'tencent/Hunyuan3D-2'
)

@app.post("/generate-3d")
async def generate_3d(image_data: str, generate_texture: bool = True):
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        image_path = f"/tmp/{uuid.uuid4()}.png"
        
        with open(image_path, "wb") as f:
            f.write(image_bytes)
        
        # Generate 3D shape
        mesh = shape_pipeline(image=image_path)[0]
        
        # Generate texture if requested
        if generate_texture:
            mesh = texture_pipeline(mesh, image=image_path)
        
        # Save to GLB format
        output_path = f"/tmp/{uuid.uuid4()}.glb"
        mesh.export(output_path)
        
        # Return as base64
        with open(output_path, "rb") as f:
            glb_data = base64.b64encode(f.read()).decode("utf-8")
            
        return {"glb_data": glb_data}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))