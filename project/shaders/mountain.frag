#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying float vHeightT;
varying vec2 vXZ;

uniform sampler2D uTexture;
uniform vec3  uTint;
uniform vec3  uFogColor;
uniform float uFogStrength;
uniform float uSunInfluence;
uniform vec3  uSunDir;

void main() {
    vec4 tex = texture2D(uTexture, vTextureCoord);

    // outward radial direction at this fragment; lit side of the ridge faces the sun
    vec3 outward = normalize(vec3(vXZ.x, 0.0, vXZ.y));
    vec3 sunDirN = normalize(uSunDir);

    // horizontal term lights the sun-facing flank at low sun angles
    float horizLit = max(dot(outward, sunDirN), 0.0);
    // overhead term fakes the upward-facing slopes catching light when the sun is high
    float overhead = max(sunDirN.y, 0.0);

    float ambient = mix(0.22, 0.32, uSunInfluence);
    float diffuse = (horizLit * 0.35 + overhead * 0.40) * uSunInfluence;
    float light = ambient + diffuse;

    // cool the tint at night so the rock reads as moonlit instead of just dim
    vec3 nightTint = vec3(0.55, 0.65, 0.85);
    vec3 colorTint = mix(uTint * nightTint, uTint, uSunInfluence);

    vec3 base = tex.rgb * colorTint * light;

    // a touch more haze near the base so ridge peaks still stand out
    float baseBias = 1.0 - vHeightT;
    float fogT = clamp(uFogStrength * (0.6 + 0.4 * baseBias), 0.0, 1.0);

    vec3 outColor = mix(base, uFogColor, fogT);
    gl_FragColor = vec4(outColor, tex.a);
}
