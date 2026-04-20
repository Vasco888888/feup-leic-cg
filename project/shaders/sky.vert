attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

varying vec3 vWorldDir;

void main() {
    vec4 worldPos = vec4(aVertexPosition, 1.0);
    vWorldDir = normalize(worldPos.xyz);
    gl_Position = uPMatrix * uMVMatrix * worldPos;
}
