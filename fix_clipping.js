const fs = require('fs');

let content = fs.readFileSync('winged_bulls.html', 'utf8');

// 1. Fix showInfoPanel: Make smaller (7x7), fix placement and rotation
const showOld = /\/\/ Position it slightly in front of the button[\s\S]*?this\.infoPanel\.userData\.targetScale = 1\.0;\n      \}/;
const showNew = `// Start at button position
        this.infoPanel.position.copy(buttonPos);
        
        // Calculate direction to camera and move it towards the camera so it doesn't clip into the wall
        const dir = new THREE.Vector3().subVectors(this.camera.position, this.infoPanel.position).normalize();
        
        // Move it 1.5 meters towards the user
        this.infoPanel.position.addScaledVector(dir, 1.5);
        
        // Face the camera directly (it will stay fixed in this orientation after opening)
        this.infoPanel.lookAt(this.camera.position);
        
        // Start animation from scale 0
        this.infoPanel.visible = true;
        this.infoPanel.scale.set(0.001, 0.001, 0.001);
        this.infoPanel.userData.targetScale = 1.0;
      }`;
content = content.replace(showOld, showNew);

// 2. Change geometry size to 7x7 and disable depthTest to guarantee it never clips
const geomOld = /const panelGeom = new THREE\.PlaneGeometry\(12, 12\);[\s\S]*?depthTest: true, \/\/ Enable depth test so it can be occluded by walls if necessary/;
const geomNew = `const panelGeom = new THREE.PlaneGeometry(6.5, 6.5);
          const panelMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            depthTest: false, // Disabled depth test so it always renders on top of the wall cleanly`;
content = content.replace(geomOld, geomNew);

fs.writeFileSync('winged_bulls.html', content);
console.log('Fixed panel size and clipping.');
