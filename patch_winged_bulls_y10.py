import re

filepath = 'winged_bulls.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update eyeHeight to 10.0
content = re.sub(r'this\.eyeHeight = 12\.0;', 'this.eyeHeight = 10.0;', content)
content = re.sub(r'controlManager\.eyeHeight = 12\.0;', 'controlManager.eyeHeight = 10.0;', content)

# 2. Update entrancePos y to 10
content = re.sub(r'new THREE\.Vector3\(11\.23, 12\.0, 5\.54\)', 'new THREE.Vector3(11.23, 10.0, 5.54)', content)

# 3. Completely remove the bumpy floor raycast logic, making it perfectly level
old_move = """        // --- Handle Floor Collision (Staggered for 120 FPS) & Gravity ---
        if (this.groundY === undefined) {
          this.groundY = 0;
          this.targetGroundY = 0;
          this.frameCount = 0;
        }
        
        this.frameCount++;
        
        // Only run expensive downward raycast every 4 frames (massively saves CPU)
        if (this.floorMesh && this.frameCount % 4 === 0) {
          this._rayOrigin.set(this.camera.position.x, this.camera.position.y + 1.0, this.camera.position.z);
          this.raycaster.set(this._rayOrigin, new THREE.Vector3(0, -1, 0));
          this.raycaster.far = 20;
          const hits = this.raycaster.intersectObject(this.floorMesh, false);
          if (hits.length > 0) {
            this.targetGroundY = hits[0].point.y;
          }
        }

        // Smoothly transition floor height for buttery smooth terrain walking
        this.groundY += (this.targetGroundY - this.groundY) * 0.15;
        const targetY = this.groundY + this.eyeHeight;"""

new_move = """        // --- Handle Gravity (Perfectly Flat Flight) ---
        const targetY = this.eyeHeight; // Lock to exactly eyeHeight (no bouncing on terrain)"""

if old_move in content:
    content = content.replace(old_move, new_move)
else:
    print("WARNING: Could not find old_move block")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("winged_bulls.html updated for y=10 and flat flight successfully!")
