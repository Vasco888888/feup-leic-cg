#ifdef GL_ES
precision highp float;
#endif

varying vec3 vWorldDir;

uniform vec3 uSunDirection;
uniform float uCloudOffset;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
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

void main() {
    vec2 coords = vWorldDir.xz / (max(vWorldDir.y, 0.01) + 0.5);
    float sunElevation = uSunDirection.y;
    
    coords.x += uCloudOffset;
    coords.y += uCloudOffset * 0.35;

    float nA = fbm(coords * 2.8);
    float nB = fbm(coords * 9.0 + nA * 0.4);

    float field = nA * 0.8 + nB * 0.35;
    field = pow(field, 1.3);

    float horizonFade = smoothstep(-0.02, 0.35, vWorldDir.y);
    float cloudMask = smoothstep(0.42, 0.55, field) * horizonFade;

    float daySunsetMix = smoothstep(-0.15, 0.4, sunElevation);
    float sunsetNightMix = smoothstep(-0.5, -0.1, sunElevation);

    vec3 dBase = vec3(0.55, 0.65, 0.8);
    vec3 dTop = vec3(1.0, 1.0, 1.0);

    vec3 sBase = vec3(0.4, 0.25, 0.45);
    vec3 sTop = vec3(1.0, 0.7, 0.4);

    vec3 nBase = vec3(0.015, 0.02, 0.04);
    vec3 nTop = vec3(0.03, 0.05, 0.1);

    vec3 activeBase = mix(sBase, dBase, daySunsetMix);
    activeBase = mix(nBase, activeBase, sunsetNightMix);

    vec3 activeTop = mix(sTop, dTop, daySunsetMix);
    activeTop = mix(nTop, activeTop, sunsetNightMix);

    vec3 cloudColor = mix(activeBase, activeTop, nB * 1.5);
    
    gl_FragColor = vec4(cloudColor, cloudMask * 0.95);
}
