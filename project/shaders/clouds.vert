attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;
uniform float uCloudOffset;

varying vec2 vTextureCoord;
varying vec3 vWorldDir;

void main() {
    vec4 worldPos = vec4(aVertexPosition, 1.0);
    vWorldDir = normalize(worldPos.xyz);

    vec2 uv = aTextureCoord;
    uv.x += uCloudOffset;
    uv.y += uCloudOffset * 0.35;
    vTextureCoord = uv;

    gl_Position = uPMatrix * uMVMatrix * worldPos;
}
