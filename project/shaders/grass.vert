attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform float uTime;
uniform float uWindStrength;
uniform vec3 uPatchPos;

varying vec2 vTextureCoord;
varying float vHeight;
varying vec3 vWorldPos;

void main() {
    vec3 pos = aVertexPosition;
    vWorldPos = uPatchPos + pos;


    // Use height (y) as the primary factor for wind displacement.
    // At the root (y=0), weight is 0.0, ensuring the blade stays on the ground.
    // We use pow() to make the tip move more than the middle.
    float weight = pow(max(0.0, pos.y), 1.4);

    // Wind displacement
    // General sway (slow and broad) - even slower
    float windPhase = uTime * 0.6 + (pos.x * 0.15 + pos.z * 0.15);
    // Micro-flutter (fast and jittery) - even slower
    float flutterPhase = uTime * 3.5 + (pos.x * 2.5 + pos.z * 2.5);
    
    // Scale down the overall wind strength for less distance
    float strength = uWindStrength * 0.6;

    float sway = sin(windPhase) * strength;
    float flutter = sin(flutterPhase) * (strength * 0.2);
    
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


