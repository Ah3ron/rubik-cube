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
const backgroundMaterial = new THREE.MeshBasicMaterial({ color: 0x161616 }); // Цвет фона
const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
backgroundMesh.rotation.x = 0; // Повернуть плоскость, чтобы она была горизонтальной
backgroundMesh.position.z = -5; // Позиция плоскости
scene.add(backgroundMesh);

// Enable anti-aliasing
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Use high DPI displays
document.body.appendChild(renderer.domElement);

// Set up post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass();
bloomPass.strength = 0.33; // Bloom intensity
bloomPass.radius = 0.3; // Bloom spread
bloomPass.threshold = 0.1; // Bloom threshold
composer.addPass(bloomPass);

function degreesToRads(degrees) {
  return degrees * (Math.PI / 180.0);
}

// Create a 3D Rubik's Cube
const createCube = () => {
  const cubeSize = 1;
  const spacing = 0.1; // Spacing between small cubes
  const colors = {
    front: 0xff0000, // Red
    back: 0xff5000, // Orange
    top: 0xffffff, // White
    bottom: 0xffff00, // Yellow
    left: 0x00ff00, // Green
    right: 0x0000ff, // Blue
    gray: 0x161616 // Gray for touching faces
  };
  const cube = new THREE.Group();

  // Create the small cubes for the Rubik's Cube
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const materials = [
          new THREE.MeshBasicMaterial({ color: (x !== 1) ? colors.gray : colors.front }), // Front
          new THREE.MeshBasicMaterial({ color: (x !== -1) ? colors.gray : colors.back }), // Back
          new THREE.MeshBasicMaterial({ color: (y !== 1) ? colors.gray : colors.top }), // Top
          new THREE.MeshBasicMaterial({ color: (y !== -1) ? colors.gray : colors.bottom }), // Bottom
          new THREE.MeshBasicMaterial({ color: (z !== 1) ? colors.gray : colors.left }), // Left
          new THREE.MeshBasicMaterial({ color: (z !== -1) ? colors.gray : colors.right }) // Right
        ];
        const smallCube = new THREE.Mesh(geometry, materials);

        // Create edges geometry and material
        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }); // Black color
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);

        // Position the small cube
        smallCube.position.set(
          x * (cubeSize + spacing),
          y * (cubeSize + spacing),
          z * (cubeSize + spacing)
        );

        // Add small cube and its edges to the group
        cube.add(smallCube);
        cube.add(edges);
        edges.position.copy(smallCube.position); // Align edges with the small cube
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

// Animation loop
const animate = () => {
  requestAnimationFrame(animate);
  composer.render(); // Use composer to render the scene with effects
};

// Start animation
animate();

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight); // Update composer size
  renderer.setPixelRatio(window.devicePixelRatio); // Update pixel ratio on resize
});

// Add event listener to rotate the cube with arrow keys
document.addEventListener("keydown", function (event) {
  const rotationSpeed = degreesToRads(10); // Rotation speed in radians
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
        const faceCubes = [];
      
        rubiksCube.children.forEach(cube => {
            if (cube.position.x < -1) {
                faceCubes.push(cube);
            }
        });
      
        const centerCube = faceCubes[8];
      
        const angle = degreesToRads(45);
        faceCubes.forEach((cube, index) => {
            if (index !== 8) {
                const offsetY = cube.position.y - centerCube.position.y;
                const offsetZ = cube.position.z - centerCube.position.z;
    
                cube.position.y = centerCube.position.y + (offsetY * Math.cos(angle) - offsetZ * Math.sin(angle));
                cube.position.z = centerCube.position.z + (offsetY * Math.sin(angle) + offsetZ * Math.cos(angle));
              }
              cube.rotation.x += angle;
        });
        break;
    

  }
});
