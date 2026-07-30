import re

filepath = 'winged_bulls.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove all old broken injections
content = re.sub(r'\s*// --- Interactive 3D UI Setup ---[\s\S]*?this\.infoPanel = null;', '', content)
content = re.sub(r'\s*this\.createInteractiveElements\(\);', '', content)
content = re.sub(r'\s*// Animate interactive elements[\s\S]*?this\.infoPanel\.lookAt\(this\.camera\.position\);\n\s*\}', '', content)

# 2. Inject setup cleanly inside constructor
constructor_target = r'(this\.colliders = \[\];\n\s*window\.addEventListener\('
ui_setup = r"""this.colliders = [];
        
        // --- Interactive 3D UI Setup ---
        this.interactables = [];
        this.uiRaycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        
        this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
        
        // Setup Info Panel variable
        this.infoPanel = null;
        
        window.addEventListener("""
content = re.sub(constructor_target, ui_setup, content)

# 3. Inject createInteractiveElements call in loadModel
load_target = r'(this\.colliders = \[\];\n\s*this\.model\.traverse)'
button_setup = r"""this.colliders = [];
            this.createInteractiveElements();
            
            this.model.traverse"""
content = re.sub(load_target, button_setup, content)

# 4. Inject the new methods right before loadModel(url, onProgress, onLoad, onError) {
methods_target = r'(\s*loadModel\(url,)'
methods_code = r"""
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
        if (!this.uiRaycaster) return;
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
\g<1>"""
content = re.sub(methods_target, methods_code, content)

# 5. Inject animation logic in render loop
render_target = r'(if \(this\.controlManager\) \{)'
render_code = r"""
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

        \g<1>"""
content = re.sub(render_target, render_code, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fix applied.")
