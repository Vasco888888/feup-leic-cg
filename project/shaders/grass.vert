attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform float uTime;
uniform float uWindStrength;

varying vec2 vTextureCoord;
varying float vHeight;

void main() {
    vec3 pos = aVertexPosition;

    // vTextureCoord.y = 0 at top, 1 at bottom
    // Wind only affects the top of the blade (v close to 0)
    float windFactor = 1.0 - vTextureCoord.y; // 1 at top, 0 at bottom
    // Actually, we need to use aTextureCoord before assigning vTextureCoord
    float topFactor = 1.0 - aTextureCoord.y;

    // Wind displacement (sinusoidal, varies by position for organic look)
    float windPhase = uTime * 2.5 + pos.x * 0.8 + pos.z * 0.6;
    float windX = sin(windPhase) * uWindStrength * topFactor;
    float windZ = cos(windPhase * 0.7 + 1.3) * uWindStrength * topFactor * 0.5;

    pos.x += windX;
    pos.z += windZ;

    vTextureCoord = aTextureCoord;
    vHeight = topFactor;

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}
