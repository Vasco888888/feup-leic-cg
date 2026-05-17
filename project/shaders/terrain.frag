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

// wagon path mask: union of several winding roads so the dirt branches
float pathMask(vec2 worldXZ) {
    vec2 uv = worldXZ / uTerrainSize + 0.5;

    // main winding road running roughly north-south
    float c1 = 0.5 + 0.18 * sin(uv.y * 6.2831 * 1.2 + 0.8)
                   + 0.08 * sin(uv.y * 6.2831 * 2.7 + 2.1);
    float d1 = abs(uv.x - c1);

    // east-west crossroad weaving across the field
    float c2 = 0.5 + 0.16 * sin(uv.x * 6.2831 * 1.0 + 1.6)
                   + 0.07 * sin(uv.x * 6.2831 * 2.4 + 4.3);
    float d2 = abs(uv.y - c2);

    // short spur curling off the main road in the lower half
    float c3 = 0.32 + 0.12 * sin(uv.y * 6.2831 * 1.6 + 2.4);
    float spurGate = smoothstep(0.28, 0.40, uv.y) * (1.0 - smoothstep(0.62, 0.78, uv.y));
    float d3 = mix(1.0, abs(uv.x - c3), spurGate);

    float dist = min(min(d1, d2), d3);

    float pathWidth = 0.022;
    float pathEdge  = 0.012;

    return smoothstep(pathWidth - pathEdge, pathWidth + pathEdge, dist);
}

void main() {
    // circular border clip
    float distFromCenter = length(vWorldPos.xz);
    if (distFromCenter > uTerrainRadius) {
        discard;
    }
    float edgeFade = 1.0 - smoothstep(uTerrainRadius * 0.85, uTerrainRadius, distFromCenter);

    float tilingFactor = 40.0;
    vec2 tiledUV = fract(vTextureCoord * tilingFactor);

    vec4 grassColor  = texture2D(uGrassTexture,  tiledUV);
    vec4 dirtColor   = texture2D(uDirtTexture,   tiledUV);
    vec4 flowerColor = texture2D(uFlowerTexture,  tiledUV);

    // tone the ground grass down so the 3D blades pop against it;
    // the flower texture sits on grass too, so match its brightness
    grassColor.rgb  *= 0.72;
    flowerColor.rgb *= 0.72;

    float slope = 1.0 - dot(normalize(vNormal), vec3(0.0, 1.0, 0.0));
    float slopeDirt = smoothstep(0.25, 0.55, slope);

    // dirt only shows on the wagon path and on truly steep slopes
    float pathGrass = pathMask(vWorldPos.xz);
    float dirtFactor = max(slopeDirt, 1.0 - pathGrass);

    // two fbm layers at different scales produce cluster spots
    float flowerNoise = fbm(vWorldPos.xz * 0.05 + vec2(7.3, 2.1));
    float flowerNoise2 = fbm(vWorldPos.xz * 0.12 + vec2(13.7, 5.9));
    float flowerMask = smoothstep(0.42, 0.58, flowerNoise) * smoothstep(0.38, 0.55, flowerNoise2);
    // restrict flowers to flat grass, away from dirt and path
    float slopeFlat = 1.0 - smoothstep(0.08, 0.25, slope);
    flowerMask *= slopeFlat * pathGrass * (1.0 - dirtFactor);

    vec4 groundColor = mix(grassColor, flowerColor, clamp(flowerMask, 0.0, 1.0));
    groundColor = mix(groundColor, dirtColor, clamp(dirtFactor, 0.0, 1.0));

    vec3 edgeColor = vec3(0.28, 0.42, 0.18);
    groundColor.rgb = mix(edgeColor, groundColor.rgb, edgeFade);

    float ambient = uAmbientStrength;
    float diffuse = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
    float light = ambient + diffuse * uDiffuseStrength;

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
