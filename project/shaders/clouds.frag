#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vWorldDir;

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
    // Using World Direction instead of UVs for guaranteed mapping.
    // Projected XZ coordinates create a natural planar look for clouds.
    vec2 coords = vWorldDir.xz / (max(vWorldDir.y, 0.01) + 0.5);
    
    // Add the animation offset manually from the uniform
    coords.x += uCloudOffset;
    coords.y += uCloudOffset * 0.35;

    // Cumulus Logic
    float nA = fbm(coords * 2.8);
    float nB = fbm(coords * 9.0 + nA * 0.4);

    float field = nA * 0.8 + nB * 0.35;
    field = pow(field, 1.3);

    float horizonFade = smoothstep(-0.02, 0.35, vWorldDir.y);
    float cloudMask = smoothstep(0.42, 0.55, field) * horizonFade;

    // Natural puffy cloud colors
    vec3 cloudBase = vec3(0.85, 0.90, 0.95);
    vec3 cloudTop = vec3(1.0);
    vec3 cloudColor = mix(cloudBase, cloudTop, nB * 1.5);
    
    gl_FragColor = vec4(cloudColor, cloudMask * 0.95);
}
