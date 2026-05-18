#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying float vHeight;
varying vec3 vWorldPos;

uniform vec3 uGrassColor;
uniform int  uIsDead;
uniform float uSunInfluence;

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
// keep this in sync with terrain.frag's pathMask
float pathMask(vec2 worldXZ) {
    float c1 = 85.0 * sin(worldXZ.y * 0.0042 + 3.9)
             + 28.0 * sin(worldXZ.y * 0.013 + 5.4);
    float d1 = abs(worldXZ.x - c1);

    float c2 = -40.0 + 55.0 * sin(worldXZ.x * 0.0048 + 4.7)
                    + 22.0 * sin(worldXZ.x * 0.011 + 1.3);
    float d2 = abs(worldXZ.y - c2);

    float c3 = 220.0 + 50.0 * sin(worldXZ.y * 0.0065 + 3.7);
    float spurGate = smoothstep(60.0, 220.0, worldXZ.y) * (1.0 - smoothstep(540.0, 760.0, worldXZ.y));
    float d3 = mix(1e6, abs(worldXZ.x - c3), spurGate);

    float dist = min(min(d1, d2), d3);
    return smoothstep(3.5, 7.5, dist);
}

void main() {
    // skip fragments where terrain renders the wagon path
    if (pathMask(vWorldPos.xz) < 0.5) discard;

    // also skip flower meadows so the 3D blades don't sprout through flower texture
    float flowerNoise = noise(vWorldPos.xz * 0.05 + vec2(7.3, 2.1));
    if (smoothstep(0.55, 0.78, flowerNoise) > 0.2) discard;

    vec3 baseColor = uGrassColor * 0.5;
    vec3 tipColor  = uGrassColor * 1.3;

    float heightNorm = clamp(vHeight / 1.5, 0.0, 1.0);
    // bias keeps the lower blade darker
    float colorFactor = pow(heightNorm, 1.2);
    vec3 bladeColor = mix(baseColor, tipColor, colorFactor);


    if (uIsDead == 1) {
        // saturated wheat: honey gold base climbing to a bright yellow tip
        vec3 wheatBase = vec3(0.72, 0.52, 0.12);
        vec3 wheatTip  = vec3(0.98, 0.84, 0.22);
        bladeColor = mix(wheatBase, wheatTip, colorFactor);
    }


    float ambient = mix(0.10, 0.45, uSunInfluence);
    float tipBoost = mix(0.15, 0.45, uSunInfluence) * colorFactor;
    float light = ambient + tipBoost;


    gl_FragColor = vec4(bladeColor * light, 1.0);
}
