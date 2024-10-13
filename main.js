import "./style.css";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Scene initialization
const initScene = () => new THREE.Scene();

// Camera initialization
const initCamera = () => {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  return camera;
};

// Renderer initialization
const initRenderer = () => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const maxWidth = 1920;
  const maxHeight = 1080;
  
  const width = Math.min(window.innerWidth, maxWidth);
  const height = Math.min(window.innerHeight, maxHeight);
  
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio > 1 ? window.devicePixelRatio : 1);
  document.body.appendChild(renderer.domElement);
  return renderer;
};


// Composer initialization for postprocessing
const initComposer = (renderer, scene, camera) => {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass();
  bloomPass.strength = 0.25;
  bloomPass.radius = 0.2;
  bloomPass.threshold = 0.1;
  composer.addPass(bloomPass);

  return composer;
};

// Utility to convert degrees to radians
const degreesToRads = (degrees) => degrees * (Math.PI / 180);

// Create background plane
const createBackground = () => {
  const geometry = new THREE.PlaneGeometry(50, 50);
  const material = new THREE.MeshBasicMaterial({ color: 0x161616 });
  const background = new THREE.Mesh(geometry, material);
  background.position.z = -5;
  return background;
};

// Create Rubik's cube with rounded boxes
const createCube = () => {
  const cubeSize = 1;
  const spacing = 0.1;
  const radius = 0.1;
  const segments = 4;
  const colors = {
    front: 0xff0000,
    back: 0xff5000,
    top: 0xffffff,
    bottom: 0xffff00,
    left: 0x00ff00,
    right: 0x0000ff,
    dark: 0x161616,
  };
  
  const cubeGroup = new THREE.Group();
  
  // Generate small cubes
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const materials = [
          new THREE.MeshBasicMaterial({ color: x !== 1 ? colors.dark : colors.front }),
          new THREE.MeshBasicMaterial({ color: x !== -1 ? colors.dark : colors.back }),
          new THREE.MeshBasicMaterial({ color: y !== 1 ? colors.dark : colors.top }),
          new THREE.MeshBasicMaterial({ color: y !== -1 ? colors.dark : colors.bottom }),
          new THREE.MeshBasicMaterial({ color: z !== 1 ? colors.dark : colors.left }),
          new THREE.MeshBasicMaterial({ color: z !== -1 ? colors.dark : colors.right }),
        ];

        const smallCube = new THREE.Mesh(
          new RoundedBoxGeometry(cubeSize, cubeSize, cubeSize, segments, radius),
          materials
        );

        smallCube.position.set(
          x * (cubeSize + spacing),
          y * (cubeSize + spacing),
          z * (cubeSize + spacing)
        );
        cubeGroup.add(smallCube);
      }
    }
  }
  return cubeGroup;
};

// Rotation animation handling
let isAnimating = false;
const animationQueue = [];
const stepCount = 10;

// Function to rotate face cubes
const rotateFaceCubes = (axis, direction, faceCheck, cubeGroup) => {
  if (isAnimating) return;

  const faceCubes = cubeGroup.children.filter(cube => faceCheck(cube.position));
  const rotationPerStep = degreesToRads(90) * direction / stepCount;
  const rotationAxis = new THREE.Vector3(...['x', 'y', 'z'].map(a => (a === axis ? 1 : 0)));

  let currentStep = 0;

  const animateRotation = () => {
    if (currentStep < stepCount) {
      const rotationMatrixStep = new THREE.Matrix4().makeRotationAxis(rotationAxis, rotationPerStep);
      faceCubes.forEach(cube => cube.applyMatrix4(rotationMatrixStep));
      currentStep++;
      requestAnimationFrame(animateRotation);
    } else {
      isAnimating = false;
      if (animationQueue.length > 0) animationQueue.shift()();
    }
  };

  animationQueue.push(() => {
    isAnimating = true;
    animateRotation();
  });

  if (!isAnimating) animationQueue.shift()();
};

let autoRotateInterval = null;

