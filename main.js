import "./style.css";
import * as THREE from "https://esm.sh/three";
import { EffectComposer } from "https://esm.sh/three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://esm.sh/three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://esm.sh/three/examples/jsm/postprocessing/UnrealBloomPass.js";


// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Создание плоскости для фона
const backgroundGeometry = new THREE.PlaneGeometry(50, 50);
const backgroundMaterial = new THREE.MeshBasicMaterial({ color: 0x161616 });
const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
backgroundMesh.position.z = -5;
scene.add(backgroundMesh);

// Enable anti-aliasing
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Set up post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass();
bloomPass.strength = 0.33;
bloomPass.radius = 0.3;
bloomPass.threshold = 0.1;
composer.addPass(bloomPass);

function degreesToRads(degrees) {
  return degrees * (Math.PI / 180.0);
}

// Create a 3D Rubik's Cube
const createCube = () => {
  const cubeSize = 1;
  const spacing = 0.1;
  const colors = {
    front: 0xff0000,
    back: 0xff5000,
    top: 0xffffff,
    bottom: 0xffff00,
    left: 0x00ff00,
    right: 0x0000ff,
    gray: 0x161616
  };
  const cube = new THREE.Group();

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const materials = [
          new THREE.MeshBasicMaterial({ color: (x !== 1) ? colors.gray : colors.front }),
          new THREE.MeshBasicMaterial({ color: (x !== -1) ? colors.gray : colors.back }),
          new THREE.MeshBasicMaterial({ color: (y !== 1) ? colors.gray : colors.top }),
          new THREE.MeshBasicMaterial({ color: (y !== -1) ? colors.gray : colors.bottom }),
          new THREE.MeshBasicMaterial({ color: (z !== 1) ? colors.gray : colors.left }),
          new THREE.MeshBasicMaterial({ color: (z !== -1) ? colors.gray : colors.right })
        ];
        const smallCube = new THREE.Mesh(geometry, materials);

        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);

        smallCube.position.set(
          x * (cubeSize + spacing),
          y * (cubeSize + spacing),
          z * (cubeSize + spacing)
        );

        cube.add(smallCube);
        cube.add(edges);
        edges.position.copy(smallCube.position);
      }
    }
  }

  return cube;
};

const rubiksCube = createCube();
scene.add(rubiksCube);

// Set camera position
camera.position.z = 6;
rubiksCube.rotation.x = degreesToRads(30);
rubiksCube.rotation.y = degreesToRads(45);

// General rotation function for face cubes
function rotateFaceCubes(axis, direction, faceCheck) {
  const faceCubes = rubiksCube.children.filter(cube => faceCheck(cube.position));

  const centerCube = faceCubes[8];
  const angle = degreesToRads(45) * direction;

  faceCubes.forEach((cube, index) => {
      const offset = { x: cube.position.x - centerCube.position.x, y: cube.position.y - centerCube.position.y, z: cube.position.z - centerCube.position.z };

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Rotate around specified axis
      if (axis === 'x') {
        cube.position.y = centerCube.position.y + (offset.y * cosA - offset.z * sinA);
        cube.position.z = centerCube.position.z + (offset.y * sinA + offset.z * cosA);
        cube.rotation[axis] += angle;
      } else if (axis === 'y') {
        cube.position.x = centerCube.position.x + (offset.x * cosA - offset.z * sinA);
        cube.position.z = centerCube.position.z + (offset.x * sinA + offset.z * cosA);
        cube.rotation[axis] -= angle;
      } else if (axis === 'z') {
        cube.position.x = centerCube.position.x + (offset.x * cosA - offset.y * sinA);
        cube.position.y = centerCube.position.y + (offset.x * sinA + offset.y * cosA);
        cube.rotation[axis] += angle;
    }
  });
}

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
});

// Add event listener to rotate the cube with arrow keys
document.addEventListener("keydown", function (event) {
  const rotationSpeed = degreesToRads(10);
  switch (event.key) {
    case "ArrowUp":
      rubiksCube.rotation.x += rotationSpeed;
      break;
    case "ArrowDown":
      rubiksCube.rotation.x -= rotationSpeed;
      break;
    case "ArrowLeft":
      rubiksCube.rotation.y -= rotationSpeed;
      break;
    case "ArrowRight":
      rubiksCube.rotation.y += rotationSpeed;
      break;
    case "1":
      rotateFaceCubes('x', 1, pos => pos.x < -1);
      break;
    case "2":
      rotateFaceCubes('x', 1, pos => pos.x > 1);
      break;
    case "3":
      rotateFaceCubes('y', -1, pos => pos.y > 1);
      break;
    case "4":
      rotateFaceCubes('y', -1, pos => pos.y < -1);
      break;
    case "5":
      rotateFaceCubes('z', 1, pos => pos.z < -1);
      break;
    case "6":
      rotateFaceCubes('z', 1, pos => pos.z > 1);
      break;
  }
});

// Animation loop
const animate = () => {
  requestAnimationFrame(animate);
  composer.render();
};

// Start animation
animate();