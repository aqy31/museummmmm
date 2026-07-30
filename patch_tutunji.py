import re

filepath = 'tutunji_house_iwan.html'

with open(filepath, 'r', encoding='utf-8') as file:
    content = file.read()

# 1. Update Entrance Coordinates
# const entrancePos = new THREE.Vector3(-17.13, 1.85, -1.31);
# const entranceLookAt = new THREE.Vector3(-10.0, 1.85, 5.0);
content = re.sub(r'const entrancePos = new THREE\.Vector3\([^)]+\);', 'const entrancePos = new THREE.Vector3(5.25, 4.0, 1.06);', content)
content = re.sub(r'const entranceLookAt = new THREE\.Vector3\([^)]+\);', 'const entranceLookAt = new THREE.Vector3(5.25, 4.0, -5.0);', content)

# 2. Add bounds and eyeHeight inside loadModel
load_model_old = r"controlManager\.setColliders\(sceneManager\.colliders\);"
load_model_new = """controlManager.setColliders(sceneManager.colliders);
        // Custom constraints for Tutunji Iwan
        controlManager.eyeHeight = 4.0;
        const bounds = box.clone();
        bounds.expandByScalar(-0.6); // Shrink slightly to keep camera inside
        controlManager.bounds = bounds;"""
content = content.replace(load_model_old, load_model_new)

# 3. Apply the bounds constraint in applyCollisionAndMove
collision_old = r"this\.camera\.position\.x \+= stepX;\n\s*this\.camera\.position\.z \+= stepZ;\n\s*\}"
collision_new = """this.camera.position.x += stepX;
          this.camera.position.z += stepZ;
        }
        
        // Prevent exiting the model boundaries
        if (this.bounds) {
          if (this.camera.position.x < this.bounds.min.x) this.camera.position.x = this.bounds.min.x;
          if (this.camera.position.x > this.bounds.max.x) this.camera.position.x = this.bounds.max.x;
          if (this.camera.position.z < this.bounds.min.z) this.camera.position.z = this.bounds.min.z;
          if (this.camera.position.z > this.bounds.max.z) this.camera.position.z = this.bounds.max.z;
        }"""
content = re.sub(collision_old, collision_new, content)

with open(filepath, 'w', encoding='utf-8') as file:
    file.write(content)

print("Updated tutunji_house_iwan.html exclusively!")
