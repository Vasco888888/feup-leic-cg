#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vNormal;
varying vec3 vWorldPos;

uniform sampler2D uGrassTexture;
uniform sampler2D uDirtTexture;
uniform float     uTerrainSize;
uniform float     uTerrainRadius;

// ────────── Noise helpers ──────────

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// ────────── Wagon path mask ──────────

// Generates a smooth winding path across the terrain.
// Returns 0.0 where path exists, 1.0 elsewhere (grass blend factor).
float pathMask(vec2 worldXZ) {
    vec2 uv = worldXZ / uTerrainSize + 0.5;

    // Path centre follows a smooth sinusoidal curve
    float pathCentreX = 0.5 + 0.18 * sin(uv.y * 6.2831 * 1.2 + 0.8)
                             + 0.08 * sin(uv.y * 6.2831 * 2.7 + 2.1);

    float dist = abs(uv.x - pathCentreX);
    float pathWidth = 0.025;
    float pathEdge  = 0.012;

    return smoothstep(pathWidth - pathEdge, pathWidth + pathEdge, dist);
}

// ────────── Main ──────────

void main() {
    // ── Circular border: discard fragments outside the dome radius ──
    float distFromCenter = length(vWorldPos.xz);
    if (distFromCenter > uTerrainRadius) {
        discard;
    }
    // Smooth fade near the circular edge
    float edgeFade = 1.0 - smoothstep(uTerrainRadius * 0.85, uTerrainRadius, distFromCenter);

    // Tile UVs for texture repetition over the terrain
    float tilingFactor = 40.0;
    vec2 tiledUV = vTextureCoord * tilingFactor;

    vec4 grassColor = texture2D(uGrassTexture, tiledUV);
    vec4 dirtColor  = texture2D(uDirtTexture, tiledUV);

    // ── Noise-based dirt patches (sparse — mostly grass) ──
    vec2 patchCoords = vWorldPos.xz * 0.008;
    float patchNoise = fbm(patchCoords);
    // Higher threshold = fewer dirt patches, more grass visible
    float dirtPatchMask = smoothstep(0.58, 0.72, patchNoise);

    // ── Slope-based blending ──
    float slope = 1.0 - dot(normalize(vNormal), vec3(0.0, 1.0, 0.0));
    float slopeDirt = smoothstep(0.25, 0.55, slope);

    // ── Combine dirt factors ──
    float dirtFactor = max(dirtPatchMask * 0.7, slopeDirt);

    // ── Path blending ──
    float pathGrass = pathMask(vWorldPos.xz);
    dirtFactor = max(dirtFactor, 1.0 - pathGrass);

    // ── Final color blend ──
    vec4 groundColor = mix(grassColor, dirtColor, clamp(dirtFactor, 0.0, 1.0));

    // Fade terrain edges to a muted green so it blends with the horizon
    vec3 edgeColor = vec3(0.28, 0.42, 0.18);
    groundColor.rgb = mix(edgeColor, groundColor.rgb, edgeFade);

    // ── Lighting ──
    float ambient = 0.45;
    float diffuse = max(dot(normalize(vNormal), normalize(vec3(0.4, 0.8, -0.3))), 0.0);
    float light = ambient + diffuse * 0.55;

    gl_FragColor = vec4(groundColor.rgb * light, 1.0);
}
