import re

filepath = 'tutunji_house_iwan.html'

with open(filepath, 'r', encoding='utf-8') as file:
    content = file.read()

# Replace the collision block to use this.colliders instead of this.wallMesh
old_block = """        // --- Ultra-Fast Wall Collision (0.01ms) ---
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
          }"""

new_block = """        // --- Ultimate Impenetrable Wall Collision ---
        if (this.colliders && this.colliders.length > 0 && moveDist > 0.001) {
          const playerRadius = 1.5; // Reasonable size to fit through doors but thick enough
          const rayFar = moveDist + playerRadius;
          this._rayDir.set(stepX, 0, stepZ).normalize();

          // Check at multiple heights to ensure we don't miss the wall
          const heights = [this.camera.position.y - 1.0, this.camera.position.y - 2.5, this.camera.position.y - 4.0];
          let collisionDetected = false;
          let minSafeDist = moveDist;

          for (let h of heights) {
            this._rayOrigin.set(this.camera.position.x, h, this.camera.position.z);
            this.raycaster.set(this._rayOrigin, this._rayDir);
            this.raycaster.far = rayFar;
            this.raycaster.near = 0;
            // Check against ALL models in the scene, not just extracted walls
            const hits = this.raycaster.intersectObjects(this.colliders, true);
            if (hits.length > 0 && hits[0].distance < rayFar) {
              collisionDetected = true;
              const safeDist = Math.max(0, hits[0].distance - playerRadius);
              if (safeDist < minSafeDist) minSafeDist = safeDist;
            }
          }"""

if old_block in content:
    content = content.replace(old_block, new_block)
    print("Patched to use this.colliders directly for ultimate collision.")
else:
    print("WARNING: Could not find old block to replace!")

with open(filepath, 'w', encoding='utf-8') as file:
    file.write(content)
