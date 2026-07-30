import re

filepath = 'tutunji_house_iwan.html'

with open(filepath, 'r', encoding='utf-8') as file:
    content = file.read()

# 1. Update setColliders to capture more triangles as walls
content = content.replace("if (Math.abs(norm.y) < 0.7) {", "if (Math.abs(norm.y) < 0.95) {")

# 2. Shrink the bounds drastically to create an invisible safety fence
content = content.replace("bounds.expandByScalar(-0.6);", "bounds.expandByScalar(-3.5);")

# 3. Increase playerRadius even more and cast two rays for collision
old_collision = """        // --- Ultra-Fast Wall Collision (0.01ms) ---
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

          const intersects = this.raycaster.intersectObject(this.wallMesh, false);
          if (intersects.length > 0) {
            // Collision detected! Stop movement in that direction.
            return;
          }
        }"""

new_collision = """        // --- Ultra-Fast Wall Collision (0.01ms) ---
        if (this.wallMesh && moveDist > 0.001) {
          const playerRadius = 3.5; 
          const rayFar = moveDist + playerRadius;
          this._rayDir.set(stepX, 0, stepZ).normalize();

          // Check at two different heights to ensure we don't miss the wall
          const heights = [this.camera.position.y - 1.0, this.camera.position.y - 3.5];
          let collisionDetected = false;

          for (let h of heights) {
            this._rayOrigin.set(this.camera.position.x, h, this.camera.position.z);
            this.raycaster.set(this._rayOrigin, this._rayDir);
            this.raycaster.far = rayFar;
            this.raycaster.near = 0;
            const intersects = this.raycaster.intersectObject(this.wallMesh, false);
            if (intersects.length > 0) {
              collisionDetected = true;
              break;
            }
          }

          if (collisionDetected) {
            return; // Stop movement completely
          }
        }"""

if old_collision in content:
    content = content.replace(old_collision, new_collision)
else:
    print("WARNING: Could not find old collision block to replace!")

with open(filepath, 'w', encoding='utf-8') as file:
    file.write(content)

print("Applied robust wall collision (norm.y < 0.95, bounds=-3.5, 2 rays)!")
