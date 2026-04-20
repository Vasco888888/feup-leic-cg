#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vWorldDir;

uniform vec3 uSunDirection;
uniform vec3 uSunColor;

void main() {
    vec3 dir = normalize(vWorldDir);
    float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

    // Clean blue sky gradient from horizon to zenith.
    vec3 horizon = vec3(0.55, 0.79, 0.98);
    vec3 zenith = vec3(0.13, 0.34, 0.68);
    vec3 skyGradient = mix(horizon, zenith, pow(1.0 - h, 0.8));

    // Warm atmospheric band close to horizon.
    float horizonBand = 1.0 - smoothstep(0.08, 0.30, dir.y);
    vec3 haze = vec3(0.90, 0.93, 0.98) * horizonBand * 0.16;

    float sunAmount = max(dot(dir, normalize(uSunDirection)), 0.0);
    float sunCore = pow(sunAmount, 900.0);
    float sunGlow = pow(sunAmount, 36.0);

    vec3 skyColor = skyGradient + haze;
    skyColor += uSunColor * (sunGlow * 0.85 + sunCore * 3.2);

    gl_FragColor = vec4(skyColor, 1.0);
}
