attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform float uPanoramaHeight;

varying vec2 vTextureCoord;
varying float vHeightT;

void main() {
    vTextureCoord = aTextureCoord;
    vHeightT = clamp(aVertexPosition.y / uPanoramaHeight, 0.0, 1.0);
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}
