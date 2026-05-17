#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying float vHeightT;

uniform sampler2D uTexture;
uniform vec3  uTint;
uniform vec3  uFogColor;
uniform float uFogStrength;
uniform float uSunInfluence;

void main() {
    vec4 tex = texture2D(uTexture, vTextureCoord);

    // dim the rock toward a cool moonlit hue when the sun is below the horizon
    float lit = mix(0.18, 1.0, uSunInfluence);
    vec3 nightTint = vec3(0.55, 0.65, 0.85);
    vec3 colorTint = mix(uTint * nightTint, uTint, uSunInfluence);

    vec3 base = tex.rgb * colorTint * lit;

    // a touch more haze near the base so ridge peaks still stand out
    float baseBias = 1.0 - vHeightT;
    float fogT = clamp(uFogStrength * (0.6 + 0.4 * baseBias), 0.0, 1.0);

    vec3 outColor = mix(base, uFogColor, fogT);
    gl_FragColor = vec4(outColor, tex.a);
}
