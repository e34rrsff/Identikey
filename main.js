import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20232a);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Basic lighting for materials that respond to light.
scene.add(new THREE.HemisphereLight(0xffffff, 0x555566, 2));

const keyLight = new THREE.DirectionalLight(0xffffff, 3);
keyLight.position.set(4, 8, 6);
scene.add(keyLight);

// Load the Blender-exported scene.
const loader = new GLTFLoader();

loader.load(
  "/models/scene.glb",
  (gltf) => {
    const model = gltf.scene;
    scene.add(model);

    // Center the camera controls on the imported scene and choose a
    // camera distance that fits the model.
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);

    controls.target.copy(center);
    camera.position.set(
      center.x + maxSize * 1.5,
      center.y + maxSize,
      center.z + maxSize * 1.5
    );
    camera.near = Math.max(maxSize / 1000, 0.01);
    camera.far = Math.max(maxSize * 100, 1000);
    camera.updateProjectionMatrix();
    controls.update();

    // Handy for checking that the file loaded and seeing its object names.
    model.traverse((object) => {
      if (object.isMesh) console.log("Mesh:", object.name || "(unnamed)");
    });

    // Optional: click a mesh to highlight it.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let selected = null;

    renderer.domElement.addEventListener("click", (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(model, true)[0];

      if (selected?.material?.emissive) {
        selected.material.emissive.setHex(0x000000);
      }

      selected = hit?.object ?? null;

      if (selected?.material?.emissive) {
        selected.material.emissive.setHex(0x334400);
      }

      if (selected) console.log("Selected:", selected.name || selected.type);
    });
  },
  undefined,
  (error) => {
    console.error("Could not load /models/scene.glb:", error);
  }
);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
