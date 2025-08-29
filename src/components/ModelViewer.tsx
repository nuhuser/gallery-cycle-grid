import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import { Suspense } from 'react';

interface ModelViewerProps {
  modelUrl: string;
}

const Model = ({ url }: { url: string }) => {
  try {
    const { scene } = useGLTF(url);
    return (
      <Center>
        <primitive object={scene} />
      </Center>
    );
  } catch (error) {
    console.error('Error loading 3D model:', error);
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    );
  }
};

export const ModelViewer: React.FC<ModelViewerProps> = ({ modelUrl }) => {
  return (
    <div className="w-full h-64 bg-muted rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense 
          fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="gray" />
            </mesh>
          }
        >
          <Model url={modelUrl} />
        </Suspense>
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
};