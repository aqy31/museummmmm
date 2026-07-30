const fs = require('fs');

let content = fs.readFileSync('winged_bulls.html', 'utf8');

// 1. Update the button creation
const oldCreate = /createInteractiveElements\(\) \{[\s\S]*?this\.interactables\.push\(buttonMesh\);\n      \}/;
const newCreate = `createInteractiveElements() {
        // Create Canvas for Button "1"
        const btnCanvas = document.createElement('canvas');
        btnCanvas.width = 256;
        btnCanvas.height = 256;
        const btnCtx = btnCanvas.getContext('2d');
        
        // Draw black circle
        btnCtx.beginPath();
        btnCtx.arc(128, 128, 120, 0, 2 * Math.PI);
        btnCtx.fillStyle = 'rgba(20, 20, 20, 0.9)'; // Dark black/grey
        btnCtx.fill();
        btnCtx.lineWidth = 10;
        btnCtx.strokeStyle = 'white';
        btnCtx.stroke();
        
        // Draw "1"
        btnCtx.fillStyle = 'white';
        btnCtx.font = 'bold 120px Arial';
        btnCtx.textAlign = 'center';
        btnCtx.textBaseline = 'middle';
        btnCtx.fillText('1', 128, 128);

        const btnTex = new THREE.CanvasTexture(btnCanvas);
        const btnMat = new THREE.SpriteMaterial({ map: btnTex, color: 0xffffff });
        const buttonSprite = new THREE.Sprite(btnMat);
        
        // Set new position
        buttonSprite.position.set(-3.92, 11.08, -5.19);
        buttonSprite.scale.set(1.5, 1.5, 1.5); // Size of the button
        
        buttonSprite.userData = {
          baseY: 11.08,
          isButton: true,
          onClick: () => {
            this.showInfoPanel(buttonSprite.position);
          }
        };
        
        this.scene.add(buttonSprite);
        this.interactables.push(buttonSprite);
      }`;
content = content.replace(oldCreate, newCreate);

// 2. Update Info Panel Style and Size
const oldPanel = /showInfoPanel\(buttonPos\) \{[\s\S]*?this\.infoPanel\.userData\.targetScale = 1\.0;\n      \}/;
const newPanel = `showInfoPanel(buttonPos) {
        if (!this.infoPanel) {
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 1024;
          const ctx = canvas.getContext('2d');

          // Grey transparent background with black outline
          ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
          ctx.beginPath();
          ctx.roundRect(0, 0, 1024, 1024, 50);
          ctx.fill();
          
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 20;
          ctx.stroke();

          const img = new Image();
          img.src = 'logo.png';
          img.onload = () => {
            // Clear space for image
            ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
            ctx.fill();
            ctx.stroke();
            
            // Image at top
            ctx.drawImage(img, 112, 100, 800, 450); // Wider image area
            
            // Text below image
            ctx.fillStyle = 'black';
            ctx.font = 'bold 70px "Helvetica Neue", Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('عنوان الصورة (سيتم التعديل)', 512, 650);
            
            ctx.font = 'bold 45px "Helvetica Neue", Helvetica, Arial, sans-serif';
            ctx.fillStyle = '#222222';
            ctx.fillText('هنا سيتم وضع المعلومات والتفاصيل التي ستعطيني إياها.', 512, 750);
            ctx.fillText('يمكنك قراءتها بوضوح من هنا.', 512, 820);
            
            // Close hint
            ctx.fillStyle = '#000000';
            ctx.font = '35px Arial';
            ctx.fillText('(انقر لإغلاق النافذة)', 512, 950);
            
            if (this.infoPanel && this.infoPanel.material.map) {
              this.infoPanel.material.map.needsUpdate = true;
            }
          };

          ctx.fillStyle = 'black';
          ctx.font = 'bold 60px "Helvetica Neue", Helvetica, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('جاري التحميل...', 512, 512);

          const texture = new THREE.CanvasTexture(canvas);
          texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
          
          // Make panel very big (10x10 meters in world)
          const panelGeom = new THREE.PlaneGeometry(10, 10);
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
        // Move it slightly towards the user so it doesn't clip into the wall
        this.infoPanel.position.z += 2.5; 
        this.infoPanel.position.x += 1.5;
        this.infoPanel.position.y += 1.0; // Lift it up a bit to be at eye level
        this.infoPanel.lookAt(this.camera.position);
        
        this.infoPanel.visible = true;
        this.infoPanel.scale.set(0.1, 0.1, 0.1);
        this.infoPanel.userData.targetScale = 1.0;
      }`;
content = content.replace(oldPanel, newPanel);

fs.writeFileSync('winged_bulls.html', content);
console.log('UI updated');
