import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
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
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
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

// Keyboard controls
const handleKeyPress = (cubeGroup, camera) => (event) => {
  const rotationMapping = {
    f: () => rotateFaceCubes('z', 1, (pos) => pos.z > 1, cubeGroup), // Front clockwise
    F: () => rotateFaceCubes('z', -1, (pos) => pos.z > 1, cubeGroup), // Front counterclockwise
    u: () => rotateFaceCubes('y', -1, (pos) => pos.y > 1, cubeGroup), // Up clockwise
    U: () => rotateFaceCubes('y', 1, (pos) => pos.y > 1, cubeGroup),  // Up counterclockwise
    r: () => rotateFaceCubes('x', 1, (pos) => pos.x > 1, cubeGroup),  // Right clockwise
    R: () => rotateFaceCubes('x', -1, (pos) => pos.x > 1, cubeGroup), // Right counterclockwise
    b: () => rotateFaceCubes('z', -1, (pos) => pos.z < -1, cubeGroup), // Back clockwise
    B: () => rotateFaceCubes('z', 1, (pos) => pos.z < -1, cubeGroup),  // Back counterclockwise
    d: () => rotateFaceCubes('y', 1, (pos) => pos.y < -1, cubeGroup),  // Down clockwise
    D: () => rotateFaceCubes('y', -1, (pos) => pos.y < -1, cubeGroup), // Down counterclockwise
    l: () => rotateFaceCubes('x', -1, (pos) => pos.x < -1, cubeGroup), // Left clockwise
    L: () => rotateFaceCubes('x', 1, (pos) => pos.x < -1, cubeGroup),  // Left counterclockwise
  };

  const cubeRotationMapping = {
    ArrowUp: () => (cubeGroup.rotation.x -= degreesToRads(10)),
    ArrowDown: () => (cubeGroup.rotation.x += degreesToRads(10)),
    ArrowLeft: () => (cubeGroup.rotation.y -= degreesToRads(10)),
    ArrowRight: () => (cubeGroup.rotation.y += degreesToRads(10)),
  };

  if (rotationMapping[event.key]) {
    rotationMapping[event.key]();
  } else if (cubeRotationMapping[event.key]) {
    cubeRotationMapping[event.key]();
  } else if (event.key === '0') {
    resetCameraView(camera, cubeGroup);
  }
};

// Reset camera and cube view
const resetCameraView = (camera, cubeGroup) => {
  camera.position.set(0, 0, 6);
  cubeGroup.rotation.set(degreesToRads(30), degreesToRads(45), 0);
  camera.lookAt(0, 0, 0);
};

// Main execution
const scene = initScene();
const camera = initCamera();
const renderer = initRenderer();
const composer = initComposer(renderer, scene, camera);

scene.add(createBackground());
const rubiksCube = createCube();
scene.add(rubiksCube);

document.addEventListener('keydown', handleKeyPress(rubiksCube, camera));
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

animate(composer);
