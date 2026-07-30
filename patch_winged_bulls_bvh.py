import re

filepath = 'winged_bulls.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import for three-mesh-bvh
old_imports = """    import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';"""

new_imports = """    import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
    import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
    
    // Inject BVH into Three.js
    THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
    THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
    THREE.Mesh.prototype.raycast = acceleratedRaycast;"""

if old_imports in content:
    content = content.replace(old_imports, new_imports)
else:
    print("WARNING: Could not find imports block")

# 2. Add computeBoundsTree to wallGeom and floorGeom
content = re.sub(r'wallGeom\.computeBoundingSphere\(\);', 'wallGeom.computeBoundingSphere();\n          wallGeom.computeBoundsTree();', content)
content = re.sub(r'floorGeom\.computeBoundingSphere\(\);', 'floorGeom.computeBoundingSphere();\n          floorGeom.computeBoundsTree();', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("winged_bulls.html BVH added successfully!")
