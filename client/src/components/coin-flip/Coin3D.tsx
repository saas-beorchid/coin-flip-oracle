import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

interface Coin3DProps {
  isFlipping: boolean;
  outcome: string | null;
  resultText: string;
  headsLabel: string;
  tailsLabel: string;
  coinStyle: string;
}

const Coin3D = forwardRef<HTMLDivElement, Coin3DProps>(
  ({ isFlipping, outcome, resultText, headsLabel, tailsLabel, coinStyle }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const coinRef = useRef<THREE.Group | null>(null);
    const requestRef = useRef<number | null>(null);
    const flipStartTime = useRef<number | null>(null);
    const flipDuration = 1000; // ms
    const [isInititialized, setIsInitialized] = useState(false);

    // Expose the container ref
    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    // Get coin textures based on coin style with ultra-bright vibrant colors
    const getCoinTextures = () => {
      let headsColor, tailsColor, edgeColor;
      
      switch (coinStyle) {
        case 'gold':
          headsColor = new THREE.Color(0xFFE650);  // Extremely bright gold
          tailsColor = new THREE.Color(0xFFD433);  // Luminous gold
          edgeColor = new THREE.Color(0xFFBF00);   // Bright amber gold
          break;
        case 'silver':
          headsColor = new THREE.Color(0xFFFFFF);  // Pure white silver
          tailsColor = new THREE.Color(0xF8F8FF);  // Ghost white
          edgeColor = new THREE.Color(0xE0E0E0);   // Bright silver
          break;
        default: // default copper style - super-enhanced
          headsColor = new THREE.Color(0xFF8F5E);  // Ultra-bright copper
          tailsColor = new THREE.Color(0xFF7F50);  // Coral/copper - much brighter
          edgeColor = new THREE.Color(0xFF6347);   // Tomato/copper edge - even brighter
          break;
      }
      
      return { headsColor, tailsColor, edgeColor };
    };

    // Initialize Three.js scene
    const initThree = () => {
      if (!containerRef.current) return;
      
      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      
      // Create camera with perspective
      const camera = new THREE.PerspectiveCamera(
        50, // FOV
        1, // Aspect ratio (will be updated)
        0.1, // Near clipping plane
        1000 // Far clipping plane
      );
      camera.position.z = 5;
      cameraRef.current = camera;
      
      // Create renderer with antialiasing and black background for better contrast
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0x000000, 1); // Solid black background for better contrast with bright coin
      rendererRef.current = renderer;
      
      // Add renderer to DOM
      containerRef.current.appendChild(renderer.domElement);
      
      // Super-enhanced lighting setup for maximum visibility and brilliance
      
      // Stronger ambient light for base illumination
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased intensity
      scene.add(ambientLight);
      
      // Powerful main directional light (simulates sun)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Much brighter
      directionalLight.position.set(5, 5, 5);
      // Add better shadows
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 512;
      directionalLight.shadow.mapSize.height = 512;
      scene.add(directionalLight);
      
      // Add a stronger secondary light from opposing angle for highlights
      const secondaryLight = new THREE.DirectionalLight(0xffffcc, 1.2); // Much brighter yellow tint
      secondaryLight.position.set(-5, 3, -5);
      scene.add(secondaryLight);
      
      // Add a bright point light for enhanced visibility
      const pointLight = new THREE.PointLight(0x3366ff, 0.8, 15); // Brighter blue with greater range
      pointLight.position.set(2, -2, 2);
      scene.add(pointLight);
      
      // Add front spotlight for dramatic lighting
      const spotLight = new THREE.SpotLight(0xffffff, 1.0, 20, Math.PI / 6, 0.5, 1);
      spotLight.position.set(0, 0, 8); // Position in front of coin
      scene.add(spotLight);
      
      // Add rimlight for edge highlighting
      const rimLight = new THREE.PointLight(0xffcc88, 0.6, 10); // Warm orange
      rimLight.position.set(0, 3, -3); // Behind and above
      scene.add(rimLight);
      
      // Create coin
      createCoin();
      
      // Set initial size
      updateSize();
      
      // Start animation loop
      animate();
      
      // Mark as initialized
      setIsInitialized(true);
    };

    // Create 3D coin model
    const createCoin = () => {
      if (!sceneRef.current) return;
      
      // Remove existing coin if any
      if (coinRef.current) {
        sceneRef.current.remove(coinRef.current);
      }
      
      const { headsColor, tailsColor, edgeColor } = getCoinTextures();
      
      // Create coin group
      const coin = new THREE.Group();
      coinRef.current = coin;
      
      // Create coin geometry (cylinder with small height)
      const radius = 1.5;
      const height = 0.1;
      const segments = 64;
      const geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
      
      // Create ultra-bright emissive materials for maximum visibility
      const headsMaterial = new THREE.MeshPhysicalMaterial({
        color: headsColor,
        metalness: 0.9,
        roughness: 0.08,         // Even smoother for better reflection
        reflectivity: 1.0,       // Maximum reflectivity
        clearcoat: 0.5,          // More clear coat for shine
        clearcoatRoughness: 0.05, // Smoother clear coat
        emissive: new THREE.Color(headsColor).multiplyScalar(0.4), // Makes the material emit light
        emissiveIntensity: 0.5,  // Intensity of emitted light
        envMapIntensity: 2.0,    // Much brighter reflections
      });
      
      const tailsMaterial = new THREE.MeshPhysicalMaterial({
        color: tailsColor,
        metalness: 0.9,
        roughness: 0.1,
        reflectivity: 1.0,       // Maximum reflectivity
        clearcoat: 0.5,
        clearcoatRoughness: 0.05,
        emissive: new THREE.Color(tailsColor).multiplyScalar(0.4), // Makes the material emit light
        emissiveIntensity: 0.5,  // Intensity of emitted light
        envMapIntensity: 2.0,    // Much brighter reflections
      });
      
      const edgeMaterial = new THREE.MeshPhysicalMaterial({
        color: edgeColor,
        metalness: 0.9,
        roughness: 0.01,        // Super smooth edge
        reflectivity: 1.0,      // Maximum reflectivity
        clearcoat: 0.8,         // Maximum clear coat
        clearcoatRoughness: 0.01,
        emissive: new THREE.Color(edgeColor).multiplyScalar(0.5), // Makes the edge glow
        emissiveIntensity: 0.6, // Higher intensity for edge
        envMapIntensity: 2.5,   // Extra bright edge reflections
      });
      
      // Create materials array for the coin's faces and edge
      const materials = [
        edgeMaterial, // Edge
        headsMaterial, // Top (heads)
        tailsMaterial, // Bottom (tails)
      ];
      
      // Create coin mesh
      const coinMesh = new THREE.Mesh(geometry, materials);
      coin.add(coinMesh);
      
      // Add text to both sides
      // Create text for heads
      const fontLoader = new THREE.TextureLoader();
      
      // Create enhanced canvas for heads texture with better visibility
      const headsCanvas = document.createElement('canvas');
      headsCanvas.width = 512; // Higher resolution
      headsCanvas.height = 512;
      const headsCtx = headsCanvas.getContext('2d');
      if (headsCtx) {
        // Create gradient background
        const headsGradient = headsCtx.createRadialGradient(256, 256, 50, 256, 256, 256);
        headsGradient.addColorStop(0, '#111111');
        headsGradient.addColorStop(1, '#000000');
        headsCtx.fillStyle = headsGradient;
        headsCtx.fillRect(0, 0, 512, 512);
        
        // Draw a decorative circle
        headsCtx.strokeStyle = '#FFFFFF';
        headsCtx.lineWidth = 10;
        headsCtx.beginPath();
        headsCtx.arc(256, 256, 230, 0, Math.PI * 2);
        headsCtx.stroke();
        
        // Add text with shadow for better visibility
        headsCtx.font = 'bold 96px Arial';
        headsCtx.shadowColor = '#000000';
        headsCtx.shadowBlur = 15;
        headsCtx.shadowOffsetX = 0;
        headsCtx.shadowOffsetY = 0;
        headsCtx.fillStyle = '#FFFFFF';
        headsCtx.textAlign = 'center';
        headsCtx.textBaseline = 'middle';
        headsCtx.fillText(headsLabel, 256, 256);
        
        // Add secondary decorative elements
        headsCtx.fillStyle = '#FFFFFF';
        headsCtx.beginPath();
        headsCtx.arc(256, 156, 8, 0, Math.PI * 2);
        headsCtx.fill();
        headsCtx.beginPath();
        headsCtx.arc(256, 356, 8, 0, Math.PI * 2);
        headsCtx.fill();
        
        // Apply enhanced texture to heads
        const headsTexture = new THREE.CanvasTexture(headsCanvas);
        headsTexture.anisotropy = 16; // Improve texture quality
        headsMaterial.map = headsTexture;
      }
      
      // Create enhanced canvas for tails texture
      const tailsCanvas = document.createElement('canvas');
      tailsCanvas.width = 512; // Higher resolution
      tailsCanvas.height = 512;
      const tailsCtx = tailsCanvas.getContext('2d');
      if (tailsCtx) {
        // Create gradient background
        const tailsGradient = tailsCtx.createRadialGradient(256, 256, 50, 256, 256, 256);
        tailsGradient.addColorStop(0, '#111111');
        tailsGradient.addColorStop(1, '#000000');
        tailsCtx.fillStyle = tailsGradient;
        tailsCtx.fillRect(0, 0, 512, 512);
        
        // Draw a decorative circle with different style
        tailsCtx.strokeStyle = '#FFFFFF';
        tailsCtx.lineWidth = 10;
        tailsCtx.setLineDash([15, 5]);
        tailsCtx.beginPath();
        tailsCtx.arc(256, 256, 230, 0, Math.PI * 2);
        tailsCtx.stroke();
        tailsCtx.setLineDash([]);
        
        // Add text with shadow for better visibility
        tailsCtx.font = 'bold 96px Arial';
        tailsCtx.shadowColor = '#000000';
        tailsCtx.shadowBlur = 15;
        tailsCtx.shadowOffsetX = 0;
        tailsCtx.shadowOffsetY = 0;
        tailsCtx.fillStyle = '#FFFFFF';
        tailsCtx.textAlign = 'center';
        tailsCtx.textBaseline = 'middle';
        tailsCtx.fillText(tailsLabel, 256, 256);
        
        // Add different secondary decorative elements
        tailsCtx.fillStyle = '#FFFFFF';
        tailsCtx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI / 2);
          const x = 256 + Math.cos(angle) * 180;
          const y = 256 + Math.sin(angle) * 180;
          tailsCtx.moveTo(x, y);
          tailsCtx.arc(x, y, 6, 0, Math.PI * 2);
        }
        tailsCtx.fill();
        
        // Apply enhanced texture to tails
        const tailsTexture = new THREE.CanvasTexture(tailsCanvas);
        tailsTexture.anisotropy = 16; // Improve texture quality
        tailsMaterial.map = tailsTexture;
      }
      
      // Rotate text correctly on sides
      coinMesh.rotation.x = Math.PI / 2;
      
      // Add coin to scene
      sceneRef.current.add(coin);
      
      // Set initial rotation based on outcome
      updateCoinRotation();
    };

    // Handle window resize
    const updateSize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = width; // Square aspect ratio
      
      // Update camera aspect ratio
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      // Update renderer size
      rendererRef.current.setSize(width, height);
    };

    // Animation loop with enhanced rotation and revolution effects
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !coinRef.current) return;
      
      // Gentle ambient animation when not flipping
      if (!isFlipping && !flipStartTime.current) {
        // Rotation: Coin spins on its own axis
        coinRef.current.rotation.y += 0.01; // Faster spin for better visibility
        
        // Revolution: Coin tilts and wobbles slightly like a real coin settling
        const time = Date.now() * 0.001; // Convert to seconds for smoother animation
        coinRef.current.rotation.z = Math.sin(time * 1.5) * 0.1; // Wobble effect
        
        // Add a slight bounce effect
        coinRef.current.position.y = Math.sin(time * 2) * 0.05;
        
        // Add subtle positional revolving
        const revolutionRadius = 0.1;
        coinRef.current.position.x = Math.sin(time) * revolutionRadius;
        coinRef.current.position.z = Math.cos(time) * revolutionRadius;
      }
      
      // Handle coin flip animation with enhanced effects
      if (isFlipping && flipStartTime.current) {
        const elapsed = Date.now() - flipStartTime.current;
        const progress = Math.min(elapsed / flipDuration, 1);
        
        // Rotate coin rapidly during flip with axis variation for more realistic effect
        const flips = 6; // Increased number of rotations for more dramatic effect
        coinRef.current.rotation.x = progress * Math.PI * 2 * flips;
        
        // Add slight rotation on other axes for more realistic physics
        coinRef.current.rotation.y = Math.sin(progress * Math.PI * 4) * 0.5;
        
        // Make coin rise and fall during flip
        const jumpHeight = 1.5;
        const jumpCurve = Math.sin(progress * Math.PI);
        coinRef.current.position.y = jumpCurve * jumpHeight;
        
        // If flip is complete
        if (progress >= 1) {
          flipStartTime.current = null;
          updateCoinRotation();
          
          // Add a small bounce at the end
          setTimeout(() => {
            if (coinRef.current) {
              const bounceAnimation = { value: 0 };
              const startTime = Date.now();
              const bounceDuration = 500; // ms
              
              const animateBounce = () => {
                const elapsedBounce = Date.now() - startTime;
                const bouncePct = Math.min(elapsedBounce / bounceDuration, 1);
                
                if (bouncePct < 1 && coinRef.current) {
                  // Small bounce that diminishes
                  coinRef.current.position.y = Math.sin(bouncePct * Math.PI * 3) * 0.2 * (1 - bouncePct);
                  requestAnimationFrame(animateBounce);
                }
              };
              
              animateBounce();
            }
          }, 50);
        }
      }
      
      // Enhanced dramatic lighting animation for maximum visibility and visual interest
      if (sceneRef.current.children.length > 0) {
        const time = Date.now() * 0.001;
        
        // Find the directional lights for main lighting
        const dirLights = sceneRef.current.children.filter(
          child => child instanceof THREE.DirectionalLight
        );
        
        if (dirLights.length > 0) {
          // Main directional light movement
          const mainLight = dirLights[0] as THREE.DirectionalLight;
          
          // Move light in a wider circular pattern
          mainLight.position.x = Math.sin(time) * 5;
          mainLight.position.z = Math.cos(time) * 5;
          mainLight.position.y = 3 + Math.sin(time * 0.5) * 2;
          
          // More dramatic intensity variation
          mainLight.intensity = 1.5 + Math.sin(time * 3) * 0.3;
          
          // Secondary directional light (if present)
          if (dirLights.length > 1) {
            const secondLight = dirLights[1] as THREE.DirectionalLight;
            
            // Move in opposite pattern to create more dramatic shadows
            secondLight.position.x = Math.sin(time + Math.PI) * 5;
            secondLight.position.z = Math.cos(time + Math.PI) * 5;
            secondLight.position.y = 3 + Math.cos(time * 0.5) * 2;
            
            // Vary intensity out of phase with main light
            secondLight.intensity = 1.2 + Math.sin(time * 3 + Math.PI) * 0.3;
          }
        }
        
        // Find the spot light for dramatic focal lighting
        const spotLights = sceneRef.current.children.filter(
          child => child instanceof THREE.SpotLight
        );
        
        if (spotLights.length > 0) {
          const spotLight = spotLights[0] as THREE.SpotLight;
          
          // Create subtle movement
          spotLight.position.x = Math.sin(time * 0.5) * 0.5;
          spotLight.position.y = Math.cos(time * 0.4) * 0.5;
          
          // Vary intensity for dramatic pulsing
          spotLight.intensity = 1.0 + Math.sin(time * 2) * 0.3;
          
          // Change angle slightly for shifting highlights
          spotLight.angle = (Math.PI / 6) * (0.9 + Math.sin(time) * 0.1);
        }
        
        // Find point lights for accent lighting
        const pointLights = sceneRef.current.children.filter(
          child => child instanceof THREE.PointLight
        );
        
        if (pointLights.length > 0) {
          pointLights.forEach((light, index) => {
            const pointLight = light as THREE.PointLight;
            
            // Create orbital movement with phase based on index
            const phase = index * Math.PI / 2;
            pointLight.position.x = 2 * Math.sin(time * 0.7 + phase);
            pointLight.position.z = 2 * Math.cos(time * 0.7 + phase);
            pointLight.position.y = 1 + Math.sin(time * 0.5 + phase) * 1;
            
            // Pulse intensity dramatically
            pointLight.intensity = 0.6 + Math.sin(time * 3 + phase) * 0.4;
          });
        }
      }
      
      // Render scene with enhanced visual effects
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      
      // Continue animation loop
      requestRef.current = requestAnimationFrame(animate);
    };

    // Update coin rotation based on outcome
    const updateCoinRotation = () => {
      if (!coinRef.current) return;
      
      // Reset base rotation
      coinRef.current.rotation.x = 0;
      
      // Rotate based on outcome
      if (outcome === 'tails') {
        coinRef.current.rotation.x = Math.PI;
      }
    };

    // Initialize Three.js on mount
    useEffect(() => {
      initThree();
      
      // Handle window resize
      const handleResize = () => {
        updateSize();
      };
      window.addEventListener('resize', handleResize);
      
      // Cleanup on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
        
        if (rendererRef.current && containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      };
    }, []);

    // Update coin when props change
    useEffect(() => {
      if (isInititialized) {
        createCoin();
      }
    }, [coinStyle, headsLabel, tailsLabel, isInititialized]);

    // Handle flip animation
    useEffect(() => {
      if (isFlipping && !flipStartTime.current) {
        flipStartTime.current = Date.now();
      }
      
      if (!isFlipping && outcome !== null) {
        updateCoinRotation();
      }
    }, [isFlipping, outcome]);

    return (
      <div className="relative mb-8 h-[280px] flex items-center justify-center">
        <div
          ref={containerRef}
          className="coin-container w-[240px] h-[240px]"
        />
        <div 
          className={cn(
            "absolute -bottom-8 text-xl font-semibold text-center text-white transition-opacity duration-300",
            resultText ? "opacity-100" : "opacity-0"
          )}
        >
          {resultText}
        </div>
      </div>
    );
  }
);

Coin3D.displayName = "Coin3D";

export default Coin3D;