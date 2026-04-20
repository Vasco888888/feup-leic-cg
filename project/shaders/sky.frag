#ifdef GL_ES
precision highp float;
#endif

varying vec3 vWorldDir;

uniform vec3 uSunDirection;
uniform vec3 uMoonDirection;
uniform vec3 uSunColor;
uniform sampler2D uMoonTexture;

void main() {
    vec3 dir = normalize(vWorldDir);
    float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
    float sunElevation = uSunDirection.y;

    // Sky colors
    vec3 dayHorizon = vec3(0.55, 0.79, 0.98);
    vec3 dayZenith = vec3(0.13, 0.34, 0.68);
    
    vec3 sunsetHorizon = vec3(1.0, 0.45, 0.2);
    vec3 sunsetZenith = vec3(0.15, 0.1, 0.35);
    
    vec3 nightHorizon = vec3(0.05, 0.07, 0.15);
    vec3 nightZenith = vec3(0.02, 0.03, 0.08);

    // Day/Night transitions
    float daySunsetMix = smoothstep(-0.15, 0.35, sunElevation);
    float sunsetNightMix = smoothstep(-0.5, -0.1, sunElevation);

    vec3 activeHorizon = mix(sunsetHorizon, dayHorizon, daySunsetMix);
    activeHorizon = mix(nightHorizon, activeHorizon, sunsetNightMix);

    vec3 activeZenith = mix(sunsetZenith, dayZenith, daySunsetMix);
    activeZenith = mix(nightZenith, activeZenith, sunsetNightMix);

    vec3 skyGradient = mix(activeHorizon, activeZenith, pow(1.0 - h, 0.8));

    // Horizon haze
    float horizonBand = 1.0 - smoothstep(0.02, 0.35, dir.y);
    vec3 hazeColor = mix(vec3(1.0, 0.6, 0.3), vec3(0.9, 0.95, 1.0), daySunsetMix);
    vec3 haze = hazeColor * horizonBand * 0.2 * sunsetNightMix;

    // Sun
    float sunAmount = max(dot(dir, normalize(uSunDirection)), 0.0);
    float sunCore = pow(sunAmount, 4000.0); 
    float sunGlow = pow(sunAmount, 120.0);
    float sunIntensity = smoothstep(-0.25, 0.15, sunElevation);

    vec3 skyColor = skyGradient + haze;
    skyColor += uSunColor * (sunGlow * 0.8 + sunCore * 3.5) * sunIntensity;

    // Moon
    float moonAmount = max(dot(dir, normalize(uMoonDirection)), 0.0);
    
    vec3 mCenter = normalize(uMoonDirection);
    vec3 mUp = vec3(0.0, 1.0, 0.0);
    vec3 mRight = normalize(cross(mCenter, mUp));
    mUp = cross(mRight, mCenter);
    
    vec2 moonOffset = vec2(dot(dir, mRight), dot(dir, mUp));
    float moonRadius = 0.045; 
    float distToMoon = length(moonOffset);
    
    float moonMask = 1.0 - smoothstep(moonRadius * 0.95, moonRadius, distToMoon);
    vec2 moonUV = moonOffset / (moonRadius * 2.1) + 0.5;
    vec3 texColor = texture2D(uMoonTexture, moonUV).rgb;
    
    float moonCore = pow(moonAmount, 10000.0);
    float moonGlow = pow(moonAmount, 150.0);
    vec3 moonGlowColor = vec3(0.6, 0.8, 1.0); 
    
    vec3 moonBaseColor = mix(vec3(0.0), texColor, moonMask);
    float moonIntensity = smoothstep(0.1, -0.3, sunElevation) * 0.8 + 0.2;
    
    skyColor += moonBaseColor * moonIntensity;
    skyColor += moonGlowColor * (moonGlow * 0.25) * moonIntensity;
    skyColor += vec3(1.0) * (moonCore * 0.4) * moonIntensity;

    gl_FragColor = vec4(skyColor, 1.0);
}
