import re

filepath = 'tutunji_house_iwan.html'

with open(filepath, 'r', encoding='utf-8') as file:
    content = file.read()

# Replace using regex from the start of the block to the end of it
pattern = r"// --- Ultra-Fast Wall Collision \(0\.01ms\) ---.*?this\.velocity\.z \*= 0\.05;\n\s*\}\n\s*\}"

new_block = """// --- Ultra-Fast Wall Collision (0.01ms) ---
        if (this.wallMesh && moveDist > 0.001) {
          const playerRadius = 3.5; 
          const rayFar = moveDist + playerRadius;
          this._rayDir.set(stepX, 0, stepZ).normalize();

          // Check at two different heights to ensure we don't miss the wall
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
              this.velocity.x *= 0.05;
              this.velocity.z *= 0.05;
              return;
            }
          }
        }"""

if re.search(pattern, content, flags=re.DOTALL):
    content = re.sub(pattern, new_block, content, flags=re.DOTALL)
    print("Properly patched dual-ray collision for tutunji via regex!")
else:
    print("WARNING: Could not find exact old block again using regex!")

with open(filepath, 'w', encoding='utf-8') as file:
    file.write(content)
