import re

filepath = 'tutunji_house_iwan.html'

with open(filepath, 'r', encoding='utf-8') as file:
    content = file.read()

# 1. Add eyeHeight and bounds
load_model_old = "controlManager.setColliders(sceneManager.colliders);"
load_model_new = """controlManager.setColliders(sceneManager.colliders);
        
        // Custom constraints for Tutunji Iwan
        controlManager.eyeHeight = 4.0;
        const bounds = box.clone();
        bounds.expandByScalar(-0.6); // Shrink slightly to keep camera inside
        controlManager.bounds = bounds;"""

if load_model_old in content:
    content = content.replace(load_model_old, load_model_new)
else:
    print("WARNING: Could not find setColliders!")

with open(filepath, 'w', encoding='utf-8') as file:
    file.write(content)

print("Applied missing physics variables (eyeHeight=4.0 and bounds)!")
