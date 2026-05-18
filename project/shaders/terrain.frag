#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vNormal;
varying vec3 vWorldPos;

uniform sampler2D uGrassTexture;
uniform sampler2D uDirtTexture;
uniform sampler2D uFlowerTexture;
uniform float     uTerrainSize;
uniform float     uTerrainRadius;
uniform vec3      uLightDir;
uniform float     uAmbientStrength;
uniform float     uDiffuseStrength;

// wagon lamps; uLampStrength is zeroed during the day
uniform vec3  uLamp0Pos;
uniform vec3  uLamp1Pos;
uniform vec3  uLampColor;
uniform float uLampRange;
uniform float uLampStrength;

// contact ambient occlusion: each disc is (x, z, radius, strength)
// strength = 0 disables the disc
uniform vec4 uAOWagon;
uniform vec4 uAOBarn;
uniform vec4 uAOBale0;
uniform vec4 uAOBale1;
uniform vec4 uAOBale2;

// drifting cloud cover dims the ground in patches
uniform float uCloudOffset;
uniform float uCloudShadow;

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
    for (int i = 0; i < 3; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// wagon path mask: union of winding roads measured in world units so the width
// stays fixed even if the terrain disc scales up
float pathMask(vec2 worldXZ) {
    // main winding north-south road
    float c1 = 85.0 * sin(worldXZ.y * 0.0042 + 3.9)
             + 28.0 * sin(worldXZ.y * 0.013 + 5.4);
    float d1 = abs(worldXZ.x - c1);

    // east-west crossroad weaving across the field
    float c2 = -40.0 + 55.0 * sin(worldXZ.x * 0.0048 + 4.7)
                    + 22.0 * sin(worldXZ.x * 0.011 + 1.3);
    float d2 = abs(worldXZ.y - c2);

    // shorter spur curling off the main road in the upper half of the map
    float c3 = 220.0 + 50.0 * sin(worldXZ.y * 0.0065 + 3.7);
    float spurGate = smoothstep(60.0, 220.0, worldXZ.y) * (1.0 - smoothstep(540.0, 760.0, worldXZ.y));
    float d3 = mix(1e6, abs(worldXZ.x - c3), spurGate);

    float dist = min(min(d1, d2), d3);

    float pathWidth = 5.0;
    float pathEdge  = 2.5;

    return smoothstep(pathWidth - pathEdge, pathWidth + pathEdge, dist);
}

void main() {
    // circular border clip
    float distFromCenter = length(vWorldPos.xz);
    if (distFromCenter > uTerrainRadius) {
        discard;
    }
    float edgeFade = 1.0 - smoothstep(uTerrainRadius * 0.85, uTerrainRadius, distFromCenter);

    // tile in world units rather than UV space so the texture scale is independent
    // of the terrain disc size
    float tilesPerWorldUnit = 1.0 / 12.0;
    vec2 tiledUV = fract(vWorldPos.xz * tilesPerWorldUnit);

    vec4 grassColor  = texture2D(uGrassTexture,  tiledUV);
    vec4 dirtColor   = texture2D(uDirtTexture,   tiledUV);
    vec4 flowerColor = texture2D(uFlowerTexture, tiledUV);

    // tone the ground grass down so the 3D blades pop against it;
    // the flower texture sits on grass too, so match its brightness
    grassColor.rgb  *= 0.72;
    flowerColor.rgb *= 0.72;

    float slope = 1.0 - dot(normalize(vNormal), vec3(0.0, 1.0, 0.0));
    float slopeDirt = smoothstep(0.25, 0.55, slope);

    // dirt only shows on the wagon path and on truly steep slopes
    float pathGrass = pathMask(vWorldPos.xz);
    float dirtFactor = max(slopeDirt, 1.0 - pathGrass);

    // cheap single-octave noise picks scattered flower meadows on flat grass
    float flowerNoise = noise(vWorldPos.xz * 0.05 + vec2(7.3, 2.1));
    float slopeFlat = 1.0 - smoothstep(0.08, 0.25, slope);
    float flowerMask = smoothstep(0.55, 0.78, flowerNoise) * slopeFlat * pathGrass * (1.0 - dirtFactor);

    vec4 groundColor = mix(grassColor, flowerColor, clamp(flowerMask, 0.0, 1.0));
    groundColor = mix(groundColor, dirtColor, clamp(dirtFactor, 0.0, 1.0));

    vec3 edgeColor = vec3(0.28, 0.42, 0.18);
    groundColor.rgb = mix(edgeColor, groundColor.rgb, edgeFade);

    float ambient = uAmbientStrength;
    float diffuse = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
    float light = ambient + diffuse * uDiffuseStrength;

    // cheap single-octave cloud shadow that drifts with the cloud cover
    vec2 cloudUV = vWorldPos.xz * 0.0035 + vec2(uCloudOffset * 4.0, uCloudOffset * 1.4);
    float cloudMask = smoothstep(0.45, 0.78, noise(cloudUV));
    light *= 1.0 - cloudMask * uCloudShadow;

    vec3 lit = groundColor.rgb * light;

    // squared distance falloff for each lamp
    float d0 = length(uLamp0Pos - vWorldPos);
    float d1 = length(uLamp1Pos - vWorldPos);
    float att0 = clamp(1.0 - d0 / uLampRange, 0.0, 1.0);
    float att1 = clamp(1.0 - d1 / uLampRange, 0.0, 1.0);
    float lampLight = (att0 * att0 + att1 * att1) * uLampStrength;
    lit += uLampColor * groundColor.rgb * lampLight;

    // contact AO under static props and the wagon
    float ao = 1.0;
    ao *= 1.0 - (1.0 - smoothstep(uAOWagon.z * 0.35, uAOWagon.z, length(uAOWagon.xy - vWorldPos.xz))) * uAOWagon.w;
    ao *= 1.0 - (1.0 - smoothstep(uAOBarn.z  * 0.35, uAOBarn.z,  length(uAOBarn.xy  - vWorldPos.xz))) * uAOBarn.w;
    ao *= 1.0 - (1.0 - smoothstep(uAOBale0.z * 0.35, uAOBale0.z, length(uAOBale0.xy - vWorldPos.xz))) * uAOBale0.w;
    ao *= 1.0 - (1.0 - smoothstep(uAOBale1.z * 0.35, uAOBale1.z, length(uAOBale1.xy - vWorldPos.xz))) * uAOBale1.w;
    ao *= 1.0 - (1.0 - smoothstep(uAOBale2.z * 0.35, uAOBale2.z, length(uAOBale2.xy - vWorldPos.xz))) * uAOBale2.w;
    lit *= ao;

    gl_FragColor = vec4(lit, 1.0);
}
