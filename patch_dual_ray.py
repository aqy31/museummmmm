import re

filepath = 'tutunji_house_iwan.html'

with open(filepath, 'r', encoding='utf-8') as file:
    content = file.read()

# Replace the collision logic
old_block = """        // --- Ultra-Fast Wall Collision (0.01ms) ---
        if (this.wallMesh && moveDist > 0.001) {
          const playerRadius = 2.0; // Increased radius for giant model
          const waistY = this.camera.position.y - (this.eyeHeight / 2.0); // Dynamic waist height
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
              return; // Stop further processing
            }
          }
        }"""

new_block = """        // --- Ultra-Fast Wall Collision (0.01ms) ---
        if (this.wallMesh && moveDist > 0.001) {
          const playerRadius = 3.5; 
          const rayFar = moveDist + playerRadius;
          this._rayDir.set(stepX, 0, stepZ).normalize();

          const heights = [this.camera.position.y - 1.0, this.camera.position.y - 3.5];
          let collisionDetected = false;
          let minSafeDist = moveDist;

          for (let h of heights) {
            this._rayOrigin.set(this.camera.position.x, h, this.camera.position.z);
            this.raycaster.set(this._rayOrigin, this._rayDir);
            this.raycaster.far = rayFar;
            this.raycaster.near = 0;
            const hits = this.raycaster.intersectObject(this.wallMesh, false);
            if (hits.length > 0 && hits[0].distance < rayFar) {
              collisionDetected = true;
              const safeDist = Math.max(0, hits[0].distance - playerRadius);
              if (safeDist < minSafeDist) minSafeDist = safeDist;
            }
          }

          if (collisionDetected) {
            if (minSafeDist < moveDist) {
              const ratio = minSafeDist / moveDist;
              this.camera.position.x += stepX * ratio;
              this.camera.position.z += stepZ * ratio;
              return;
            }
          }
        }"""

if old_block in content:
    content = content.replace(old_block, new_block)
else:
    print("WARNING: Could not find exact old block again!")
    
with open(filepath, 'w', encoding='utf-8') as file:
    file.write(content)

print("Properly patched dual-ray collision for tutunji!")
