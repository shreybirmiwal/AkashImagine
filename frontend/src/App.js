import { useState, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useDropzone } from 'react-dropzone';
import { BeatLoader } from 'react-spinners';

function GLBModel({ modelData }) {
  const glb = useMemo(() => {
    const buffer = Uint8Array.from(atob(modelData), c => c.charCodeAt(0));
    return new Blob([buffer], { type: 'model/gltf-binary' });
  }, [modelData]);

  const { scene } = useGLTF(URL.createObjectURL(glb));
  return <primitive object={scene} />;
}

export default function App() {
  const [preview, setPreview] = useState(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    multiple: false
  });

  const generateModel = async () => {
    if (!preview) return;

    setLoading(true);
    setError(null);

    try {
      const base64Data = preview.split(',')[1];
      const response = await fetch('http://YOUR_AKASH_API_URL/generate-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_data: base64Data })
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      setModel(data.glb_data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      <div className="flex-1 flex gap-4 p-4">
        {/* Left Panel - Upload */}
        <div {...getRootProps()} className="flex-1 bg-white rounded-lg shadow-lg p-4 cursor-pointer">
          <input {...getInputProps()} />
          <div className={`h-full border-2 border-dashed rounded-lg flex items-center justify-center 
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="text-center text-gray-500">
                <p className="text-xl">Drag & drop image here</p>
                <p className="mt-2">or click to select</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - 3D Viewer */}
        <div className="flex-1 bg-white rounded-lg shadow-lg p-4">
          <div className="h-full bg-gray-50 rounded-lg overflow-hidden">
            {model ? (
              <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <GLBModel modelData={model} />
                <OrbitControls />
              </Canvas>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                {loading ? (
                  <div className="text-center">
                    <BeatLoader color="#3B82F6" />
                    <p className="mt-2">Generating 3D model...</p>
                  </div>
                ) : (
                  <p>3D model will appear here</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center pb-4">
        <button
          onClick={generateModel}
          disabled={!preview || loading}
          className={`px-8 py-3 rounded-full text-white font-semibold transition-all
            ${!preview || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          {loading ? 'Generating...' : 'Generate Model!'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
}