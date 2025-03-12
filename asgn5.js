import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

function main() {
  // RENDERER
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xaadfff, 90, 500);

  // SKYBOX
  {
    const cubeLoader = new THREE.CubeTextureLoader();
    const skyTexture = cubeLoader.load([
      'underwater.jpg', // +X
      'underwater.jpg', // -X
      'underwater.jpg', // +Y
      'underwater.jpg', // -Y
      'underwater.jpg', // +Z
      'underwater.jpg', // -Z
    ]);
    scene.background = skyTexture;
  }

  // CAMERAS
  // Perspective 
  const camera = new THREE.PerspectiveCamera(
    60, // fov
    window.innerWidth / window.innerHeight, // aspect
    0.1, // near
    800  // far
  );
  camera.position.set(0, 40, 150);

  // Overhead 
  const overheadCamera = new THREE.OrthographicCamera(-200, 200, 200, -200, 1, 1000);
  overheadCamera.position.set(0, 300, 0);
  overheadCamera.lookAt(0, 0, 0);

  let activeCamera = camera; 

  // ORBIT CONTROLS
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 10, 0);
  controls.update();

  // Hemisphere Light
  {
    const hemiLight = new THREE.HemisphereLight(0x88ccff, 0x226699, 0.9);
    scene.add(hemiLight);
  }

  // Directional Light 
  {
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(100, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left   = -300;
    dirLight.shadow.camera.right  =  300;
    dirLight.shadow.camera.top    =  300;
    dirLight.shadow.camera.bottom = -300;
    dirLight.shadow.mapSize.set(2048, 2048);
    scene.add(dirLight);
  }

  // Point Light
  {
    const pointLight = new THREE.PointLight(0xffffff, 1, 800);
    pointLight.position.set(-80, 80, 0);
    scene.add(pointLight);
  }

  // Ambient Light
  {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.0);
    scene.add(ambientLight);
  }

  // FLOOR
  {
    const loader = new THREE.TextureLoader();
    const sandTex = loader.load('sand.jpg');
    sandTex.wrapS = THREE.RepeatWrapping;
    sandTex.wrapT = THREE.RepeatWrapping;
    sandTex.repeat.set(10, 10);

    const planeGeo = new THREE.PlaneGeometry(600, 600);
    const planeMat = new THREE.MeshStandardMaterial({ map: sandTex });
    const floorMesh = new THREE.Mesh(planeGeo, planeMat);
    floorMesh.rotation.x = -Math.PI * 0.5;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
  }

  // BILLBOARD 
  function makeLabelCanvas(baseWidth, size, text) {
    const borderSize = 2;
    const ctx = document.createElement('canvas').getContext('2d');
    const font = `${size}px Arial`;
    ctx.font = font;

    const doubleBorderSize = borderSize * 2;
    const width  = baseWidth + doubleBorderSize;
    const height = size + doubleBorderSize;
    ctx.canvas.width  = width;
    ctx.canvas.height = height;

    // background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    ctx.fillStyle = 'white';
    ctx.fillText(text, width / 2, height / 2);

    return ctx.canvas;
  }

  function createBillboard(labelText, position) {
    const canvas = makeLabelCanvas(200, 32, labelText);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(spriteMat);

    const scaleFactor = 0.15;
    sprite.scale.set(canvas.width * scaleFactor, canvas.height * scaleFactor, 1);

    sprite.position.copy(position);
    scene.add(sprite);
    return sprite;
  }

  // TEXTURES 
  const texLoader = new THREE.TextureLoader();
  const seaweedTex = texLoader.load('seaweed.jpg');
  const coralTex   = texLoader.load('coral.jpg');
  const rockTex    = texLoader.load('rock.jpg');

  [seaweedTex, coralTex, rockTex].forEach((t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 1);
  });

  const seaweedMat = new THREE.MeshStandardMaterial({ map: seaweedTex });
  const coralMat   = new THREE.MeshStandardMaterial({ map: coralTex });
  const rockMat    = new THREE.MeshStandardMaterial({ map: rockTex });

  const ringMaterials = [seaweedMat, coralMat, rockMat];
  const shapeGeoms = [
    new THREE.BoxGeometry(6, 8, 8),
    new THREE.SphereGeometry(6, 16, 16),
    new THREE.ConeGeometry(6, 10, 8),
    new THREE.TorusGeometry(5, 1, 8, 16),
    new THREE.CylinderGeometry(4, 4, 8, 12),
  ];

  
  const coralArr = [];
  {
    const shapeCount = 20;
    const radius = 135;
    for (let i = 0; i < shapeCount; i++) {
      const geom = shapeGeoms[i % shapeGeoms.length];
      const mat  = ringMaterials[Math.floor(Math.random() * ringMaterials.length)];

      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const angle = (i / shapeCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      mesh.position.set(x, 0, z);

      const sc = 2 + Math.random() * 3;
      mesh.scale.set(sc, sc, sc);
      mesh.position.y = 1 + sc * 2.0; // above floor
      mesh.rotation.y = Math.random() * Math.PI * 2;

      scene.add(mesh);
      coralArr.push(mesh);
    }
  }

  
  const outerArr = [];
  {
    const shapeCount2 = 12;
    const radius2 = 220;
    for (let i = 0; i < shapeCount2; i++) {
      const geom = shapeGeoms[Math.floor(Math.random() * shapeGeoms.length)];
      const mat  = ringMaterials[Math.floor(Math.random() * ringMaterials.length)];

      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const angle = (i / shapeCount2) * Math.PI * 2;
      const offset = Math.random() * 20 - 10; 
      const x = Math.cos(angle) * (radius2 + offset);
      const z = Math.sin(angle) * (radius2 + offset);
      mesh.position.set(x, 0, z);

      const sc = 3 + Math.random() * 3;
      mesh.scale.set(sc, sc, sc);
      mesh.position.y = 2 + sc * 2.0;
      mesh.rotation.y = Math.random() * Math.PI * 2;

      scene.add(mesh);
      outerArr.push(mesh);
    }
  }

  // BUBBLES
  const bubblesGroup = new THREE.Group();
  scene.add(bubblesGroup);

  {
    const bubbleCount = 30;
    for (let i = 0; i < bubbleCount; i++) {
      const bubbleGeo = new THREE.SphereGeometry(2.5, 12, 12);
      const bubbleMat = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        emissive: 0x226699,
        transparent: true,
        opacity: 0.7,
      });
      const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);

      const range = 250;
      bubble.position.set(
        (Math.random() - 0.5) * range * 2,
        Math.random() * 5,
        (Math.random() - 0.5) * range * 2
      );

      bubble.castShadow = false;
      bubble.receiveShadow = false;
      bubblesGroup.add(bubble);
    }
  }

  //  FISH
  const gltfLoader = new GLTFLoader();
  let fishData = [];

  function loadFishGLB(fileName, scaleVal, count, labelText) {
    for (let i = 0; i < count; i++) {
      gltfLoader.load(
        fileName,
        (gltf) => {
          const root = gltf.scene;
          root.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          root.scale.set(scaleVal, scaleVal, scaleVal);

          root.position.set(
            (Math.random() - 0.5) * 200,
            10 + Math.random() * 30,
            (Math.random() - 0.5) * 200
          );
          scene.add(root);

          const spritePos = root.position.clone();
          spritePos.y += 12;
          const fishLabelSprite = createBillboard(labelText, spritePos);

          fishData.push({
            obj: root,
            angle: Math.random() * Math.PI * 2,
            speed: 0.2,
            radius: 40 + Math.random() * 60,
            height: root.position.y,
            labelSprite: fishLabelSprite,
          });
        },
        undefined,
        (err) => {
          console.error('Error loading fish glb:', fileName, err);
        }
      );
    }
  }

  loadFishGLB('fish1.glb', 3, 3, 'Nemo');
  loadFishGLB('fish2.glb', 0.5, 1, 'Tuna Fish');
  loadFishGLB('angler.glb', 12, 2, 'Angler Fish');

  
  let shipRoot = null;
  let shipLabelSprite = null;

  function labelTheShip() {
    if (!shipRoot || shipLabelSprite) return;
    const pos = shipRoot.position.clone();
    pos.y += 25;
    shipLabelSprite = createBillboard("Sunken Ship", pos);
  }
  //OBJ + MTL

  {
    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();

    mtlLoader.load('ship.mtl', (mtl) => {
      mtl.preload();
      for (const material of Object.values(mtl.materials)) {
        material.side = THREE.DoubleSide;
      }

      objLoader.setMaterials(mtl);
      objLoader.load('ship.obj', (root) => {
        root.scale.set(65, 35, 45);
        root.position.set(50, 15, -60);
        root.rotation.z = -Math.PI * 0.1;

        root.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(root);
        shipRoot = root;
      });
    });
  }

  {
    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();

    mtlLoader.load('treasure.mtl', (mtl) => {
      mtl.preload();
      for (const material of Object.values(mtl.materials)) {
        material.side = THREE.DoubleSide;
      }
      objLoader.setMaterials(mtl);

      objLoader.load('treasure.obj', (root) => {
        root.scale.set(55, 35, 35);
        root.position.set(0, 7, -40);

        root.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(root);

        const labelPos = root.position.clone();
        labelPos.y += 15;
        createBillboard("Hidden Treasure", labelPos);
      });
    });
  }

  // CAMERA SWITC
  window.addEventListener('keydown', (e) => {
    if (e.key === '1') {
      activeCamera = camera; // perspective
    } else if (e.key === '2') {
      activeCamera = overheadCamera;
    }
  });

  // WINDOW RESIZE
  function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    overheadCamera.left   = -200;
    overheadCamera.right  =  200;
    overheadCamera.top    =  200;
    overheadCamera.bottom = -200;
    overheadCamera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onWindowResize);

  // ANIMATION 
  let then = 0;
  function render(time) {
    time *= 0.001;
    const delta = time - then;
    then = time;

    bubblesGroup.children.forEach((bubble) => {
      bubble.position.y += 0.3 * delta * 60;
      if (bubble.position.y > 60) {
        bubble.position.y = 0;
      }
    });

    fishData.forEach((fish) => {
      fish.angle += fish.speed * 0.02 * delta * 60;
      fish.obj.position.x = Math.cos(fish.angle) * fish.radius;
      fish.obj.position.z = Math.sin(fish.angle) * fish.radius;
      fish.obj.position.y = fish.height + Math.sin(fish.angle * 2) * 2;
      fish.obj.rotation.y = -fish.angle;

      if (fish.labelSprite) {
        fish.labelSprite.position.copy(fish.obj.position);
        fish.labelSprite.position.y += 12;
      }
    });

    coralArr.forEach((shape, i) => {
      shape.rotation.z = Math.sin(time + i) * 0.2;
    });

    outerArr.forEach((shape, i) => {
      shape.rotation.z = Math.sin(time * 0.8 + i) * 0.2;
    });

    if (shipRoot && !shipLabelSprite) {
      labelTheShip();
    }
    if (shipRoot && shipLabelSprite) {
      shipLabelSprite.position.set(
        shipRoot.position.x,
        shipRoot.position.y + 25,
        shipRoot.position.z
      );
    }

    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissorTest(true);
    renderer.render(scene, activeCamera);

    const insetW = window.innerWidth / 4;
    const insetH = window.innerHeight / 4;
    renderer.setViewport(window.innerWidth - insetW, window.innerHeight - insetH, insetW, insetH);
    renderer.setScissor(window.innerWidth - insetW, window.innerHeight - insetH, insetW, insetH);
    renderer.setScissorTest(true);
    overheadCamera.lookAt(0, 0, 0);
    renderer.render(scene, overheadCamera);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();
