#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying float vHeight;
varying vec3 vWorldPos;

uniform vec3 uGrassColor;
uniform int  uIsDead;
uniform float uSunInfluence;

// ── Noise helpers (matching terrain.frag) ──
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
}
float pathMask(vec2 worldXZ) {
    vec2 uv = worldXZ / 520.0 + 0.5;
    float pathX = 0.5 + 0.18 * sin(uv.y * 6.2831 * 1.2 + 0.8) + 0.08 * sin(uv.y * 6.2831 * 2.7 + 2.1);
    return smoothstep(0.013, 0.037, abs(uv.x - pathX));
}

void main() {
    // ── Discard logic for texture awareness ──
    // 1. Path check
    if (pathMask(vWorldPos.xz) < 0.5) discard;

    // 2. Dirt check
    float dirtNoise = fbm(vWorldPos.xz * 0.008);
    if (smoothstep(0.58, 0.72, dirtNoise) > 0.1) discard;

    // Gradient: darker at base, lighter at tip
    vec3 baseColor = uGrassColor * 0.6;
    vec3 tipColor  = uGrassColor * 1.3;

    // vHeight is the actual Y coordinate (approx 0.0 to 1.8)
    // We clamp and scale it slightly to keep the color gradient looking natural
    float colorFactor = clamp(vHeight / 1.5, 0.0, 1.0);
    vec3 bladeColor = mix(baseColor, tipColor, colorFactor);


    // Dead grass: enhance warm golden tones
    if (uIsDead == 1) {
        // Instead of desaturating, we shift towards a warmer, sun-dried look
        bladeColor = mix(bladeColor, vec3(bladeColor.r * 1.1, bladeColor.g * 0.9, bladeColor.b * 0.6), 0.5);
    }


    // Day/night lighting: darker at night, brighter in daytime.
    float ambient = mix(0.10, 0.45, uSunInfluence);
    float tipBoost = mix(0.15, 0.45, uSunInfluence) * colorFactor;
    float light = ambient + tipBoost;


    gl_FragColor = vec4(bladeColor * light, 1.0);
}
