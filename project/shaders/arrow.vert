attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform float uTime;

varying float vHeightT;
varying float vPulse;
varying vec3 vNormal;

void main() {
    vec3 p = aVertexPosition;
    vec3 n = aVertexNormal;

    // spin around the vertical axis in object space
    float spin = uTime * 1.0;
    float c = cos(spin);
    float s = sin(spin);
    p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
    n = vec3(c * n.x + s * n.z, n.y, -s * n.x + c * n.z);

    // base (top) at y=h, apex (tip) at y=0
    vHeightT = clamp(p.y / 1.2, 0.0, 1.0);

    // gentle vertical bob, evaluated in object space (mv has no rotation)
    p.y += sin(uTime * 2.2) * 0.35;

    // 0..1 pulse for the fragment glow
    vPulse = 0.5 + 0.5 * sin(uTime * 4.0);
    vNormal = n;

    gl_Position = uPMatrix * uMVMatrix * vec4(p, 1.0);
}
