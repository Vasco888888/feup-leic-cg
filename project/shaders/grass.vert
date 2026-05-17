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

    // apply patch transforms (scale then rotate) to recover world position
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


    // pow weight pins the root (y=0) and lets the tip move more than the middle
    float weight = pow(max(0.0, pos.y), 1.4);

    // wind uses world position so overlapping patches sway in sync
    float windPhase = uTime * 0.6 + (vWorldPos.x * 0.15 + vWorldPos.z * 0.15);
    float flutterPhase = uTime * 3.5 + (vWorldPos.x * 2.5 + vWorldPos.z * 2.5);

    float strength = uWindStrength * 0.4;

    float sway = sin(windPhase) * strength;
    float flutter = sin(flutterPhase) * (strength * 0.15);

    pos.x += (sway + flutter) * weight;

    // secondary Z sway gives a circular motion feel
    float swayZ = cos(windPhase * 0.85) * strength * 0.6;
    float flutterZ = sin(flutterPhase * 1.2) * (strength * 0.1);
    pos.z += (swayZ + flutterZ) * weight;


    vTextureCoord = aTextureCoord;
    vHeight = pos.y; 

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}


