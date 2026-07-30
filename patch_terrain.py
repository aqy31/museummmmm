import re

filepath = 'tutunji_house_iwan.html'

with open(filepath, 'r', encoding='utf-8') as file:
    content = file.read()

# 1. Update Entrance Coordinates to y=6.0
content = re.sub(r'const entrancePos = new THREE\.Vector3\(5\.25,\s*4\.0,\s*1\.06\);', 'const entrancePos = new THREE.Vector3(5.25, 6.0, 1.06);', content)
content = re.sub(r'const entranceLookAt = new THREE\.Vector3\(5\.25,\s*4\.0,\s*-5\.0\);', 'const entranceLookAt = new THREE.Vector3(5.25, 6.0, -5.0);', content)

# 2. Update eyeHeight to 6.0
content = content.replace("controlManager.eyeHeight = 4.0;", "controlManager.eyeHeight = 6.0;")

# 3. Replace Gravity / Jump handling with Dynamic Terrain Following
old_physics = """// --- Handle Jump / Gravity ---
        if (this.isJumping) {
          this.jumpVelocity -= this.gravity * delta;
          this.camera.position.y += this.jumpVelocity * delta;
          if (this.camera.position.y <= this.eyeHeight) {
            this.camera.position.y = this.eyeHeight;
            this.isJumping = false;
            this.jumpVelocity = 0;
          }
        } else if (this.lockHeight) {
          this.camera.position.y = this.eyeHeight;
        }"""

new_physics = """// --- Dynamic Terrain Following (Floor Raycasting) ---
        let currentEyeHeight = this.eyeHeight;
        
        if (this.colliders && this.colliders.length > 0) {
          const rayOrigin = this.camera.position.clone();
          rayOrigin.y += 10.0; // Start ray 10 units above current camera
          
          this.raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));
          const intersects = this.raycaster.intersectObjects(this.colliders, true);
          
          if (intersects.length > 0) {
             currentEyeHeight = intersects[0].point.y + this.eyeHeight;
          }
        }

        // --- Handle Jump / Gravity ---
        if (this.isJumping) {
          this.jumpVelocity -= this.gravity * delta;
          this.camera.position.y += this.jumpVelocity * delta;
          if (this.camera.position.y <= currentEyeHeight) {
            this.camera.position.y = currentEyeHeight;
            this.isJumping = false;
            this.jumpVelocity = 0;
          }
        } else if (this.lockHeight) {
          // Smoothly interpolate to the target floor height for stair/ramp climbing feel
          this.camera.position.y += (currentEyeHeight - this.camera.position.y) * 10.0 * delta;
        }"""

content = content.replace(old_physics, new_physics)

with open(filepath, 'w', encoding='utf-8') as file:
    file.write(content)

print("Applied dynamic terrain following and updated eyeHeight to 6.0!")
