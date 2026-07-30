import re

filepath = 'winged_bulls.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject UI elements setup into SceneManager constructor
constructor_hook = """        this.colliders = [];"""
ui_setup = """        this.colliders = [];
        
        // --- Interactive 3D UI Setup ---
        this.interactables = [];
        this.uiRaycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        
        this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
        
        // Setup Info Panel variable
        this.infoPanel = null;"""

if constructor_hook in content and "this.interactables =" not in content:
    content = content.replace(constructor_hook, ui_setup)

# 2. Inject loadModel hook to create the button after model loads
load_model_hook = """            this.setupEnvironment(gltf.scene);"""
button_creation_hook = """            this.setupEnvironment(gltf.scene);
            this.createInteractiveElements();"""

if load_model_hook in content and "this.createInteractiveElements()" not in content:
    content = content.replace(load_model_hook, button_creation_hook)

# 3. Inject new methods into SceneManager
methods_hook = """      setupEnvironment(model) {"""
new_methods = """      createInteractiveElements() {
        // Create a glowing, interactive button
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
        
        // Position from user's screenshot
        buttonMesh.position.set(-11.62, 10.82, 1.50);
        
        // Add a floating animation pulse in the render loop
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
        // Calculate pointer position in normalized device coordinates
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update the picking ray with the camera and pointer position
        this.uiRaycaster.setFromCamera(this.pointer, this.camera);

        // Calculate objects intersecting the picking ray
        const intersects = this.uiRaycaster.intersectObjects(this.interactables, false);

        if (intersects.length > 0) {
          const object = intersects[0].object;
          if (object.userData && object.userData.onClick) {
            object.userData.onClick();
          }
        } else if (this.infoPanel && this.infoPanel.visible) {
          // Clicked anywhere else, close the panel
          this.infoPanel.visible = false;
        }
      }

      showInfoPanel(buttonPos) {
        if (!this.infoPanel) {
          // Create the canvas for the texture
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 1024;
          const ctx = canvas.getContext('2d');

          // Draw Background (Glassmorphism style)
          ctx.fillStyle = 'rgba(20, 30, 40, 0.85)';
          ctx.beginPath();
          ctx.roundRect(0, 0, 1024, 1024, 50);
          ctx.fill();
          
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
          ctx.lineWidth = 10;
          ctx.stroke();

          // Draw Image (logo.png)
          const img = new Image();
          img.src = 'logo.png';
          img.onload = () => {
            ctx.drawImage(img, 262, 100, 500, 500);
            
            // Draw Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 60px "Helvetica Neue", Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('الكتابة المسمارية', 512, 700);
            
            ctx.font = '40px "Helvetica Neue", Helvetica, Arial, sans-serif';
            ctx.fillStyle = '#cccccc';
            ctx.fillText('هنا تجد نقوشاً قديمة من قصر اسرحدون.', 512, 800);
            ctx.fillText('انقر في أي مكان للإغلاق.', 512, 870);

            // Update Texture
            if (this.infoPanel && this.infoPanel.material.map) {
              this.infoPanel.material.map.needsUpdate = true;
            }
          };

          // Fallback text before image loads
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
            depthTest: false // Ensures it renders over walls
          });
          
          this.infoPanel = new THREE.Mesh(panelGeom, panelMat);
          this.infoPanel.renderOrder = 999;
          this.scene.add(this.infoPanel);
        }

        // Position panel in front of the button, facing camera
        this.infoPanel.position.copy(buttonPos);
        // Move it slightly towards the center of the room to avoid clipping into the wall
        this.infoPanel.position.z += 2.0; 
        this.infoPanel.position.x += 1.0;
        
        // Make it look at the camera
        this.infoPanel.lookAt(this.camera.position);
        
        this.infoPanel.visible = true;
        this.infoPanel.scale.set(0.1, 0.1, 0.1);
        
        // Simple scale animation logic will be in render loop
        this.infoPanel.userData.targetScale = 1.0;
      }

      setupEnvironment(model) {"""

if methods_hook in content and "createInteractiveElements()" not in content:
    content = content.replace(methods_hook, new_methods)

# 4. Inject animation logic into render()
render_hook = """        if (this.controlManager) {"""
render_anim = """        // Animate interactive elements
        const time = performance.now() * 0.002;
        this.interactables.forEach(obj => {
          if (obj.userData.isButton) {
            obj.position.y = obj.userData.baseY + Math.sin(time) * 0.15;
            obj.rotation.y += 0.02;
          }
        });
        
        // Animate Info Panel scale
        if (this.infoPanel && this.infoPanel.visible) {
          const target = this.infoPanel.userData.targetScale;
          this.infoPanel.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
          // Keep it facing camera if moving
          this.infoPanel.lookAt(this.camera.position);
        }

        if (this.controlManager) {"""

if render_hook in content and "Animate Info Panel scale" not in content:
    content = content.replace(render_hook, render_anim)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("winged_bulls.html interactive UI added successfully!")
