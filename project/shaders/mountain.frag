#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying float vHeightT;

uniform sampler2D uTexture;
uniform vec3  uTint;
uniform vec3  uFogColor;
uniform float uFogStrength;

void main() {
    vec4 tex = texture2D(uTexture, vTextureCoord);
    vec3 base = tex.rgb * uTint;

    // a touch more haze near the base so ridge peaks still stand out
    float baseBias = 1.0 - vHeightT;
    float fogT = clamp(uFogStrength * (0.6 + 0.4 * baseBias), 0.0, 1.0);

    vec3 outColor = mix(base, uFogColor, fogT);
    gl_FragColor = vec4(outColor, tex.a);
}
