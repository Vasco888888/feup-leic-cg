#ifdef GL_ES
precision highp float;
#endif

varying vec3 vWorldDir;

uniform vec3 uSunDirection;
uniform vec3 uSunColor;

void main() {
    vec3 dir = normalize(vWorldDir);
    float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
    float sunElevation = uSunDirection.y;

    // Define palettes
    vec3 dayHorizon = vec3(0.55, 0.79, 0.98);
    vec3 dayZenith = vec3(0.13, 0.34, 0.68);
    
    vec3 sunsetHorizon = vec3(1.0, 0.45, 0.2);
    vec3 sunsetZenith = vec3(0.15, 0.1, 0.35);
    
    vec3 nightHorizon = vec3(0.05, 0.07, 0.15);
    vec3 nightZenith = vec3(0.02, 0.03, 0.08);

    // Calculate transition factors
    float daySunsetMix = smoothstep(-0.15, 0.35, sunElevation);
    float sunsetNightMix = smoothstep(-0.5, -0.1, sunElevation);

    vec3 activeHorizon = mix(sunsetHorizon, dayHorizon, daySunsetMix);
    activeHorizon = mix(nightHorizon, activeHorizon, sunsetNightMix);

    vec3 activeZenith = mix(sunsetZenith, dayZenith, daySunsetMix);
    activeZenith = mix(nightZenith, activeZenith, sunsetNightMix);

    vec3 skyGradient = mix(activeHorizon, activeZenith, pow(1.0 - h, 0.8));

    // Atmospheric haze at horizon
    float horizonBand = 1.0 - smoothstep(0.02, 0.35, dir.y);
    vec3 hazeColor = mix(vec3(1.0, 0.6, 0.3), vec3(0.9, 0.95, 1.0), daySunsetMix);
    vec3 haze = hazeColor * horizonBand * 0.2 * sunsetNightMix;

    // Sun Disk
    float sunAmount = max(dot(dir, normalize(uSunDirection)), 0.0);
    float sunCore = pow(sunAmount, 4000.0); 
    float sunGlow = pow(sunAmount, 120.0);
    
    // Fade sun out as it sets
    float sunIntensity = smoothstep(-0.25, 0.15, sunElevation);

    vec3 skyColor = skyGradient + haze;
    skyColor += uSunColor * (sunGlow * 0.8 + sunCore * 3.5) * sunIntensity;

    gl_FragColor = vec4(skyColor, 1.0);
}
