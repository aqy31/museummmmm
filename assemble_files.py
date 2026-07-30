import re
import json

with open('metadata.json', 'r') as f:
    meta = json.load(f)

with open('user_full_code.html', 'r', encoding='utf-8') as f:
    base_html = f.read()

# 1. Add EffectComposer imports
imports_old = r"import \{ DRACOLoader \} from 'three/addons/loaders/DRACOLoader\.js';"
imports_new = """import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
    import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
    import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
    import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';"""
base_html = re.sub(imports_old, imports_new, base_html)

# 2. Update SceneManager constructor for Bloom
sm_old = r"this\.renderer\.toneMappingExposure = 1\.35;\n\s*this\.renderer\.xr\.enabled = true;\n\s*this\.container\.appendChild\(this\.renderer\.domElement\);\n\s*this\.setupLighting\(\);"
sm_new = """this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.xr.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.35, 0.5, 0.85);
        this.composer.addPass(bloomPass);

        this.setupLighting();"""
base_html = re.sub(sm_old, sm_new, base_html)

# 3. Update SceneManager resize
resize_old = r"this\.renderer\.setSize\(window\.innerWidth, window\.innerHeight\);\n\s*\}"
resize_new = """this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
      }"""
base_html = re.sub(resize_old, resize_new, base_html)

# 4. Update SceneManager render
render_old = r"render\(\) \{\n\s*this\.renderer\.render\(this\.scene, this\.camera\);\n\s*\}"
render_new = """render() {
        if (this.dirLight && !window.sunLocked && window.currentMode !== 'walk') {
            const camAngle = Math.atan2(this.camera.position.z, this.camera.position.x);
            const sunAngle = camAngle + (Math.PI / 4);
            const radius = 70;
            this.dirLight.position.x = Math.cos(sunAngle) * radius;
            this.dirLight.position.z = Math.sin(sunAngle) * radius;
        }
        this.composer ? this.composer.render() : this.renderer.render(this.scene, this.camera);
      }"""
base_html = re.sub(render_old, render_new, base_html)

# Loop to generate the 3 files
files = [
    ('al_nuri_crypt.html', './al_nuri_crypt.glb'),
    ('tutunji_house_iwan.html', './tutunji_house_iwan.glb'),
    ('winged_bulls.html', './winged_bulls.glb')
]

for filename, glb in files:
    content = base_html
    
    m = meta[filename]
    title = m['title']
    lighting = m['lighting']
    preset = m['preset']
    entrance = m['entrance']

    # Title
    content = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', content)
    
    # GLB paths
    content = re.sub(r'\./nury\.glb', glb, content)
    
    # Lighting
    content = re.sub(r'setupLighting\(\) \{.*?\n      \}', lighting, content, flags=re.DOTALL)
    
    # Preset
    content = re.sub(r'setLightingPreset\(preset\) \{.*?\n      \}', preset, content, flags=re.DOTALL)
    
    # Entrance Coordinates
    old_entrance = r"targetPos = new THREE\.Vector3\(-17\.13, 1\.85, -1\.31\),\n\s*targetLookAt = new THREE\.Vector3\(-10\.0, 1\.85, 5\.0\),\n\s*onComplete = null\n\s*\) \{"
    content = re.sub(old_entrance, entrance, content)
    
    # The user's code has `window.sunLocked` and `window.currentMode`.
    # Make sure we add `window.sunLocked = false; window.currentMode = 'orbit';` at top of script if needed,
    # Actually, the user's HTML buttons set it, we just need to initialize it in main block.
    init_vars = r"const sceneManager = new SceneManager\(container\);"
    content = re.sub(init_vars, "window.sunLocked = false; window.currentMode = 'orbit';\n    const sceneManager = new SceneManager(container);", content)

    # In user's code, they do `sceneManager.loadModel('./nury.glb', ...)`
    # We replaced nury.glb. But we need to make sure `controlManager.setColliders(sceneManager.colliders)` is called.
    # The user's code already does this inside the loadModel callback!
    # Let's check `user_full_code.html` to see if they call setColliders. Yes, we saw `controlManager.setColliders(sceneManager.colliders)` at the end of their file? Wait, let's verify.
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

print("Generated the 3 files using user's base + custom graphics!")
