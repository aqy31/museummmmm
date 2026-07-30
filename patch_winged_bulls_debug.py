import re

filepath = 'winged_bulls.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add a global error handler that displays on the screen
error_handler = """<script>
window.onerror = function(message, source, lineno, colno, error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.backgroundColor = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.zIndex = '999999';
    errorDiv.style.padding = '10px';
    errorDiv.innerHTML = 'ERROR: ' + message + ' at ' + lineno + ':' + colno;
    document.body.appendChild(errorDiv);
};
</script>"""

if 'window.onerror' not in content:
    content = content.replace('<body>', '<body>\n' + error_handler)

# Fix the duplicate jump block
jump_block = """        if (this.isJumping) {
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

# It appears twice, so let's remove the second one.
count = content.count(jump_block)
if count > 1:
    content = content.replace(jump_block, '', 1) # Removes the first occurrence, leaves one.

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("winged_bulls.html global error handler added and duplicate block fixed.")
