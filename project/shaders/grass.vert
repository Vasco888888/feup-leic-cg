attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform float uTime;
uniform float uWindStrength;
uniform vec3 uPatchPos;
uniform float uRotY;
uniform vec2 uScale;

varying vec2 vTextureCoord;
varying float vHeight;
varying vec3 vWorldPos;

void main() {
    vec3 pos = aVertexPosition;
    
    // Calculate true world position by applying local patch transforms in the correct order (Scale -> Rotate)
    float cosR = cos(uRotY);
    float sinR = sin(uRotY);
    float sx = pos.x * uScale.x;
    float sz = pos.z * uScale.y;
    vec3 localPos = vec3(
        sx * cosR + sz * sinR,
        pos.y,
        -sx * sinR + sz * cosR
    );
    vWorldPos = uPatchPos + localPos;


    // Use height (y) as the primary factor for wind displacement.
    // At the root (y=0), weight is 0.0, ensuring the blade stays on the ground.
    // We use pow() to make the tip move more than the middle.
    float weight = pow(max(0.0, pos.y), 1.4);

    // Wind displacement (Using world position so overlapping patches sway perfectly in sync)
    // General sway (slow and broad)
    float windPhase = uTime * 0.6 + (vWorldPos.x * 0.15 + vWorldPos.z * 0.15);
    // Micro-flutter (fast and jittery)
    float flutterPhase = uTime * 3.5 + (vWorldPos.x * 2.5 + vWorldPos.z * 2.5);
    
    // Scale down the overall wind strength for less distance
    float strength = uWindStrength * 0.4;

    float sway = sin(windPhase) * strength;
    float flutter = sin(flutterPhase) * (strength * 0.15);
    
    // Displacement logic
    pos.x += (sway + flutter) * weight;
    
    // Add a secondary sway in Z for circular motion feel
    float swayZ = cos(windPhase * 0.85) * strength * 0.6;
    float flutterZ = sin(flutterPhase * 1.2) * (strength * 0.1);
    pos.z += (swayZ + flutterZ) * weight;


    vTextureCoord = aTextureCoord;
    vHeight = pos.y; 

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}


