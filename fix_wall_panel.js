const fs = require('fs');

let content = fs.readFileSync('winged_bulls.html', 'utf8');

// 1. Fix render loop: Remove lookAt, handle close animation
const renderOld = /if \(this\.infoPanel && this\.infoPanel\.visible\) \{[\s\S]*?this\.composer \? this\.composer\.render\(\) : this\.renderer\.render\(this\.scene, this\.camera\);/;
const renderNew = `if (this.infoPanel && this.infoPanel.visible) {
          const target = this.infoPanel.userData.targetScale;
          // Smoothly lerp scale for open/close animation
          this.infoPanel.scale.lerp(new THREE.Vector3(target, target, target), 0.15);
          
          // If closing and scale is very small, hide it completely
          if (target === 0.0 && this.infoPanel.scale.x < 0.01) {
            this.infoPanel.visible = false;
          }
          // REMOVED: lookAt(camera) so it stays fixed to the wall!
        }
        
        this.composer ? this.composer.render() : this.renderer.render(this.scene, this.camera);`;
content = content.replace(renderOld, renderNew);

// 2. Fix showInfoPanel: Set fixed position/rotation and open animation
const showOld = /this\.infoPanel\.position\.copy\(buttonPos\);[\s\S]*?this\.infoPanel\.userData\.targetScale = 1\.0;\n      \}/;
const showNew = `// Position it slightly in front of the button
        this.infoPanel.position.set(buttonPos.x, buttonPos.y, buttonPos.z + 0.5);
        // Fixed rotation: face directly forward (positive Z)
        this.infoPanel.rotation.set(0, 0, 0);
        
        // Start animation from scale 0
        this.infoPanel.visible = true;
        this.infoPanel.scale.set(0.001, 0.001, 0.001);
        this.infoPanel.userData.targetScale = 1.0;
      }`;
content = content.replace(showOld, showNew);

// 3. Fix onPointerDown: Set targetScale to 0 instead of hiding instantly
const pointerOld = /if \(uv\.x > 0\.85 && uv\.y > 0\.85\) \{\n\s*this\.infoPanel\.visible = false;\n\s*\}/;
const pointerNew = `if (uv.x > 0.85 && uv.y > 0.85) {
               // Trigger close animation
               this.infoPanel.userData.targetScale = 0.0;
            }`;
content = content.replace(pointerOld, pointerNew);

fs.writeFileSync('winged_bulls.html', content);
console.log('Fixed panel to wall and added close animation.');
