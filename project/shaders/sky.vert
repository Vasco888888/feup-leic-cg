attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

varying vec2 vTextureCoord;
varying vec3 vWorldDir;

void main() {
    vec4 worldPos = vec4(aVertexPosition, 1.0);
    vWorldDir = normalize(worldPos.xyz);
    vTextureCoord = aTextureCoord;

    gl_Position = uPMatrix * uMVMatrix * worldPos;
}
