import re

filepath = 'winged_bulls.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update eyeHeight to 10
content = re.sub(r'this\.eyeHeight = [0-9.]+;', 'this.eyeHeight = 10.0;', content)
content = re.sub(r'controlManager\.eyeHeight = [0-9.]+;', 'controlManager.eyeHeight = 10.0;', content)
content = re.sub(r'new THREE\.Vector3\(11\.23, [0-9.]+, 5\.54\)', 'new THREE.Vector3(11.23, 10.0, 5.54)', content)

# 2. Add floorMesh logic back to setColliders
old_colliders_start = """      setColliders(colliders) {
        this.colliders = colliders || [];
        if (this.wallMesh) {
          if (this.wallMesh.geometry) this.wallMesh.geometry.dispose();
          if (this.wallMesh.material) this.wallMesh.material.dispose();
          this.wallMesh = null;
        }"""

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
        }"""

if old_colliders_start in content:
    content = content.replace(old_colliders_start, new_colliders_start)

# Ensure arrays are defined
if 'const floorPositions = [];' not in content:
    content = content.replace('const wallPositions = [];', 'const wallPositions = [];\n        const floorPositions = [];')

# 3. Add height filter and floor detection logic
old_triangle_check = """            // Calculate triangle normal in world space
            cb.subVectors(vC, vB);
            ab.subVectors(vA, vB);
            norm.crossVectors(cb, ab).normalize();

            // Wall check: normal must be substantially horizontal (|normal.y| < 0.95)
            if (Math.abs(norm.y) < 0.95) {
              wallPositions.push(
                vA.x, vA.y, vA.z,
                vB.x, vB.y, vB.z,
                vC.x, vC.y, vC.z
              );
            }"""

new_triangle_check = """            // Calculate triangle normal in world space
            cb.subVectors(vC, vB);
            ab.subVectors(vA, vB);
            norm.crossVectors(cb, ab).normalize();

            // Optimize: Skip if triangle is out of interaction bounds
            const minY = Math.min(vA.y, vB.y, vC.y);
            const maxY = Math.max(vA.y, vB.y, vC.y);
            if (minY > 15.0 || maxY < -2.0) continue;

            if (Math.abs(norm.y) < 0.9) {
              wallPositions.push(vA.x, vA.y, vA.z, vB.x, vB.y, vB.z, vC.x, vC.y, vC.z);
            } else if (norm.y > 0.9) {
              floorPositions.push(vA.x, vA.y, vA.z, vB.x, vB.y, vB.z, vC.x, vC.y, vC.z);
            }"""

if old_triangle_check in content:
    content = content.replace(old_triangle_check, new_triangle_check)

# 4. Ensure floorMesh is built
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
        }
        if (typeof floorPositions !== 'undefined' && floorPositions.length > 0) {
          const floorGeom = new THREE.BufferGeometry();
          floorGeom.setAttribute('position', new THREE.Float32BufferAttribute(floorPositions, 3));
          floorGeom.computeBoundingSphere();
          floorGeom.computeBoundingBox();
          this.floorMesh = new THREE.Mesh(floorGeom, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
        }"""

if old_build_mesh in content:
    content = content.replace(old_build_mesh, new_build_mesh)

# 5. Bring back floor collision every frame for smooth terrain tracking (no stuttery staggering)
old_move = """        // --- Handle Gravity (Perfectly Flat Flight) ---
        const targetY = this.eyeHeight; // Lock to exactly eyeHeight (no bouncing on terrain)"""

new_move = """        // --- Handle Floor Collision & Gravity ---
        let groundY = 0;
        if (this.floorMesh) {
          // Cast ray down to feel the terrain instantly (No staggering to avoid stutter)
          this._rayOrigin.set(this.camera.position.x, this.camera.position.y + 2.0, this.camera.position.z);
          this.raycaster.set(this._rayOrigin, new THREE.Vector3(0, -1, 0));
          this.raycaster.far = 100;
          const hits = this.raycaster.intersectObject(this.floorMesh, false);
          if (hits.length > 0) {
            groundY = hits[0].point.y;
          }
        }

        // Apply a very fast smoothing so it doesn't snap instantly, creating a smooth terrain tracking feel
        if (this.groundY === undefined) this.groundY = groundY;
        this.groundY += (groundY - this.groundY) * 0.4; // 40% interpolation per frame = super smooth
        const targetY = this.groundY + this.eyeHeight;

        if (this.isJumping) {
          this.jumpVelocity -= this.gravity * delta;
          this.camera.position.y += this.jumpVelocity * delta;
          
          if (this.camera.position.y <= targetY) {
            this.camera.position.y = targetY;
            this.isJumping = false;
            this.jumpVelocity = 0;
          }
        } else if (this.lockHeight) {
          this.camera.position.y = targetY;
        }"""

if old_move in content:
    content = content.replace(old_move, new_move)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("winged_bulls.html updated for smooth terrain tracking successfully!")
