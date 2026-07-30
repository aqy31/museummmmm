const fs = require('fs');

let content = fs.readFileSync('winged_bulls.html', 'utf8');

// 1. Inject animation logic inside render()
const renderTarget = "this.composer ? this.composer.render() : this.renderer.render(this.scene, this.camera);";
const renderCode = `
        if (this.interactables) {
          const time = performance.now() * 0.002;
          this.interactables.forEach(obj => {
            if (obj.userData.isButton) {
              obj.position.y = obj.userData.baseY + Math.sin(time) * 0.15;
            }
          });
        }
        
        if (this.infoPanel && this.infoPanel.visible) {
          const target = this.infoPanel.userData.targetScale;
          this.infoPanel.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
          // Only update lookAt if the target scale is reached or close, to avoid jittering
          this.infoPanel.lookAt(this.camera.position);
        }
        
        this.composer ? this.composer.render() : this.renderer.render(this.scene, this.camera);`;
content = content.replace(renderTarget, renderCode);

// 2. Update Info Panel: More transparent, "X" close button, and make it huge
const oldPanel = /showInfoPanel\(buttonPos\) \{[\s\S]*?this\.infoPanel\.userData\.targetScale = 1\.0;\n      \}/;
const newPanel = `showInfoPanel(buttonPos) {
        if (!this.infoPanel) {
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 1024;
          const ctx = canvas.getContext('2d');

          // More transparent grey background
          ctx.fillStyle = 'rgba(60, 60, 60, 0.5)';
          ctx.beginPath();
          ctx.roundRect(0, 0, 1024, 1024, 50);
          ctx.fill();
          
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 20;
          ctx.stroke();

          // Draw "X" button background
          ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.beginPath();
          ctx.arc(950, 70, 40, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 50px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('X', 950, 75);

          const img = new Image();
          img.src = 'logo.png';
          img.onload = () => {
            // Clear space for image
            ctx.fillStyle = 'rgba(60, 60, 60, 0.5)';
            ctx.fill();
            ctx.stroke();
            
            // Draw X again
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(950, 70, 40, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = 'white';
            ctx.fillText('X', 950, 75);
            
            // Image
            ctx.drawImage(img, 112, 100, 800, 450); 
            
            // Text
            ctx.fillStyle = 'black';
            ctx.font = 'bold 70px "Helvetica Neue", Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('عنوان الصورة (سيتم التعديل)', 512, 650);
            
            ctx.font = 'bold 45px "Helvetica Neue", Helvetica, Arial, sans-serif';
            ctx.fillStyle = '#222222';
            ctx.fillText('هنا سيتم وضع المعلومات والتفاصيل التي ستعطيني إياها.', 512, 750);
            ctx.fillText('يمكنك قراءتها بوضوح من هنا.', 512, 820);
            
            if (this.infoPanel && this.infoPanel.material.map) {
              this.infoPanel.material.map.needsUpdate = true;
            }
          };

          ctx.fillStyle = 'black';
          ctx.font = 'bold 60px "Helvetica Neue", Helvetica, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText('جاري التحميل...', 512, 512);

          const texture = new THREE.CanvasTexture(canvas);
          texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
          
          // Geometry - bigger! 12x12
          const panelGeom = new THREE.PlaneGeometry(12, 12);
          const panelMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            depthTest: true, // Enable depth test so it can be occluded by walls if necessary
            depthWrite: false
          });
          
          this.infoPanel = new THREE.Mesh(panelGeom, panelMat);
          this.infoPanel.userData.isInfoPanel = true;
          this.scene.add(this.infoPanel);
          // Add to interactables so we can click the X
          this.interactables.push(this.infoPanel);
        }

        this.infoPanel.position.copy(buttonPos);
        // Calculate direction from panel to camera
        const dir = new THREE.Vector3().subVectors(this.camera.position, this.infoPanel.position).normalize();
        // Move it 2 meters towards the camera
        this.infoPanel.position.addScaledVector(dir, 2.0);
        
        this.infoPanel.lookAt(this.camera.position);
        
        this.infoPanel.visible = true;
        this.infoPanel.scale.set(0.1, 0.1, 0.1);
        this.infoPanel.userData.targetScale = 1.0;
      }`;
content = content.replace(oldPanel, newPanel);

// 3. Update pointerDown to handle UV X clicking
const oldPointer = /onPointerDown\(event\) \{[\s\S]*?this\.infoPanel\.visible = false;\n        \}\n      \}/;
const newPointer = `onPointerDown(event) {
        if (!this.uiRaycaster || !this.interactables) return;
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.uiRaycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.uiRaycaster.intersectObjects(this.interactables, false);

        if (intersects.length > 0) {
          const object = intersects[0].object;
          if (object.userData && object.userData.isButton) {
            object.userData.onClick();
          } else if (object.userData && object.userData.isInfoPanel && this.infoPanel.visible) {
            // Check if they clicked the X button (top right corner)
            const uv = intersects[0].uv;
            // X button is around uv.x > 0.85 and uv.y > 0.85
            if (uv.x > 0.85 && uv.y > 0.85) {
               this.infoPanel.visible = false;
            }
          }
        }
      }`;
content = content.replace(oldPointer, newPointer);

fs.writeFileSync('winged_bulls.html', content);
console.log('UI animation fixed');
