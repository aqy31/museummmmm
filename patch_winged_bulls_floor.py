import re

filepath = 'winged_bulls.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update eyeHeight to 7.0
content = re.sub(r'this\.eyeHeight = [0-9.]+;', 'this.eyeHeight = 7.0;', content)
content = re.sub(r'controlManager\.eyeHeight = [0-9.]+;', 'controlManager.eyeHeight = 7.0;', content)
content = re.sub(r'new THREE\.Vector3\(11\.23, 5, 5\.54\)', 'new THREE.Vector3(11.23, 7.0, 5.54)', content)

# 2. Add floorMesh logic to setColliders
old_colliders_start = """      setColliders(colliders) {
        this.colliders = colliders || [];
        if (this.wallMesh) {
          if (this.wallMesh.geometry) this.wallMesh.geometry.dispose();
          if (this.wallMesh.material) this.wallMesh.material.dispose();
          this.wallMesh = null;
        }

        const wallPositions = [];"""

new_colliders_start = """      setColliders(colliders) {
        this.colliders = colliders || [];
        if (this.wallMesh) {
          if (this.wallMesh.geometry) this.wallMesh.geometry.dispose();
          if (this.wallMesh.material) this.wallMesh.material.dispose();
          this.wallMesh = null;
        }
        if (this.floorMesh) {
          if (this.floorMesh.geometry) this.floorMesh.geometry.dispose();
          if (this.floorMesh.material) this.floorMesh.material.dispose();
          this.floorMesh = null;
        }

        const wallPositions = [];
        const floorPositions = [];"""

content = content.replace(old_colliders_start, new_colliders_start)

# 3. Add floor triangles to floorPositions
old_triangle_check = """            // Wall check: normal must be substantially horizontal (|normal.y| < 0.95)
            if (Math.abs(norm.y) < 0.95) {
              wallPositions.push(
                vA.x, vA.y, vA.z,
                vB.x, vB.y, vB.z,
                vC.x, vC.y, vC.z
              );
            }"""

new_triangle_check = """            // Wall check: normal must be substantially horizontal (|normal.y| < 0.95)
            if (Math.abs(norm.y) < 0.95) {
              wallPositions.push(
                vA.x, vA.y, vA.z,
                vB.x, vB.y, vB.z,
                vC.x, vC.y, vC.z
              );
            } else {
              // Floor/Ceiling check
              floorPositions.push(
                vA.x, vA.y, vA.z,
                vB.x, vB.y, vB.z,
                vC.x, vC.y, vC.z
              );
            }"""

content = content.replace(old_triangle_check, new_triangle_check)

# 4. Build floorMesh
old_build_mesh = """        if (wallPositions.length > 0) {
          const wallGeom = new THREE.BufferGeometry();
          wallGeom.setAttribute('position', new THREE.Float32BufferAttribute(wallPositions, 3));
          wallGeom.computeBoundingSphere();
          wallGeom.computeBoundingBox();
          this.wallMesh = new THREE.Mesh(wallGeom, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
          console.log('[WallMesh] Created ultra-fast wall collider mesh with', wallPositions.length / 9, 'triangles');
        }"""

new_build_mesh = """        if (wallPositions.length > 0) {
          const wallGeom = new THREE.BufferGeometry();
          wallGeom.setAttribute('position', new THREE.Float32BufferAttribute(wallPositions, 3));
          wallGeom.computeBoundingSphere();
          wallGeom.computeBoundingBox();
          this.wallMesh = new THREE.Mesh(wallGeom, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
          console.log('[WallMesh] Created ultra-fast wall collider mesh with', wallPositions.length / 9, 'triangles');
        }
        if (floorPositions.length > 0) {
          const floorGeom = new THREE.BufferGeometry();
          floorGeom.setAttribute('position', new THREE.Float32BufferAttribute(floorPositions, 3));
          floorGeom.computeBoundingSphere();
          floorGeom.computeBoundingBox();
          this.floorMesh = new THREE.Mesh(floorGeom, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
          console.log('[FloorMesh] Created ultra-fast floor collider mesh with', floorPositions.length / 9, 'triangles');
        }"""

content = content.replace(old_build_mesh, new_build_mesh)

# 5. Add Gravity/Floor collision to applyCollisionAndMove
old_move = """        // --- Handle Jump / Gravity ---
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

new_move = """        // --- Handle Floor Collision & Gravity ---
        let groundY = 0; // Default floor level
        if (this.floorMesh) {
          // Cast ray straight down from player's head
          this._rayOrigin.set(this.camera.position.x, this.camera.position.y + 1.0, this.camera.position.z);
          this.raycaster.set(this._rayOrigin, new THREE.Vector3(0, -1, 0));
          this.raycaster.far = 100;
          const hits = this.raycaster.intersectObject(this.floorMesh, false);
          if (hits.length > 0) {
            groundY = hits[0].point.y;
          }
        }

        const targetY = groundY + this.eyeHeight;

        if (this.isJumping) {
          this.jumpVelocity -= this.gravity * delta;
          this.camera.position.y += this.jumpVelocity * delta;
          
          // Landing logic
          if (this.camera.position.y <= targetY) {
            this.camera.position.y = targetY;
            this.isJumping = false;
            this.jumpVelocity = 0;
          }
        } else if (this.lockHeight) {
          // Always stay exactly at eyeHeight above the physical model floor
          this.camera.position.y = targetY;
        }"""

content = content.replace(old_move, new_move)

# Remove the height filter from setColliders since we now rely on floorMesh and wallMesh to span everything the user might hit
content = re.sub(r'if \(maxY < 1\.0 \|\| minY > 6\.0\) continue;', '', content)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("winged_bulls.html floor collision updated successfully!")
