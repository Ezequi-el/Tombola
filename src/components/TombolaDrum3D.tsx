import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { Ticket, TombolaTheme } from '../types/tombola';
import { THEME_STYLES } from '../utils/presets';
import { sound } from '../utils/audio';

interface TombolaDrum3DProps {
  tickets: Ticket[];
  theme: TombolaTheme;
  isSpinning: boolean;
  onSpinStart: () => void;
  onBallExtracted: (ticket: Ticket) => void;
  soundEnabled: boolean;
  selectedTicketToExtract: Ticket | null;
  isFullscreen?: boolean;
}

interface PhysicsBall3D {
  id: string;
  ticket: Ticket;
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
}

interface ParticleData3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  r: number;
  g: number;
  b: number;
  life: number;
  maxLife: number;
  size: number;
}

export const TombolaDrum3D: React.FC<TombolaDrum3DProps> = ({
  tickets,
  theme,
  isSpinning,
  onSpinStart,
  onBallExtracted,
  soundEnabled,
  selectedTicketToExtract,
  isFullscreen = false,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const themeStyle = THEME_STYLES[theme] || THEME_STYLES.cottonCandy;

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const drumGroupRef = useRef<THREE.Group | null>(null);
  const crankGroupRef = useRef<THREE.Group | null>(null);
  const starsGroupRef = useRef<THREE.Group | null>(null);
  const ballsContainerRef = useRef<THREE.Group | null>(null);
  const ballsDataRef = useRef<PhysicsBall3D[]>([]);

  // 3D Particles references
  const particlePointsRef = useRef<THREE.Points | null>(null);
  const particlesDataRef = useRef<ParticleData3D[]>([]);
  const particlePositionsRef = useRef<Float32Array | null>(null);
  const particleColorsRef = useRef<Float32Array | null>(null);
  const particleSizesRef = useRef<Float32Array | null>(null);

  // Physics & rotation state
  const drumAngleRef = useRef<number>(0);
  const drumSpeedRef = useRef<number>(0);
  const targetSpeedRef = useRef<number>(0);
  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Floating extracted ball animation state
  const [extractedBallAnim, setExtractedBallAnim] = useState<{
    ticket: Ticket;
    progress: number;
  } | null>(null);

  // Sparkle shockwave visual state
  const [showSparkleRings, setShowSparkleRings] = useState<boolean>(false);

  // Sync audio
  useEffect(() => {
    sound.setMuted(!soundEnabled);
  }, [soundEnabled]);

  // Handle spin state
  useEffect(() => {
    if (isSpinning) {
      targetSpeedRef.current = 0.26;
      sound.playSpinStart();

      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      spinTimerRef.current = setTimeout(() => {
        targetSpeedRef.current = 0.003;
      }, 3300);
    } else {
      targetSpeedRef.current = 0.0015;
    }

    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, [isSpinning]);

  // Trigger 3D and Canvas Particle Burst directly over the tombola
  const triggerParticleExplosion = useCallback((ticketColor: string) => {
    // 1. Trigger Three.js 3D Particles Fountain from Chute
    const pData = particlesDataRef.current;
    const baseColor = new THREE.Color(ticketColor || '#FFB7B2');
    const pastelPalette = [
      baseColor,
      new THREE.Color('#FFB7B2'),
      new THREE.Color('#FFEAA7'),
      new THREE.Color('#B5EAD7'),
      new THREE.Color('#BAE6FD'),
      new THREE.Color('#FBCFE8'),
      new THREE.Color('#FDE047'),
      new THREE.Color('#DDD6FE'),
    ];

    for (let i = 0; i < pData.length; i++) {
      const p = pData[i];
      // Reset position to the exit chute bowl
      p.x = (Math.random() - 0.5) * 0.4;
      p.y = -1.8 + (Math.random() - 0.5) * 0.2;
      p.z = 1.0 + (Math.random() - 0.5) * 0.3;

      // Upward celebratory fountain velocity with wide fan spread
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.08 + Math.random() * 0.16;
      p.vx = Math.cos(angle) * speed * 0.85;
      p.vy = 0.12 + Math.random() * 0.22; // Strong upward launch
      p.vz = Math.sin(angle) * speed * 0.85 + 0.04;

      const c = pastelPalette[Math.floor(Math.random() * pastelPalette.length)];
      p.r = c.r;
      p.g = c.g;
      p.b = c.b;

      p.maxLife = 50 + Math.floor(Math.random() * 45);
      p.life = p.maxLife;
      p.size = 0.35 + Math.random() * 0.35;
    }

    // 2. Trigger Localized Confetti Cannon centered directly on the tombola drum
    if (mountRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const originX = (rect.left + rect.width / 2) / window.innerWidth;
      const originY = (rect.top + rect.height * 0.62) / window.innerHeight;

      // Burst 1: Upward central fountain
      confetti({
        particleCount: 55,
        angle: 90,
        spread: 75,
        origin: { x: originX, y: originY },
        colors: [ticketColor, '#FFB7B2', '#FFEAA7', '#B5EAD7', '#BAE6FD', '#FBCFE8', '#FDE047'],
        gravity: 0.85,
        scalar: 1.15,
        ticks: 170,
      });

      // Burst 2: Side sparkle wings
      setTimeout(() => {
        confetti({
          particleCount: 30,
          angle: 65,
          spread: 45,
          origin: { x: originX - 0.04, y: originY },
          colors: ['#FF9AA2', '#FDE047', '#34D399', '#BAE6FD'],
          ticks: 140,
        });
        confetti({
          particleCount: 30,
          angle: 115,
          spread: 45,
          origin: { x: originX + 0.04, y: originY },
          colors: ['#C4B5FD', '#FBCFE8', '#38BDF8', '#FFEAA7'],
          ticks: 140,
        });
      }, 100);
    }

    // 3. Trigger DOM sparkle shockwave rings
    setShowSparkleRings(true);
    setTimeout(() => setShowSparkleRings(false), 1200);
  }, []);

  // Handle Ball Extraction Animation
  useEffect(() => {
    if (selectedTicketToExtract && !isSpinning) {
      setExtractedBallAnim({
        ticket: selectedTicketToExtract,
        progress: 0,
      });
      sound.playBallDrop();

      let p = 0;
      let particleFired = false;

      const interval = setInterval(() => {
        p += 0.038;

        // Fire particle burst when the ball arrives at the chute bowl
        if (p >= 0.42 && !particleFired) {
          particleFired = true;
          triggerParticleExplosion(selectedTicketToExtract.color);
        }

        if (p >= 1) {
          clearInterval(interval);
          setExtractedBallAnim(null);
          onBallExtracted(selectedTicketToExtract);
        } else {
          setExtractedBallAnim({
            ticket: selectedTicketToExtract,
            progress: p,
          });
        }
      }, 25);

      return () => clearInterval(interval);
    }
  }, [selectedTicketToExtract, isSpinning, onBallExtracted, triggerParticleExplosion]);

  // Synchronize 3D balls with tickets array
  useEffect(() => {
    const ballsContainer = ballsContainerRef.current;
    if (!ballsContainer) return;

    // Clean existing meshes
    while (ballsContainer.children.length > 0) {
      const obj = ballsContainer.children[0] as THREE.Mesh;
      if (obj.geometry) obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else if (obj.material) {
        obj.material.dispose();
      }
      ballsContainer.remove(obj);
    }

    const ballRadius = isFullscreen ? 0.38 : 0.34;
    const sphereGeo = new THREE.SphereGeometry(ballRadius, 24, 24);

    const newBalls: PhysicsBall3D[] = tickets.map((t, index) => {
      const ballColor = new THREE.Color(t.color || '#FFB7B2');

      const ballMat = new THREE.MeshStandardMaterial({
        color: ballColor,
        roughness: 0.25,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(sphereGeo, ballMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Small central badge on sphere
      const badgeGeo = new THREE.CircleGeometry(ballRadius * 0.45, 16);
      const badgeMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
      });
      const badge = new THREE.Mesh(badgeGeo, badgeMat);
      badge.position.z = ballRadius + 0.01;
      mesh.add(badge);

      // Random starting positions inside drum volume
      const angle = (index / Math.max(tickets.length, 1)) * Math.PI * 2 + Math.random();
      const dist = Math.random() * 1.2;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist - 0.2;
      const z = (Math.random() - 0.5) * 1.5;

      mesh.position.set(x, y, z);
      ballsContainer.add(mesh);

      return {
        id: t.id,
        ticket: t,
        mesh,
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
        vz: (Math.random() - 0.5) * 0.05,
        radius: ballRadius,
      };
    });

    ballsDataRef.current = newBalls;
  }, [tickets, isFullscreen]);

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = isFullscreen ? 620 : 520;
    const height = isFullscreen ? 500 : 420;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 7.8);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Cheerful Pastel Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xfff7ed, 0xe0e7ff, 0.8);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xffd1dc, 1.2, 12);
    fillLight.position.set(-4, 3, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xbae6fd, 1.0);
    rimLight.position.set(0, -3, -4);
    scene.add(rimLight);

    // 4. Ground Podium & Contact Shadow
    const baseGroup = new THREE.Group();
    scene.add(baseGroup);

    // Layer 1: Rounded bottom base
    const baseMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(themeStyle.baseColor || '#FDE047'),
      roughness: 0.35,
      metalness: 0.1,
    });

    const basePlatformGeo = new THREE.CylinderGeometry(2.8, 3.1, 0.35, 36);
    const basePlatform = new THREE.Mesh(basePlatformGeo, baseMat);
    basePlatform.position.y = -2.3;
    basePlatform.receiveShadow = true;
    baseGroup.add(basePlatform);

    // Layer 2: Pastel candy rim ring
    const rimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(themeStyle.drumRing || '#F9A8D4'),
      roughness: 0.2,
      metalness: 0.2,
    });
    const rimRingGeo = new THREE.TorusGeometry(2.82, 0.12, 16, 40);
    const rimRing = new THREE.Mesh(rimRingGeo, rimMat);
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = -2.12;
    baseGroup.add(rimRing);

    // Contact shadow beneath
    const shadowGeo = new THREE.PlaneGeometry(6.5, 4.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x332244,
      transparent: true,
      opacity: 0.18,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.48;
    baseGroup.add(shadowPlane);

    // 5. Vertical Tripod / A-Frame Struts
    const strutMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(themeStyle.standColor || '#F472B6'),
      roughness: 0.3,
      metalness: 0.2,
    });

    const strutGeo = new THREE.CylinderGeometry(0.14, 0.18, 3.6, 20);

    // Left strut
    const leftStrut = new THREE.Mesh(strutGeo, strutMat);
    leftStrut.position.set(-2.2, -0.4, 0);
    leftStrut.rotation.z = -0.15;
    leftStrut.castShadow = true;
    baseGroup.add(leftStrut);

    // Right strut
    const rightStrut = new THREE.Mesh(strutGeo, strutMat);
    rightStrut.position.set(2.2, -0.4, 0);
    rightStrut.rotation.z = 0.15;
    rightStrut.castShadow = true;
    baseGroup.add(rightStrut);

    // Strut candy caps
    const capGeo = new THREE.SphereGeometry(0.28, 20, 20);
    const leftCap = new THREE.Mesh(capGeo, rimMat);
    leftCap.position.set(-2.0, 1.25, 0);
    baseGroup.add(leftCap);

    const rightCap = new THREE.Mesh(capGeo, rimMat);
    rightCap.position.set(2.0, 1.25, 0);
    baseGroup.add(rightCap);

    // 6. Rotating Drum Group (The Bolillero Cage)
    const drumGroup = new THREE.Group();
    drumGroup.position.set(0, 0.5, 0);
    scene.add(drumGroup);
    drumGroupRef.current = drumGroup;

    const drumRadius = 1.95;
    const drumLength = 2.6;

    // Drum Glass / Crystal Cylinder
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.88,
      opacity: 1,
      transparent: true,
      roughness: 0.12,
      ior: 1.45,
      thickness: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const drumCylinderGeo = new THREE.CylinderGeometry(drumRadius, drumRadius, drumLength, 32, 1, true);
    drumCylinderGeo.rotateZ(Math.PI / 2);
    const drumCylinder = new THREE.Mesh(drumCylinderGeo, glassMat);
    drumGroup.add(drumCylinder);

    // Metallic Pastel Rings & Endcaps
    const endRingGeo = new THREE.TorusGeometry(drumRadius, 0.08, 16, 40);
    endRingGeo.rotateY(Math.PI / 2);

    const leftRing = new THREE.Mesh(endRingGeo, rimMat);
    leftRing.position.x = -drumLength / 2;
    drumGroup.add(leftRing);

    const rightRing = new THREE.Mesh(endRingGeo, rimMat);
    rightRing.position.x = drumLength / 2;
    drumGroup.add(rightRing);

    const centerRing = new THREE.Mesh(endRingGeo, rimMat);
    centerRing.position.x = 0;
    drumGroup.add(centerRing);

    // Longitudinal Ribs across cylinder
    const ribGeo = new THREE.CylinderGeometry(0.04, 0.04, drumLength, 12);
    ribGeo.rotateZ(Math.PI / 2);

    const numRibs = 14;
    for (let i = 0; i < numRibs; i++) {
      const a = (i * Math.PI * 2) / numRibs;
      const rib = new THREE.Mesh(ribGeo, rimMat);
      rib.position.set(0, Math.sin(a) * drumRadius, Math.cos(a) * drumRadius);
      drumGroup.add(rib);
    }

    // Interior tumbling paddles
    const paddleGeo = new THREE.BoxGeometry(drumLength * 0.85, 0.06, 0.45);
    const paddleMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(themeStyle.drumRing || '#F9A8D4'),
      roughness: 0.3,
      metalness: 0.1,
    });

    const paddle1 = new THREE.Mesh(paddleGeo, paddleMat);
    paddle1.position.set(0, drumRadius * 0.7, 0);
    drumGroup.add(paddle1);

    const paddle2 = new THREE.Mesh(paddleGeo, paddleMat);
    paddle2.position.set(0, -drumRadius * 0.7, 0);
    drumGroup.add(paddle2);

    // 7. Hand Crank
    const crankGroup = new THREE.Group();
    crankGroup.position.set(drumLength / 2 + 0.35, 0.5, 0);
    scene.add(crankGroup);
    crankGroupRef.current = crankGroup;

    // Axle
    const axleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 16);
    axleGeo.rotateZ(Math.PI / 2);
    const axleMesh = new THREE.Mesh(axleGeo, rimMat);
    crankGroup.add(axleMesh);

    // Crank arm
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 16);
    const armMesh = new THREE.Mesh(armGeo, strutMat);
    armMesh.position.set(0.2, 0.4, 0);
    crankGroup.add(armMesh);

    // Crank colorful knob
    const knobGeo = new THREE.SphereGeometry(0.24, 20, 20);
    const knobMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(themeStyle.baseColor || '#FDE047'),
      roughness: 0.2,
    });
    const knobMesh = new THREE.Mesh(knobGeo, knobMat);
    knobMesh.position.set(0.35, 0.85, 0);
    crankGroup.add(knobMesh);

    // 8. Chute & Catch Dish at bottom
    const chuteMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(themeStyle.drumRim || '#FBCFE8'),
      roughness: 0.3,
    });

    // Funnel pipe
    const chuteGeo = new THREE.CylinderGeometry(0.45, 0.6, 0.7, 20);
    const chute = new THREE.Mesh(chuteGeo, chuteMat);
    chute.position.set(0, -1.6, 0.8);
    chute.rotation.x = 0.35;
    baseGroup.add(chute);

    // Dish bowl
    const bowlGeo = new THREE.CylinderGeometry(0.9, 0.7, 0.35, 24);
    const bowl = new THREE.Mesh(bowlGeo, rimMat);
    bowl.position.set(0, -1.95, 1.2);
    baseGroup.add(bowl);

    // 9. Floating Decorative 3D Stars (bobbing in air)
    const starsGroup = new THREE.Group();
    scene.add(starsGroup);
    starsGroupRef.current = starsGroup;

    const createStarShape = () => {
      const shape = new THREE.Shape();
      const points = 5;
      const outerR = 0.28;
      const innerR = 0.14;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i * Math.PI) / points - Math.PI / 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      return shape;
    };

    const starGeo = new THREE.ExtrudeGeometry(createStarShape(), {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
    });

    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffe066,
      roughness: 0.2,
      metalness: 0.2,
    });

    const starPositions = [
      [-2.4, 2.2, 0.4],
      [2.5, 2.4, -0.2],
      [-1.8, 2.8, -0.6],
      [1.7, 2.9, 0.5],
      [0.0, 3.1, 0.0],
    ];

    starPositions.forEach(([sx, sy, sz]) => {
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.set(sx, sy, sz);
      star.rotation.z = Math.random() * Math.PI;
      starsGroup.add(star);
    });

    // 10. Container for Balls
    const ballsContainer = new THREE.Group();
    ballsContainer.position.set(0, 0.5, 0);
    scene.add(ballsContainer);
    ballsContainerRef.current = ballsContainer;

    // 11. Three.js 3D Celebratory Sparkle Particles Fountain
    const particleCount = 130;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const colArray = new Float32Array(particleCount * 3);
    const sizeArray = new Float32Array(particleCount);
    const pData: ParticleData3D[] = [];

    // Procedural glowing star / flare texture
    const createSparkleCanvasTexture = () => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d')!;

      // Glowing flare center
      const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 28);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.25, 'rgba(255, 240, 160, 0.95)');
      grad.addColorStop(0.65, 'rgba(255, 180, 220, 0.5)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      // Star sparkle cross
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(32, 4);
      ctx.lineTo(32, 60);
      ctx.moveTo(4, 32);
      ctx.lineTo(60, 32);
      ctx.stroke();

      return new THREE.CanvasTexture(c);
    };

    for (let i = 0; i < particleCount; i++) {
      // Hidden below floor initially
      posArray[i * 3] = 0;
      posArray[i * 3 + 1] = -10;
      posArray[i * 3 + 2] = 0;

      colArray[i * 3] = 1;
      colArray[i * 3 + 1] = 0.9;
      colArray[i * 3 + 2] = 0.5;

      sizeArray[i] = 0;

      pData.push({
        x: 0,
        y: -10,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        r: 1,
        g: 1,
        b: 1,
        life: 0,
        maxLife: 60,
        size: 0.35,
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colArray, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

    const particleMat = new THREE.PointsMaterial({
      size: isFullscreen ? 0.42 : 0.35,
      map: createSparkleCanvasTexture(),
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);
    particlePointsRef.current = particlePoints;
    particlesDataRef.current = pData;
    particlePositionsRef.current = posArray;
    particleColorsRef.current = colArray;
    particleSizesRef.current = sizeArray;

    // Animation Render Loop
    let animId: number;
    let lastTumbleTime = 0;

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);

      // Smooth acceleration / deceleration
      const speedDiff = targetSpeedRef.current - drumSpeedRef.current;
      drumSpeedRef.current += speedDiff * 0.04;
      drumAngleRef.current += drumSpeedRef.current;

      const currentSpeed = Math.abs(drumSpeedRef.current);

      // Sound sync during spinning
      if (currentSpeed > 0.035 && time - lastTumbleTime > 115 / (currentSpeed * 4)) {
        sound.playTumbleClick(0.9 + Math.random() * 0.3);
        lastTumbleTime = time;
      }

      // Rotate drum
      if (drumGroupRef.current) {
        drumGroupRef.current.rotation.x = drumAngleRef.current;
      }

      // Rotate crank
      if (crankGroupRef.current) {
        crankGroupRef.current.rotation.x = drumAngleRef.current;
      }

      // Bob floating stars
      if (starsGroupRef.current) {
        starsGroupRef.current.children.forEach((star, i) => {
          star.rotation.z += 0.015 * (i % 2 === 0 ? 1 : -1);
          star.position.y += Math.sin(time * 0.003 + i) * 0.0015;
        });
      }

      // Update physical balls inside drum
      const balls = ballsDataRef.current;
      const gravity = -0.012;
      const bRadius = drumRadius - 0.35;
      const bLen = drumLength / 2 - 0.35;

      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];

        // Apply gravity
        b.vy += gravity;

        // Centrifugal lift from rotating paddles
        const distFromCenter = Math.sqrt(b.y * b.y + b.z * b.z);
        if (distFromCenter > bRadius * 0.4 && currentSpeed > 0.02) {
          const tangentY = -b.z / (distFromCenter || 1);
          const tangentZ = b.y / (distFromCenter || 1);
          const push = drumSpeedRef.current * 0.18 * (distFromCenter / bRadius);
          b.vy += tangentY * push;
          b.vz += tangentZ * push;
        }

        // Damping
        b.vx *= 0.985;
        b.vy *= 0.985;
        b.vz *= 0.985;

        // Move
        b.x += b.vx;
        b.y += b.vy;
        b.z += b.vz;

        // Cylinder radial constraint (Y and Z)
        const rad = Math.sqrt(b.y * b.y + b.z * b.z);
        if (rad > bRadius) {
          const ny = b.y / rad;
          const nz = b.z / rad;
          b.y = ny * bRadius;
          b.z = nz * bRadius;

          const dot = b.vy * ny + b.vz * nz;
          b.vy = (b.vy - 1.6 * dot * ny) * 0.7;
          b.vz = (b.vz - 1.6 * dot * nz) * 0.7;
        }

        // Cylinder length constraint (X axis)
        if (Math.abs(b.x) > bLen) {
          b.x = Math.sign(b.x) * bLen;
          b.vx = -b.vx * 0.7;
        }

        // Ball-to-ball collisions
        for (let j = i + 1; j < balls.length; j++) {
          const b2 = balls[j];
          const dx = b2.x - b.x;
          const dy = b2.y - b.y;
          const dz = b2.z - b.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const minDist = b.radius + b2.radius;

          if (dist < minDist && dist > 0.001) {
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;
            const nz = dz / dist;

            b.x -= nx * overlap;
            b.y -= ny * overlap;
            b.z -= nz * overlap;
            b2.x += nx * overlap;
            b2.y += ny * overlap;
            b2.z += nz * overlap;

            const kx = b.vx - b2.vx;
            const ky = b.vy - b2.vy;
            const kz = b.vz - b2.vz;
            const p = nx * kx + ny * ky + nz * kz;

            b.vx -= p * nx * 0.6;
            b.vy -= p * ny * 0.6;
            b.vz -= p * nz * 0.6;
            b2.vx += p * nx * 0.6;
            b2.vy += p * ny * 0.6;
            b2.vz += p * nz * 0.6;
          }
        }

        // Update mesh position
        b.mesh.position.set(b.x, b.y, b.z);
        b.mesh.rotation.x += b.vz * 0.5 + drumSpeedRef.current * 0.8;
        b.mesh.rotation.y += b.vx * 0.5;
      }

      // Update 3D Celebratory Sparkle Particles
      const particles = particlesDataRef.current;
      const posAttr = particlePositionsRef.current;
      const colAttr = particleColorsRef.current;
      let hasActiveParticles = false;

      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        if (pt.life > 0) {
          hasActiveParticles = true;
          pt.life--;

          // Physics: gravity + drag + wobble
          pt.vy -= 0.0048; // Gravity pulling downward
          pt.vx *= 0.985;
          pt.vz *= 0.985;

          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.z += pt.vz;

          const progress = 1 - pt.life / pt.maxLife;
          const alpha = Math.sin(progress * Math.PI); // Smooth fade in and out

          if (posAttr && colAttr) {
            posAttr[i * 3] = pt.x;
            posAttr[i * 3 + 1] = pt.y;
            posAttr[i * 3 + 2] = pt.z;

            colAttr[i * 3] = pt.r * alpha;
            colAttr[i * 3 + 1] = pt.g * alpha;
            colAttr[i * 3 + 2] = pt.b * alpha;
          }
        } else if (posAttr) {
          // Park away
          posAttr[i * 3 + 1] = -10;
        }
      }

      if (particlePointsRef.current && hasActiveParticles) {
        particlePointsRef.current.geometry.attributes.position.needsUpdate = true;
        particlePointsRef.current.geometry.attributes.color.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [themeStyle, isFullscreen]);

  // Drag crank or drum to spin manually
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dy = e.clientY - lastPointerPosRef.current.y;
    const dx = e.clientX - lastPointerPosRef.current.x;
    const delta = (dx - dy) * 0.0035;

    drumSpeedRef.current += delta;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return (
    <div className="flex flex-col items-center justify-center relative select-none w-full max-w-2xl mx-auto">
      {/* 3D WebGL Canvas Container */}
      <div
        className="relative group cursor-grab active:cursor-grabbing touch-none transition-transform"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        title="¡Haz clic y arrastra para girar la manivela 3D!"
      >
        <div ref={mountRef} className="flex justify-center items-center drop-shadow-2xl" />

        {/* 3D Ball Falling Animation Overlay with Particle Glow */}
        {extractedBallAnim && (
          <div
            className="absolute z-20 pointer-events-none transition-all flex items-center justify-center"
            style={{
              left: '50%',
              top: `${(isFullscreen ? 280 : 250) + extractedBallAnim.progress * 85}px`,
              transform: `translate(-50%, -50%) scale(${1 + extractedBallAnim.progress * 0.5}) rotate(${extractedBallAnim.progress * 420}deg)`,
            }}
          >
            <div
              className="w-16 h-16 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.25)] flex items-center justify-center font-extrabold text-white border-4 border-white relative"
              style={{
                backgroundColor: extractedBallAnim.ticket.color,
                boxShadow: `0 8px 30px ${extractedBallAnim.ticket.color}cc, 0 0 25px #ffffff`,
              }}
            >
              <span className="text-xl font-bold font-serif">?</span>

              {/* Trailing sparkle badges */}
              <span className="absolute -top-3 -right-3 text-lg animate-bounce select-none">✨</span>
              <span className="absolute -bottom-2 -left-3 text-base animate-pulse select-none">⭐</span>
            </div>
          </div>
        )}

        {/* CELEBRATORY SPARKLE SHOCKWAVE BURST OVER TOMBOLA CHUTE */}
        {showSparkleRings && (
          <div
            className="absolute z-30 pointer-events-none flex items-center justify-center"
            style={{
              left: '50%',
              top: isFullscreen ? '72%' : '70%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Expanding pulse wave */}
            <div className="w-24 h-24 rounded-full border-4 border-amber-300 animate-ping opacity-75" />
            <div className="absolute w-36 h-36 rounded-full border-2 border-pink-300 animate-ping opacity-50" />

            {/* Exploding star emojis radiating outward */}
            <span className="absolute -top-12 -left-12 text-2xl animate-bounce select-none">⭐</span>
            <span className="absolute -top-14 right-10 text-2xl animate-spin select-none">✨</span>
            <span className="absolute bottom-2 -left-14 text-2xl animate-pulse select-none">🌟</span>
            <span className="absolute bottom-2 right-12 text-2xl animate-bounce select-none">💖</span>
            <span className="absolute -top-6 text-2xl animate-pulse select-none">💫</span>
          </div>
        )}
      </div>

      {/* Big Friendly Cartoon Action Button */}
      <div className="mt-2 flex flex-col items-center gap-2.5 w-full px-4">
        <button
          onClick={onSpinStart}
          disabled={isSpinning || tickets.length === 0}
          className={`w-full max-w-md py-4 px-6 rounded-3xl font-extrabold text-xl md:text-2xl tracking-wide transition-all duration-200 flex items-center justify-center gap-3 transform active:translate-y-1.5 active:shadow-none ${
            tickets.length === 0
              ? 'bg-slate-300 text-slate-500 shadow-none cursor-not-allowed'
              : isSpinning
              ? 'bg-pink-300 text-white animate-pulse shadow-[0_4px_0_#f472b6] cursor-wait'
              : `${themeStyle.accent} ${themeStyle.accentText} hover:scale-[1.02] cursor-pointer`
          }`}
          style={{ fontFamily: "'Fredoka Variable', 'Outfit Variable', sans-serif" }}
        >
          {isSpinning ? (
            <>
              <svg className="animate-spin h-7 w-7 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>¡Mezclando Esferas Mágicas! ✨</span>
            </>
          ) : tickets.length === 0 ? (
            <span>No hay boletos en la tómbola</span>
          ) : (
            <>
              <span className="text-2xl animate-bounce">🎲</span>
              <span>¡Girar Tómbola Mágica!</span>
              <span className="text-2xl">✨</span>
            </>
          )}
        </button>

        {/* Playful hint badge */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white/70 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-pink-100">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span>{tickets.length} esferas de colores listas en la tómbola</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>¡Puedes arrastrar la manivela 3D!</span>
        </div>
      </div>
    </div>
  );
};
