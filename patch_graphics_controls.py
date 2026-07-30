import re
import os

files = ['al_nuri_crypt.html', 'tutunji_house_iwan.html', 'winged_bulls.html']

new_touch_listeners = """      initTouchLookListeners() {
        let lastX = 0, lastY = 0;
        this.lookTouchId = null;

        const onPointerDown = (e) => {
          if (e.target.closest('button, .glass-panel, .glass-hud, #joystick-container')) return;
          if (this.isTouchLooking) return;
          
          let touch;
          if (e.changedTouches) {
            touch = e.changedTouches[0];
            this.lookTouchId = touch.identifier;
          } else {
            touch = e;
            this.lookTouchId = 'mouse';
          }

          this.isTouchLooking = true;
          lastX = touch.clientX;
          lastY = touch.clientY;
        };

        const onPointerMove = (e) => {
          if (!this.isTouchLooking || this.isTransitioning || this.isGyroActive) return;
          
          let touch;
          if (e.changedTouches) {
            for (let i = 0; i < e.changedTouches.length; i++) {
              if (e.changedTouches[i].identifier === this.lookTouchId) {
                touch = e.changedTouches[i];
                break;
              }
            }
            if (!touch) return;
          } else {
            touch = e;
          }

          const deltaX = touch.clientX - lastX;
          const deltaY = touch.clientY - lastY;
          lastX = touch.clientX;
          lastY = touch.clientY;

          const sensitivity = 0.003;
          this.yaw -= deltaX * sensitivity;
          this.pitch -= deltaY * sensitivity;

          const maxPitch = Math.PI / 2 - 0.05;
          this.pitch = THREE.MathUtils.clamp(this.pitch, -maxPitch, maxPitch);
        };

        const onPointerUp = (e) => {
          if (!this.isTouchLooking) return;
          if (e.changedTouches) {
            let found = false;
            for (let i = 0; i < e.changedTouches.length; i++) {
              if (e.changedTouches[i].identifier === this.lookTouchId) {
                found = true;
                break;
              }
            }
            if (!found) return;
          }
          this.isTouchLooking = false;
          this.lookTouchId = null;
        };

        window.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);
        window.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerUp, { passive: true });
        window.addEventListener('touchcancel', onPointerUp, { passive: true });
      }"""


for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 1. Remove && window.currentMode !== 'walk'
    content = content.replace("if (this.dirLight && !window.sunLocked && window.currentMode !== 'walk')", "if (this.dirLight && !window.sunLocked)")
    
    # 2. Remove enterWalkPerformance and shadowMap manipulation in event listeners
    # They look like this:
    # sceneManager.renderer.shadowMap.autoUpdate = false;
    # sceneManager.renderer.shadowMap.needsUpdate = true;
    # sceneManager.enterWalkPerformance();
    content = re.sub(r'sceneManager\.renderer\.shadowMap\.autoUpdate = (false|true);\n\s*sceneManager\.renderer\.shadowMap\.needsUpdate = (true|false);\n\s*sceneManager\.(enter|exit)WalkPerformance\(\);', '', content)
    
    # 3. Replace initTouchLookListeners
    old_listeners = re.search(r'initTouchLookListeners\(\) \{.*?\n      \}\n\n      update\(delta\)', content, re.DOTALL)
    if old_listeners:
        content = content.replace(old_listeners.group(0), new_touch_listeners + "\n\n      update(delta)")
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Applied fixes!")