// Function for random face rotation
const randomRotateFaceCube = (cubeGroup) => {
  const rotationMapping = [
    { axis: 'z', direction: 1, check: pos => pos.z > 1 },   // Front face clockwise
    { axis: 'z', direction: -1, check: pos => pos.z > 1 },  // Front face counterclockwise
    { axis: 'y', direction: -1, check: pos => pos.y > 1 },  // Up face clockwise
    { axis: 'y', direction: 1, check: pos => pos.y > 1 },   // Up face counterclockwise
    { axis: 'x', direction: 1, check: pos => pos.x > 1 },   // Right face clockwise
    { axis: 'x', direction: -1, check: pos => pos.x > 1 },  // Right face counterclockwise
    { axis: 'z', direction: -1, check: pos => pos.z < -1 }, // Back face clockwise
    { axis: 'z', direction: 1, check: pos => pos.z < -1 },  // Back face counterclockwise
    { axis: 'y', direction: 1, check: pos => pos.y < -1 },  // Down face clockwise
    { axis: 'y', direction: -1, check: pos => pos.y < -1 }, // Down face counterclockwise
    { axis: 'x', direction: -1, check: pos => pos.x < -1 }, // Left face clockwise
    { axis: 'x', direction: 1, check: pos => pos.x < -1 },  // Left face counterclockwise
  ];

  const randomRotation = rotationMapping[Math.floor(Math.random() * rotationMapping.length)];
  rotateFaceCubes(randomRotation.axis, randomRotation.direction, randomRotation.check, cubeGroup);
};

// Function to start auto rotation
const startAutoRotation = (cubeGroup) => {
  autoRotateInterval = setInterval(() => {
    randomRotateFaceCube(cubeGroup);
  }, 500); 
};

// Function to stop auto rotation
const stopAutoRotation = () => {
  clearInterval(autoRotateInterval);
  autoRotateInterval = null;
};

// Key press handling function
const handleKeyPress = (cubeGroup, camera) => (event) => {
  const rotationMapping = {
    'f': () => rotateFaceCubes('z', 1, pos => pos.z > 1, cubeGroup),   // Front face clockwise
    'F': () => rotateFaceCubes('z', -1, pos => pos.z > 1, cubeGroup),  // Front face counterclockwise
    'u': () => rotateFaceCubes('y', -1, pos => pos.y > 1, cubeGroup),  // Up face clockwise
    'U': () => rotateFaceCubes('y', 1, pos => pos.y > 1, cubeGroup),   // Up face counterclockwise
    'r': () => rotateFaceCubes('x', 1, pos => pos.x > 1, cubeGroup),   // Right face clockwise
    'R': () => rotateFaceCubes('x', -1, pos => pos.x > 1, cubeGroup),  // Right face counterclockwise
    'b': () => rotateFaceCubes('z', -1, pos => pos.z < -1, cubeGroup), // Back face clockwise
    'B': () => rotateFaceCubes('z', 1, pos => pos.z < -1, cubeGroup),  // Back face counterclockwise
    'd': () => rotateFaceCubes('y', 1, pos => pos.y < -1, cubeGroup),  // Down face clockwise
    'D': () => rotateFaceCubes('y', -1, pos => pos.y < -1, cubeGroup), // Down face counterclockwise
    'l': () => rotateFaceCubes('x', -1, pos => pos.x < -1, cubeGroup), // Left face clockwise
    'L': () => rotateFaceCubes('x', 1, pos => pos.x < -1, cubeGroup),  // Left face counterclockwise
    'a': () => {
      if (autoRotateInterval) {
        stopAutoRotation();
      } else {
        startAutoRotation(cubeGroup);
      }
    },
  };

  const cubeRotationMapping = {
    ArrowUp: () => cubeGroup.rotation.x -= degreesToRads(10),    // Rotate entire cube up
    ArrowDown: () => cubeGroup.rotation.x += degreesToRads(10),  // Rotate entire cube down
    ArrowLeft: () => cubeGroup.rotation.y -= degreesToRads(10),  // Rotate entire cube left
    ArrowRight: () => cubeGroup.rotation.y += degreesToRads(10), // Rotate entire cube right
  };

  if (rotationMapping[event.key]) {
    rotationMapping[event.key]();
  } else if (cubeRotationMapping[event.key]) {
    cubeRotationMapping[event.key]();
  } else if (event.key === '0') {
    resetCameraView(camera, cubeGroup);
  }
};

// Reset camera view
const resetCameraView = (camera, cubeGroup) => {
  camera.position.set(0, 0, 6);
  cubeGroup.rotation.set(degreesToRads(30), degreesToRads(45), 0);
  camera.lookAt(0, 0, 0);
};

// Initialize scene, camera, renderer, and composer
const scene = initScene();
const camera = initCamera();
const renderer = initRenderer();
const composer = initComposer(renderer, scene, camera);

// Add elements to scene
scene.add(createBackground());
const rubiksCube = createCube();
scene.add(rubiksCube);

// Setup event listener for key presses
document.addEventListener('keydown', handleKeyPress(rubiksCube, camera));

// Reset camera view initially
resetCameraView(camera, rubiksCube);

// Animation loop
const animate = (composer) => {
  requestAnimationFrame(() => animate(composer));
  composer.render();
};

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate(composer);
