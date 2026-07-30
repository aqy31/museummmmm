    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
    import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
    import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
    import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

    





    // === 1. SCENE MANAGER ===
    class SceneManager {
      constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#050505');
        this.scene.fog = new THREE.FogExp2('#050505', 0.003);

        this.camera = new THREE.PerspectiveCamera(
          55,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        this.camera.position.set(0, 25, 50);

        this.renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.xr.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.35, 0.5, 0.85);
        this.composer.addPass(bloomPass);

        this.setupLighting();

        this.gridHelper = new THREE.GridHelper(120, 60, '#ffffff', '#222222');
        this.gridHelper.position.y = -0.01;
        this.gridHelper.visible = false;
        this.scene.add(this.gridHelper);

        this.model = null;
        this.modelBox = null;
        this.modelCenter = new THREE.Vector3();
        this.modelSize = new THREE.Vector3();
        this.colliders = [];

        window.addEventListener('resize', this.onWindowResize.bind(this));
      }

      setupLighting() {
        // High-End Graphic Lighting Setup
        // Hemisphere light (sky/ground)
        this.hemiLight = new THREE.HemisphereLight('#e0e0e0', '#222222', 1.0);
        this.scene.add(this.hemiLight);

        // Main Sun Light (Warm and Bright)
        this.dirLight = new THREE.DirectionalLight('#fffaeb', 3.5);
        this.dirLight.position.set(35, 65, 35);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 4096;
        this.dirLight.shadow.mapSize.height = 4096;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 160;
        this.dirLight.shadow.bias = -0.0001;
        this.dirLight.shadow.normalBias = 0.02;
        this.dirLight.shadow.radius = 2.5; // Soft Shadows

        const d = 45;
        this.dirLight.shadow.camera.left = -d;
        this.dirLight.shadow.camera.right = d;
        this.dirLight.shadow.camera.top = d;
        this.dirLight.shadow.camera.bottom = -d;
        this.scene.add(this.dirLight);

        // Fill Light (Cool Sky Blue) to contrast the warm sun
        this.fillLight = new THREE.DirectionalLight('#aaccff', 1.8);
        this.fillLight.position.set(-35, 25, -35);
        this.scene.add(this.fillLight);

        const archAmbient = new THREE.AmbientLight('#ffffff', 0.5);
        this.scene.add(archAmbient);
      }

      setLightingPreset(preset) {
        switch(preset) {
          case 'day':
            this.scene.background = new THREE.Color('#050505');
            this.scene.fog.color = new THREE.Color('#050505');
            this.hemiLight.color.set('#ffffff');
            this.hemiLight.groundColor.set('#1f1f1f');
            this.hemiLight.intensity = 1.6;
            this.dirLight.color.set('#ffffff');
            this.dirLight.intensity = 2.4;
            this.dirLight.position.set(35, 65, 35);
            break;
          case 'night':
            this.scene.background = new THREE.Color('#020202');
            this.scene.fog.color = new THREE.Color('#020202');
            this.hemiLight.color.set('#444444');
            this.hemiLight.groundColor.set('#050505');
            this.hemiLight.intensity = 0.6;
            this.dirLight.color.set('#ffffff');
            this.dirLight.intensity = 1.0;
            this.dirLight.position.set(10, 45, -20);
            break;
          case 'studio':
            this.scene.background = new THREE.Color('#0d0d0d');
            this.scene.fog.color = new THREE.Color('#0d0d0d');
            this.hemiLight.color.set('#ffffff');
            this.hemiLight.groundColor.set('#222222');
            this.hemiLight.intensity = 2.0;
            this.dirLight.color.set('#ffffff');
            this.dirLight.intensity = 2.0;
            this.dirLight.position.set(0, 70, 0);
            break;
        }
      }

      loadModel(url, onProgress, onLoad, onError) {
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        loader.setDRACOLoader(dracoLoader);

        loader.load(
          url,
          (gltf) => {
            this.model = gltf.scene;

            this.modelBox = new THREE.Box3().setFromObject(this.model);
            this.modelBox.getCenter(this.modelCenter);
            this.modelBox.getSize(this.modelSize);

            this.model.position.x = -this.modelCenter.x;
            this.model.position.z = -this.modelCenter.z;
            this.model.position.y = -this.modelBox.min.y;

            // Add model to scene FIRST so world matrices are accurately calculated
            this.scene.add(this.model);
            this.scene.updateMatrixWorld(true);

            this.colliders = [];
            this.model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.geometry) {
                  child.geometry.computeVertexNormals();
                  if (!child.geometry.boundingBox) {
                    child.geometry.computeBoundingBox();
                  }
                  if (!child.geometry.boundingSphere) {
                    child.geometry.computeBoundingSphere(); // Crucial for fast Raycaster rejection
                  }
                }
                if (child.material) {
                  child.material.flatShading = false;
                  child.material.roughness = 0.75;
                  child.material.metalness = 0.02;
                  child.material.needsUpdate = true;
                }
                this.colliders.push(child);
              }
            });
            console.log('[Collider] Using', this.colliders.length, 'mesh colliders');

            if (onLoad) onLoad(this.model, this.modelBox, this.modelSize);
          },
          (xhr) => {
            if (xhr.lengthComputable && onProgress) {
              const percent = Math.round((xhr.loaded / xhr.total) * 100);
              onProgress(percent);
            } else if (onProgress) {
              const estPercent = Math.min(Math.round((xhr.loaded / 24345612) * 100), 99);
              onProgress(estPercent);
            }
          },
          (err) => {
            console.error('Error loading GLB model:', err);
            if (onError) onError(err);
          }
        );
      }

      toggleGrid(visible) {
        if (visible !== undefined) {
          this.gridHelper.visible = visible;
        } else {
          this.gridHelper.visible = !this.gridHelper.visible;
        }
        return this.gridHelper.visible;
      }

      onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
      }

      render() {
        if (this.dirLight && !window.sunLocked) {
            const camAngle = Math.atan2(this.camera.position.z, this.camera.position.x);
            const sunAngle = camAngle + (Math.PI / 4);
            const radius = 70;
            this.dirLight.position.x = Math.cos(sunAngle) * radius;
            this.dirLight.position.z = Math.sin(sunAngle) * radius;
        }
        this.composer ? this.composer.render() : this.renderer.render(this.scene, this.camera);
      }

      // Performance: reduce render workload during walk mode
      enterWalkPerformance() {
        this._savedPixelRatio = this.renderer.getPixelRatio();
        this._savedFar = this.camera.far;
        this._savedFogDensity = this.scene.fog ? this.scene.fog.density : null;
        this.renderer.setPixelRatio(1.0);
        this.camera.far = 120;
        this.camera.updateProjectionMatrix();
        if (this.scene.fog) this.scene.fog.density = 0.012;
      }

      exitWalkPerformance() {
        if (this._savedPixelRatio !== undefined) {
          this.renderer.setPixelRatio(this._savedPixelRatio);
        }
        if (this._savedFar !== undefined) {
          this.camera.far = this._savedFar;
          this.camera.updateProjectionMatrix();
        }
        if (this._savedFogDensity !== null && this._savedFogDensity !== undefined && this.scene.fog) {
          this.scene.fog.density = this._savedFogDensity;
        }
      }
    }

    // === 2. CONTROL MANAGER ===
    class ControlManager {
      constructor(camera, domElement, onCoordUpdate) {
        this.camera = camera;
        this.domElement = domElement;
        this.onCoordUpdate = onCoordUpdate;
        this.mode = 'orbit';

        this.colliders = [];
        this.raycaster = new THREE.Raycaster();

        // Pre-allocated vectors (reused every frame, zero garbage collection)
        this._rayOrigin = new THREE.Vector3();
        this._rayDir = new THREE.Vector3();

        // Jump system
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.gravity = 15;
        this.jumpForce = 6.5;

        this.orbitControls = new OrbitControls(this.camera, this.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;
        this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.02;
        this.orbitControls.minDistance = 2;
        this.orbitControls.maxDistance = 150;
        this.orbitControls.autoRotate = true;
        this.orbitControls.autoRotateSpeed = 1.2;

        this.eyeHeight = 10.0;
        this.lockHeight = true;
        this.speedMultiplier = 3.5;

        this.velocity = new THREE.Vector3();
        this.moveVector = new THREE.Vector3();

        this.yaw = 0;
        this.pitch = 0;

        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionDuration = 1.8;
        this.transitionStartPos = new THREE.Vector3();
        this.transitionEndPos = new THREE.Vector3();
        this.transitionStartTarget = new THREE.Vector3();
        this.transitionEndTarget = new THREE.Vector3();
        this.onTransitionComplete = null;

        this.keys = { forward: false, backward: false, left: false, right: false, sprint: false };
        this.joystickVector = { x: 0, y: 0 };
        this.isTouchLooking = false;

        this.isGyroActive = false;
        this.gyroQuaternion = null;
        this.baseQuaternion = null;
        this.initialGyroQuaternion = null;
        this.gyroListenerBound = false;
        this.lastScreenAngle = null;

        // Wall mesh collider (dedicated ultra-fast 0.01ms collision geometry)
        this.wallMesh = null;

        // Pre-allocated quaternions to avoid GC during walk
        this._qYaw = new THREE.Quaternion();
        this._qPitch = new THREE.Quaternion();
        this._axisY = new THREE.Vector3(0, 1, 0);
        this._axisX = new THREE.Vector3(1, 0, 0);
        this._tempQ = new THREE.Quaternion();
        this._tempEuler = new THREE.Euler(0, 0, 0, 'YXZ');

        this.initKeyboardListeners();
        this.initTouchLookListeners();
      }

      setColliders(colliders) {
        this.colliders = colliders || [];
        if (this.wallMesh) {
          if (this.wallMesh.geometry) this.wallMesh.geometry.dispose();
          if (this.wallMesh.material) this.wallMesh.material.dispose();
          this.wallMesh = null;
        }
        if (this.floorMesh) {
          if (this.floorMesh.geometry) this.floorMesh.geometry.dispose();
          if (this.floorMesh.material) this.floorMesh.material.dispose();
          this.floorMesh = null;
        }
        if (this.floorMesh) {
          if (this.floorMesh.geometry) this.floorMesh.geometry.dispose();
          if (this.floorMesh.material) this.floorMesh.material.dispose();
          this.floorMesh = null;
        }

        const wallPositions = [];
        const floorPositions = [];
        const vA = new THREE.Vector3();
        const vB = new THREE.Vector3();
        const vC = new THREE.Vector3();
        const cb = new THREE.Vector3();
        const ab = new THREE.Vector3();
        const norm = new THREE.Vector3();

        for (let i = 0; i < this.colliders.length; i++) {
          const mesh = this.colliders[i];
          if (!mesh.geometry) continue;

          const geom = mesh.geometry;
          const posAttr = geom.attributes.position;
          if (!posAttr) continue;

          const indexAttr = geom.index;
          const matrixWorld = mesh.matrixWorld;
          const numTriangles = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;

          for (let t = 0; t < numTriangles; t++) {
            let iA, iB, iC;
            if (indexAttr) {
              iA = indexAttr.getX(t * 3);
              iB = indexAttr.getX(t * 3 + 1);
              iC = indexAttr.getX(t * 3 + 2);
            } else {
              iA = t * 3;
              iB = t * 3 + 1;
              iC = t * 3 + 2;
            }

            vA.fromBufferAttribute(posAttr, iA).applyMatrix4(matrixWorld);
            vB.fromBufferAttribute(posAttr, iB).applyMatrix4(matrixWorld);
            vC.fromBufferAttribute(posAttr, iC).applyMatrix4(matrixWorld);

            // Filter triangles in waist height range (~0.1m to 2.4m)
            const minY = Math.min(vA.y, vB.y, vC.y);
            const maxY = Math.max(vA.y, vB.y, vC.y);
            

            if (maxY < 0.0 || minY > 15.0) continue;

            // Calculate triangle normal in world space
            cb.subVectors(vC, vB);
            ab.subVectors(vA, vB);
            norm.crossVectors(cb, ab).normalize();

            // Optimize: Skip if triangle is out of interaction bounds
            if (minY > 15.0 || maxY < -2.0) continue;

            if (Math.abs(norm.y) < 0.9) {
              wallPositions.push(vA.x, vA.y, vA.z, vB.x, vB.y, vB.z, vC.x, vC.y, vC.z);
            } else if (norm.y > 0.9) {
              floorPositions.push(vA.x, vA.y, vA.z, vB.x, vB.y, vB.z, vC.x, vC.y, vC.z);
            } else {
              // Floor/Ceiling check
              floorPositions.push(
                vA.x, vA.y, vA.z,
                vB.x, vB.y, vB.z,
                vC.x, vC.y, vC.z
              );
            }
          }
        }

        if (wallPositions.length > 0) {
          const wallGeom = new THREE.BufferGeometry();
          wallGeom.setAttribute('position', new THREE.Float32BufferAttribute(wallPositions, 3));
          wallGeom.computeBoundingSphere();

          wallGeom.computeBoundingBox();
          this.wallMesh = new THREE.Mesh(wallGeom, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
          console.log('[WallMesh] Created ultra-fast wall collider mesh with', wallPositions.length / 9, 'triangles');
        }
        if (floorPositions.length > 0) {
          const floorGeom = new THREE.BufferGeometry();
          floorGeom.setAttribute('position', new THREE.Float32BufferAttribute(floorPositions, 3));
          floorGeom.computeBoundingSphere();

          floorGeom.computeBoundingBox();
          this.floorMesh = new THREE.Mesh(floorGeom, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
          console.log('[FloorMesh] Created ultra-fast floor collider mesh with', floorPositions.length / 9, 'triangles');
        }
      }

      // Jump trigger
      triggerJump() {
        if (this.mode !== 'walk') return;
        if (!this.isJumping) {
          this.isJumping = true;
          this.jumpVelocity = this.jumpForce;
        }
      }

      applyCollisionAndMove(delta) {
        const stepX = this.velocity.x * delta;
        const stepZ = this.velocity.z * delta;
        const moveDist = Math.hypot(stepX, stepZ);

        // --- Handle Floor Collision & Gravity ---
        let groundY = 0;
        if (this.floorMesh) {
          // Cast ray down to feel the terrain instantly (No staggering to avoid stutter)
          this._rayOrigin.set(this.camera.position.x, this.camera.position.y + 2.0, this.camera.position.z);
          this.raycaster.set(this._rayOrigin, new THREE.Vector3(0, -1, 0));
          this.raycaster.far = 100;
          const hits = this.raycaster.intersectObject(this.floorMesh, false);
          if (hits.length > 0) {
            groundY = hits[0].point.y;
          }
        }

        // Apply a very fast smoothing so it doesn't snap instantly, creating a smooth terrain tracking feel
        if (this.groundY === undefined) this.groundY = groundY;
        this.groundY += (groundY - this.groundY) * 0.4; // 40% interpolation per frame = super smooth
        const targetY = this.groundY + this.eyeHeight;

        if (this.isJumping) {
          this.jumpVelocity -= this.gravity * delta;
          this.camera.position.y += this.jumpVelocity * delta;
          
          if (this.camera.position.y <= targetY) {
            this.camera.position.y = targetY;
            this.isJumping = false;
            this.jumpVelocity = 0;
          }
        } else if (this.lockHeight) {
          this.camera.position.y = targetY;
        }

        if (this.isJumping) {
          this.jumpVelocity -= this.gravity * delta;
          this.camera.position.y += this.jumpVelocity * delta;
          
          // Landing logic
          if (this.camera.position.y <= targetY) {
            this.camera.position.y = targetY;
            this.isJumping = false;
            this.jumpVelocity = 0;
          }
        } else if (this.lockHeight) {
          // Always stay exactly at eyeHeight above the physical model floor
          this.camera.position.y = targetY;
        }

        // --- Ultra-Fast Wall Collision (0.01ms) ---
        if (this.wallMesh && moveDist > 0.001) {
          const playerRadius = 0.8;
          const waistY = this.camera.position.y - 2.5;
          const rayFar = moveDist + playerRadius;

          // Ray starts at CURRENT position, points toward movement
          this._rayDir.set(stepX, 0, stepZ).normalize();
          this._rayOrigin.set(this.camera.position.x, waistY, this.camera.position.z);

          this.raycaster.set(this._rayOrigin, this._rayDir);
          this.raycaster.far = rayFar;
          this.raycaster.near = 0;

          const hits = this.raycaster.intersectObject(this.wallMesh, false);

          if (hits.length > 0 && hits[0].distance < rayFar) {
            // Wall detected! Stop at safe distance before wall
            const safeDist = Math.max(0, hits[0].distance - playerRadius);
            if (safeDist < moveDist) {
              // Can only move partially
              const ratio = safeDist / moveDist;
              this.camera.position.x += stepX * ratio;
              this.camera.position.z += stepZ * ratio;
              this.velocity.x *= 0.05;
              this.velocity.z *= 0.05;
            } else {
              // Wall is far enough, move normally
              this.camera.position.x += stepX;
              this.camera.position.z += stepZ;
            }
          } else {
            // No wall, move freely
            this.camera.position.x += stepX;
            this.camera.position.z += stepZ;
          }
        } else if (moveDist > 0.001) {
          this.camera.position.x += stepX;
          this.camera.position.z += stepZ;
        }

        // World bounds clamp
        const maxBound = 55;
        this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -maxBound, maxBound);
        this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -maxBound, maxBound);
      }

      setJoystickInput(x, y) {
        this.joystickVector = { x, y };
      }

      async toggleGyro() {
        if (this.isGyroActive) {
          this.isGyroActive = false;
          this.baseQuaternion = null;
          this.initialGyroQuaternion = null;
          return false;
        }

        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
          try {
            const state = await DeviceOrientationEvent.requestPermission();
            if (state === 'granted') {
              this.startGyro();
              return true;
            } else {
              alert('تم رفض إذن الوصول لمستشعر الحركة (Gyroscope) في الجهاز.');
              return false;
            }
          } catch (e) {
            console.error(e);
            alert('تعذر طلب إذن مستشعر الحركة.');
            return false;
          }
        } else if ('DeviceOrientationEvent' in window) {
          this.startGyro();
          return true;
        } else {
          alert('مستشعر الحركة (Gyroscope) غير مدعوم على هذا الجهاز.');
          return false;
        }
      }

      startGyro() {
        if (!this.gyroListenerBound) {
          const zee = new THREE.Vector3(0, 0, 1);
          const euler = new THREE.Euler();
          const q0 = new THREE.Quaternion();
          const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

          this.onDeviceOrientation = (event) => {
            if (!this.isGyroActive) return;
            const alpha = event.alpha ? THREE.MathUtils.degToRad(event.alpha) : 0;
            const beta = event.beta ? THREE.MathUtils.degToRad(event.beta) : 0;
            const gamma = event.gamma ? THREE.MathUtils.degToRad(event.gamma) : 0;
            const screenAngle = window.orientation || (window.screen && window.screen.orientation && window.screen.orientation.angle) || 0;
            
            // iPad / Tablet orientation fix: reset base calibration if iPad rotates between portrait & landscape
            if (this.lastScreenAngle !== null && this.lastScreenAngle !== screenAngle) {
              this.baseQuaternion = null;
            }
            this.lastScreenAngle = screenAngle;

            const orient = THREE.MathUtils.degToRad(screenAngle);

            euler.set(beta, alpha, -gamma, 'YXZ');
            const q = new THREE.Quaternion();
            q.setFromEuler(euler);
            q.multiply(q1);
            q.multiply(q0.setFromAxisAngle(zee, -orient));

            this.gyroQuaternion = q;
          };

          window.addEventListener('deviceorientation', this.onDeviceOrientation.bind(this), true);
          this.gyroListenerBound = true;
        }

        this.isGyroActive = true;
        this.baseQuaternion = null;
        this.initialGyroQuaternion = null;
      }

      setMode(mode) {
        this.mode = mode;
        window.currentMode = mode;
        if (mode === 'orbit') {
          this.orbitControls.enabled = !this.isGyroActive;
          this.orbitControls.autoRotate = !this.isGyroActive;
        } else if (mode === 'walk') {
          this.orbitControls.enabled = false;
          this.orbitControls.autoRotate = false;
          this.camera.position.y = this.eyeHeight;
          this.velocity.set(0, 0, 0);
          this.isJumping = false;
          this.jumpVelocity = 0;
          this.playerOnFloor = true;
          
          const dir = new THREE.Vector3();
          this.camera.getWorldDirection(dir);
          this.yaw = Math.atan2(-dir.x, -dir.z);
          this.pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -0.99, 0.99));
        }
      }

      animateToEntrance(
        targetPos = new THREE.Vector3(-17.13, 1.85, -1.31),
        targetLookAt = new THREE.Vector3(-10.0, 1.85, 5.0),
        onComplete = null
      ) {
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.onTransitionComplete = onComplete;
        this.orbitControls.autoRotate = false;

        this.transitionStartPos.copy(this.camera.position);
        this.transitionEndPos.copy(targetPos);
        this.transitionStartTarget.copy(this.orbitControls.target);
        this.transitionEndTarget.copy(targetLookAt);

        this.orbitControls.enabled = false;
        this.velocity.set(0, 0, 0);
        this.isJumping = false;
        this.jumpVelocity = 0;
      }

      setSpeed(speedType) {
        switch (speedType) {
          case 'slow': this.speedMultiplier = 1.8; break;
          case 'normal': this.speedMultiplier = 3.5; break;
          case 'fast': this.speedMultiplier = 7.0; break;
        }
      }

      toggleHeightLock() {
        this.lockHeight = !this.lockHeight;
        if (this.lockHeight) {
          this.camera.position.y = this.eyeHeight;
        }
        return this.lockHeight;
      }

      resetCamera(targetPosition = new THREE.Vector3(0, 25, 50)) {
        this.camera.position.copy(targetPosition);
        this.camera.lookAt(0, 2, 0);
        this.orbitControls.target.set(0, 2, 0);
        this.yaw = 0;
        this.pitch = 0;
        this.velocity.set(0, 0, 0);
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.orbitControls.autoRotate = !this.isGyroActive;
      }

      initKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
          if (this.mode !== 'walk' || this.isTransitioning) return;
          switch (e.code) {
            case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
            case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
            case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
            case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
            case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = true; break;
            case 'Space': e.preventDefault(); this.triggerJump(); break;
          }
        });

        window.addEventListener('keyup', (e) => {
          if (this.mode !== 'walk' || this.isTransitioning) return;
          switch (e.code) {
            case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
            case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
            case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
            case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
            case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = false; break;
          }
        });
      }

            initTouchLookListeners() {
        let lastX = 0, lastY = 0;
        this.lookTouchId = null;

        const onPointerDown = (e) => {
          if (e.target.closest('button, .glass-panel, .glass-hud, #joystick-container')) return;
          if (this.isTouchLooking) return;
          
          let touch;
          if (e.changedTouches) {
            touch = e.changedTouches[0];
            this.lookTouchId = touch.identifier;
          } else {
            touch = e;
            this.lookTouchId = 'mouse';
          }

          this.isTouchLooking = true;
          lastX = touch.clientX;
          lastY = touch.clientY;
        };

        const onPointerMove = (e) => {
          if (!this.isTouchLooking || this.isTransitioning || this.isGyroActive) return;
          
          let touch;
          if (e.changedTouches) {
            for (let i = 0; i < e.changedTouches.length; i++) {
              if (e.changedTouches[i].identifier === this.lookTouchId) {
                touch = e.changedTouches[i];
                break;
              }
            }
            if (!touch) return;
          } else {
            touch = e;
          }

          const deltaX = touch.clientX - lastX;
          const deltaY = touch.clientY - lastY;
          lastX = touch.clientX;
          lastY = touch.clientY;

          const sensitivity = 0.003;
          this.yaw -= deltaX * sensitivity;
          this.pitch -= deltaY * sensitivity;

          const maxPitch = Math.PI / 2 - 0.05;
          this.pitch = THREE.MathUtils.clamp(this.pitch, -maxPitch, maxPitch);
        };

        const onPointerUp = (e) => {
          if (!this.isTouchLooking) return;
          if (e.changedTouches) {
            let found = false;
            for (let i = 0; i < e.changedTouches.length; i++) {
              if (e.changedTouches[i].identifier === this.lookTouchId) {
                found = true;
                break;
              }
            }
            if (!found) return;
          }
          this.isTouchLooking = false;
          this.lookTouchId = null;
        };

        window.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);
        window.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerUp, { passive: true });
        window.addEventListener('touchcancel', onPointerUp, { passive: true });
      }

      update(delta) {
        if (this.isTransitioning) {
          this.transitionProgress += delta / this.transitionDuration;
          if (this.transitionProgress >= 1.0) {
            this.transitionProgress = 1.0;
            this.isTransitioning = false;
            this.camera.position.copy(this.transitionEndPos);
            this.camera.lookAt(this.transitionEndTarget);

            const dir = new THREE.Vector3().subVectors(this.transitionEndTarget, this.transitionEndPos).normalize();
            this.yaw = Math.atan2(-dir.x, -dir.z);
            this.pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -0.99, 0.99));

            if (this.onTransitionComplete) {
              this.onTransitionComplete();
              this.onTransitionComplete = null;
            }
            return;
          }

          const t = this.transitionProgress;
          const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          this.camera.position.lerpVectors(this.transitionStartPos, this.transitionEndPos, ease);
          const currentTarget = new THREE.Vector3().lerpVectors(this.transitionStartTarget, this.transitionEndTarget, ease);
          this.camera.lookAt(currentTarget);
          return;
        }

        if (this.isGyroActive && this.gyroQuaternion) {
          if (!this.baseQuaternion) {
            this.baseQuaternion = this.camera.quaternion.clone();
            this.initialGyroQuaternion = this.gyroQuaternion.clone().invert();
          }
          const targetQ = this.baseQuaternion.clone().multiply(this.initialGyroQuaternion).multiply(this.gyroQuaternion);
          this._tempQ.copy(this.camera.quaternion).slerp(targetQ, 0.25);
          this._tempEuler.setFromQuaternion(this._tempQ, 'YXZ');
          this._tempEuler.z = 0; // Keep horizon 100% straight & level (no tilt)
          this.camera.quaternion.setFromEuler(this._tempEuler);

          const dir = new THREE.Vector3();
          this.camera.getWorldDirection(dir);
          this.yaw = Math.atan2(-dir.x, -dir.z);
          this.pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -0.99, 0.99));

          if (this.mode === 'walk') {
            this.moveVector.set(0, 0, 0);
            let forwardPower = 0, strafePower = 0;
            if (this.keys.forward) forwardPower += 1;
            if (this.keys.backward) forwardPower -= 1;
            if (this.keys.left) strafePower -= 1;
            if (this.keys.right) strafePower += 1;

            if (Math.abs(this.joystickVector.y) > 0.05) forwardPower = -this.joystickVector.y;
            if (Math.abs(this.joystickVector.x) > 0.05) strafePower = this.joystickVector.x;

            const sinYaw = Math.sin(this.yaw);
            const cosYaw = Math.cos(this.yaw);
            const fwdX = -sinYaw, fwdZ = -cosYaw;
            const rightX = cosYaw, rightZ = -sinYaw;

            const currentSpeed = (this.keys.sprint ? this.speedMultiplier * 1.6 : this.speedMultiplier);
            const targetVelX = (fwdX * forwardPower + rightX * strafePower) * currentSpeed;
            const targetVelZ = (fwdZ * forwardPower + rightZ * strafePower) * currentSpeed;

            this.velocity.x += (targetVelX - this.velocity.x) * Math.min(delta * 10, 1.0);
            this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(delta * 10, 1.0);

            this.applyCollisionAndMove(delta);
          }
        } else if (this.mode === 'orbit') {
          this.orbitControls.update();
        } else if (this.mode === 'walk') {
          this.moveVector.set(0, 0, 0);
          let forwardPower = 0, strafePower = 0;
          if (this.keys.forward) forwardPower += 1;
          if (this.keys.backward) forwardPower -= 1;
          if (this.keys.left) strafePower -= 1;
          if (this.keys.right) strafePower += 1;

          if (Math.abs(this.joystickVector.y) > 0.05) forwardPower = -this.joystickVector.y;
          if (Math.abs(this.joystickVector.x) > 0.05) strafePower = this.joystickVector.x;

          const sinYaw = Math.sin(this.yaw);
          const cosYaw = Math.cos(this.yaw);
          const fwdX = -sinYaw, fwdZ = -cosYaw;
          const rightX = cosYaw, rightZ = -sinYaw;

          const currentSpeed = (this.keys.sprint ? this.speedMultiplier * 1.6 : this.speedMultiplier);
          const targetVelX = (fwdX * forwardPower + rightX * strafePower) * currentSpeed;
          const targetVelZ = (fwdZ * forwardPower + rightZ * strafePower) * currentSpeed;

          this.velocity.x += (targetVelX - this.velocity.x) * Math.min(delta * 10, 1.0);
          this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(delta * 10, 1.0);

          this.applyCollisionAndMove(delta);

          this._qYaw.setFromAxisAngle(this._axisY, this.yaw);
          this._qPitch.setFromAxisAngle(this._axisX, this.pitch);
          this.camera.quaternion.copy(this._qYaw).multiply(this._qPitch);
        }

        if (this.onCoordUpdate) {
          const pos = this.camera.position;
          const fx = pos.x.toFixed(2);
          const fy = pos.y.toFixed(2);
          const fz = pos.z.toFixed(2);
          if (fx !== this._lastCoordX || fy !== this._lastCoordY || fz !== this._lastCoordZ) {
            this._lastCoordX = fx;
            this._lastCoordY = fy;
            this._lastCoordZ = fz;
            this.onCoordUpdate(fx, fy, fz);
          }
        }
      }
    }

    // === 3. VIRTUAL TOUCH JOYSTICK CONTROLLER (with Double-Tap Jump) ===
    class VirtualJoystick {
      constructor(container, knob, onChange, onJump) {
        this.container = container;
        this.knob = knob;
        this.onChange = onChange;
        this.onJump = onJump;
        this.active = false;
        this.touchId = null;
        this.maxRadius = 32;

        // Double-tap detection for jump
        this.lastTapTime = 0;
        this.doubleTapThreshold = 350; // ms

        this.initEvents();
      }

      initEvents() {
        const handleStart = (e) => {
          e.preventDefault();

          // Double-tap jump detection
          const now = Date.now();
          if (now - this.lastTapTime < this.doubleTapThreshold) {
            if (this.onJump) this.onJump();
            this.lastTapTime = 0;
          } else {
            this.lastTapTime = now;
          }

          if (this.active) return;
          const touch = e.touches ? e.touches[0] : e;
          this.touchId = touch.identifier !== undefined ? touch.identifier : 'mouse';
          this.active = true;
          this.updatePosition(touch.clientX, touch.clientY);
        };

        const handleMove = (e) => {
          if (!this.active) return;
          let touch = null;
          if (e.touches) {
            for (let i = 0; i < e.touches.length; i++) {
              if (e.touches[i].identifier === this.touchId) {
                touch = e.touches[i];
                break;
              }
            }
          } else {
            touch = e;
          }
          if (touch) {
            e.preventDefault();
            this.updatePosition(touch.clientX, touch.clientY);
          }
        };

        const handleEnd = (e) => {
          if (!this.active) return;
          if (e.touches && this.touchId !== 'mouse') {
            let stillActive = false;
            for (let i = 0; i < e.touches.length; i++) {
              if (e.touches[i].identifier === this.touchId) {
                stillActive = true;
                break;
              }
            }
            if (stillActive) return;
          }
          this.active = false;
          this.touchId = null;
          this.resetKnob();
        };

        this.container.addEventListener('touchstart', handleStart, { passive: false });
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd, { passive: false });
        window.addEventListener('touchcancel', handleEnd, { passive: false });

        this.container.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
      }

      updatePosition(clientX, clientY) {
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let deltaX = clientX - centerX;
        let deltaY = clientY - centerY;
        const dist = Math.hypot(deltaX, deltaY);

        if (dist > this.maxRadius) {
          deltaX = (deltaX / dist) * this.maxRadius;
          deltaY = (deltaY / dist) * this.maxRadius;
        }

        this.knob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

        const normX = deltaX / this.maxRadius;
        const normY = deltaY / this.maxRadius;

        if (this.onChange) {
          this.onChange(normX, normY);
        }
      }

      resetKnob() {
        this.knob.style.transform = 'translate(-50%, -50%)';
        if (this.onChange) {
          this.onChange(0, 0);
        }
      }
    }

    // === 4. APP INITIALIZATION ===
    const container = document.getElementById('canvas-container');
    const coordX = document.getElementById('coord-x');
    const coordY = document.getElementById('coord-y');
    const coordZ = document.getElementById('coord-z');

    const loadingScreen = document.getElementById('loading-screen');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    const heroStartContainer = document.getElementById('hero-start-container');
    const btnStartTour = document.getElementById('btn-start-tour');
    const btnOrbit = document.getElementById('btn-mode-orbit');
    const btnWalk = document.getElementById('btn-mode-walk');
    const walkOverlay = document.getElementById('walk-controls-overlay');
    const modeStatusText = document.getElementById('mode-status-text');

    window.sunLocked = false; window.currentMode = 'orbit';
    const sceneManager = new SceneManager(container);
    const controlManager = new ControlManager(
      sceneManager.camera,
      sceneManager.renderer.domElement,
      (x, y, z) => {
        coordX.textContent = x;
        coordY.textContent = y;
        coordZ.textContent = z;
      }
    );

    const entrancePos = new THREE.Vector3(11.23, 10.0, 5.54);
    const entranceLookAt = new THREE.Vector3(-10.0, 1.85, 5.0);

    sceneManager.loadModel(
      './winged_bulls.glb',
      (percent) => {
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${percent}%`;
      },
      (model, box, size) => {
        controlManager.setColliders(sceneManager.colliders);
        const maxDim = Math.max(size.x, size.y, size.z);
        sceneManager.camera.position.set(0, maxDim * 0.6, maxDim * 1.3);
        sceneManager.camera.lookAt(0, box.max.y * 0.4, 0);
        controlManager.orbitControls.target.set(0, box.max.y * 0.4, 0);
        controlManager.orbitControls.autoRotate = true;

        setTimeout(() => {
          loadingScreen.classList.add('fade-out');
        }, 400);
      },
      (err) => {
        progressText.textContent = 'خطأ في التحميل';
        console.error(err);
      }
    );

    btnStartTour.addEventListener('click', () => {
      window.sunLocked = true;
      heroStartContainer.classList.add('hidden');
      controlManager.animateToEntrance(entrancePos, entranceLookAt, () => {
        btnWalk.classList.add('active');
        btnOrbit.classList.remove('active');
        walkOverlay.classList.remove('hidden');
        controlManager.setMode('walk');
        
        if (modeStatusText) modeStatusText.textContent = 'وضع المشي التفاعلي';
      });
    });

    btnOrbit.addEventListener('click', () => {
      window.sunLocked = false;
      btnOrbit.classList.add('active');
      btnWalk.classList.remove('active');
      walkOverlay.classList.add('hidden');
      heroStartContainer.classList.remove('hidden');
      controlManager.setMode('orbit');
      
      
      if (modeStatusText) modeStatusText.textContent = 'نظرة عامة (360°)';
    });

    btnWalk.addEventListener('click', () => {
      window.sunLocked = true;
      btnWalk.classList.add('active');
      btnOrbit.classList.remove('active');
      walkOverlay.classList.add('hidden');
      heroStartContainer.classList.add('hidden');
      controlManager.animateToEntrance(entrancePos, entranceLookAt, () => {
        walkOverlay.classList.remove('hidden');
        controlManager.setMode('walk');
        
        if (modeStatusText) modeStatusText.textContent = 'وضع المشي التفاعلي';
      });
    });

    // Initialize Touch Joystick with Double-Tap Jump
    const joystickContainer = document.getElementById('joystick-container');
    const joystickKnob = document.getElementById('joystick-knob');
    if (joystickContainer && joystickKnob) {
      new VirtualJoystick(
        joystickContainer,
        joystickKnob,
        (x, y) => { controlManager.setJoystickInput(x, y); },
        () => { controlManager.triggerJump(); }
      );
    }

    // UI Hide / Show Toggle Buttons
    const btnToggleUI = document.getElementById('btn-toggle-ui');
    const btnRestoreUI = document.getElementById('btn-restore-ui');
    if (btnToggleUI) {
      btnToggleUI.addEventListener('click', () => {
        document.body.classList.add('ui-hidden');
      });
    }
    if (btnRestoreUI) {
      btnRestoreUI.addEventListener('click', () => {
        document.body.classList.remove('ui-hidden');
      });
    }

    const lightBtns = {
      day: document.getElementById('btn-light-day'),
      night: document.getElementById('btn-light-night'),
      studio: document.getElementById('btn-light-studio')
    };

    Object.keys(lightBtns).forEach((preset) => {
      if (lightBtns[preset]) {
        lightBtns[preset].addEventListener('click', () => {
          Object.values(lightBtns).forEach(btn => btn.classList.remove('active'));
          lightBtns[preset].classList.add('active');
          sceneManager.setLightingPreset(preset);
        });
      }
    });

    const speedBtns = {
      slow: document.getElementById('btn-speed-slow'),
      normal: document.getElementById('btn-speed-normal'),
      fast: document.getElementById('btn-speed-fast')
    };

    Object.keys(speedBtns).forEach((speed) => {
      speedBtns[speed].addEventListener('click', () => {
        Object.values(speedBtns).forEach(btn => btn.classList.remove('active'));
        speedBtns[speed].classList.add('active');
        controlManager.setSpeed(speed);
      });
    });

    document.getElementById('btn-reset-cam').addEventListener('click', () => {
      controlManager.resetCamera();
      heroStartContainer.classList.remove('hidden');
      btnOrbit.classList.add('active');
      btnWalk.classList.remove('active');
      walkOverlay.classList.add('hidden');
      controlManager.setMode('orbit');
      
      
      if (modeStatusText) modeStatusText.textContent = 'نظرة عامة (360°)';
    });

    const btnLockHeight = document.getElementById('btn-lock-height');
    btnLockHeight.addEventListener('click', () => {
      const isLocked = controlManager.toggleHeightLock();
      btnLockHeight.classList.toggle('active', isLocked);
    });

    const btnGrid = document.getElementById('btn-toggle-grid');
    btnGrid.addEventListener('click', () => {
      const isVisible = sceneManager.toggleGrid();
      btnGrid.classList.toggle('active', isVisible);
    });

    document.getElementById('btn-fullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
      } else {
        document.exitFullscreen();
      }
    });

    // Mobile Gyro VR Motion Tracking Button Handler
    const btnGyroHeader = document.getElementById('btn-gyro');
    const btnGyroTool = document.getElementById('btn-gyro-tool');
    const btnGyroWalk = document.getElementById('btn-gyro-walk');

    async function handleGyroToggle() {
      const isActive = await controlManager.toggleGyro();
      [btnGyroHeader, btnGyroTool, btnGyroWalk].forEach((btn) => {
        if (btn) btn.classList.toggle('active', isActive);
      });
    }

    if (btnGyroHeader) btnGyroHeader.addEventListener('click', handleGyroToggle);
    if (btnGyroTool) btnGyroTool.addEventListener('click', handleGyroToggle);
    if (btnGyroWalk) btnGyroWalk.addEventListener('click', handleGyroToggle);

    const clock = new THREE.Clock();
    sceneManager.renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();
      controlManager.update(delta);
      sceneManager.render();
    });
