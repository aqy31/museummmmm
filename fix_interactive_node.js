const fs = require('fs');

let content = fs.readFileSync('winged_bulls.html', 'utf8');

// 1. Remove all old broken injections
// We injected: "this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));" multiple times
content = content.replace(/\/\/ --- Interactive 3D UI Setup ---[\s\S]*?this\.infoPanel = null;/g, '');
content = content.replace(/this\.createInteractiveElements\(\);/g, '');
content = content.replace(/\/\/ Animate interactive elements[\s\S]*?this\.infoPanel\.lookAt\(this\.camera\.position\);\n\s*\}/g, '');
content = content.replace(/this\.renderer\.domElement\.addEventListener\('pointerdown', this\.onPointerDown\.bind\(this\)\);/g, '');

// 2. Inject setup cleanly inside constructor, right before "window.addEventListener('resize'"
const constructorTarget = "window.addEventListener('resize', this.onWindowResize.bind(this));";
const uiSetup = `
        // --- Interactive 3D UI Setup ---
        this.interactables = [];
        this.uiRaycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        
        this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
        
        // Setup Info Panel variable
        this.infoPanel = null;
        
        window.addEventListener('resize', this.onWindowResize.bind(this));`;
content = content.replace(constructorTarget, uiSetup);

// 3. Inject createInteractiveElements call inside loadModel
const loadTarget = "this.scene.updateMatrixWorld(true);";
const buttonSetup = `this.scene.updateMatrixWorld(true);\n            this.createInteractiveElements();`;
content = content.replace(loadTarget, buttonSetup);

// 4. Inject the new methods right before loadModel
const methodsTarget = "loadModel(url, onProgress, onLoad, onError) {";
const methodsCode = `
      createInteractiveElements() {
        const buttonGeom = new THREE.SphereGeometry(0.3, 32, 32);
        const buttonMat = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x0088ff,
          emissiveIntensity: 1.5,
          transparent: true,
          opacity: 0.8,
          roughness: 0.1,
          metalness: 0.8
        });
        const buttonMesh = new THREE.Mesh(buttonGeom, buttonMat);
        buttonMesh.position.set(-11.62, 10.82, 1.50);
        
        buttonMesh.userData = {
          baseY: 10.82,
          isButton: true,
          onClick: () => {
            this.showInfoPanel(buttonMesh.position);
          }
        };
        
        this.scene.add(buttonMesh);
        this.interactables.push(buttonMesh);
      }

      onPointerDown(event) {
        if (!this.uiRaycaster || !this.interactables) return;
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.uiRaycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.uiRaycaster.intersectObjects(this.interactables, false);

        if (intersects.length > 0) {
          const object = intersects[0].object;
          if (object.userData && object.userData.onClick) {
            object.userData.onClick();
          }
        } else if (this.infoPanel && this.infoPanel.visible) {
          this.infoPanel.visible = false;
        }
      }

      showInfoPanel(buttonPos) {
        if (!this.infoPanel) {
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 1024;
          const ctx = canvas.getContext('2d');

          ctx.fillStyle = 'rgba(20, 30, 40, 0.85)';
          ctx.beginPath();
          ctx.roundRect(0, 0, 1024, 1024, 50);
          ctx.fill();
          
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
          ctx.lineWidth = 10;
          ctx.stroke();

          const img = new Image();
          img.src = 'logo.png';
          img.onload = () => {
            ctx.drawImage(img, 262, 100, 500, 500);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 60px "Helvetica Neue", Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('الكتابة المسمارية', 512, 700);
            ctx.font = '40px "Helvetica Neue", Helvetica, Arial, sans-serif';
            ctx.fillStyle = '#cccccc';
            ctx.fillText('هنا تجد نقوشاً قديمة من قصر اسرحدون.', 512, 800);
            ctx.fillText('انقر في أي مكان للإغلاق.', 512, 870);
            if (this.infoPanel && this.infoPanel.material.map) {
              this.infoPanel.material.map.needsUpdate = true;
            }
          };

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 60px "Helvetica Neue", Helvetica, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('جاري التحميل...', 512, 512);

          const texture = new THREE.CanvasTexture(canvas);
          texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
          
          const panelGeom = new THREE.PlaneGeometry(5, 5);
          const panelMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            depthTest: false
          });
          
          this.infoPanel = new THREE.Mesh(panelGeom, panelMat);
          this.infoPanel.renderOrder = 999;
          this.scene.add(this.infoPanel);
        }

        this.infoPanel.position.copy(buttonPos);
        this.infoPanel.position.z += 2.0; 
        this.infoPanel.position.x += 1.0;
        this.infoPanel.lookAt(this.camera.position);
        
        this.infoPanel.visible = true;
        this.infoPanel.scale.set(0.1, 0.1, 0.1);
        this.infoPanel.userData.targetScale = 1.0;
      }

      loadModel(url, onProgress, onLoad, onError) {`;
content = content.replace(methodsTarget, methodsCode);

// 5. Inject animation logic in render loop
const renderTarget = "if (this.controlManager) {";
const renderCode = `
        if (this.interactables) {
          const time = performance.now() * 0.002;
          this.interactables.forEach(obj => {
            if (obj.userData.isButton) {
              obj.position.y = obj.userData.baseY + Math.sin(time) * 0.15;
              obj.rotation.y += 0.02;
            }
          });
        }
        
        if (this.infoPanel && this.infoPanel.visible) {
          const target = this.infoPanel.userData.targetScale;
          this.infoPanel.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
          this.infoPanel.lookAt(this.camera.position);
        }

        if (this.controlManager) {`;
content = content.replace(renderTarget, renderCode);

fs.writeFileSync('winged_bulls.html', content);
console.log('Fixed');
