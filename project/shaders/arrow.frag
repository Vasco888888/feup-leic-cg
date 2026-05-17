#ifdef GL_ES
precision highp float;
#endif

varying float vHeightT;
varying float vPulse;
varying vec3 vNormal;

uniform vec3 uTipColor;
uniform vec3 uBaseColor;

void main() {
    // tip (y=0) is the brightest, base (y=h) fades to a warmer tone
    vec3 grad = mix(uTipColor, uBaseColor, vHeightT);

    // soft rim from the normal so curved sides catch a highlight
    float rim = pow(1.0 - max(0.0, vNormal.y), 1.5);

    // pulse modulates the overall brightness between 0.7x and 1.2x
    float pulse = 0.7 + 0.5 * vPulse;

    vec3 color = grad * pulse + vec3(0.25, 0.18, 0.05) * rim;

    gl_FragColor = vec4(color, 1.0);
}
