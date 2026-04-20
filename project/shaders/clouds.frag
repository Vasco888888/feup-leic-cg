#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vWorldDir;

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
    // Primary cloud field.
    vec2 uvA = vTextureCoord * 4.6;
    float nA = fbm(uvA);

    // Secondary procedural layer (acts as a second texture layer).
    vec2 uvB = vec2(vTextureCoord.x * 8.0 + 0.7, vTextureCoord.y * 5.5 + vTextureCoord.x * 1.1);
    float nB = fbm(uvB);

    float horizonFade = smoothstep(-0.02, 0.62, vWorldDir.y);
    float cloudField = nA * 0.78 + nB * 0.48;
    float cloudMask = smoothstep(0.66, 0.90, cloudField) * horizonFade;

    vec3 cloudColor = mix(vec3(0.86, 0.91, 0.97), vec3(1.0), nB);
    gl_FragColor = vec4(cloudColor, cloudMask * 0.62);
}
