#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying float vHeight;

uniform vec3 uGrassColor;
uniform int  uIsDead;
uniform float uSunInfluence;

void main() {
    // Gradient: darker at base, lighter at tip
    vec3 baseColor = uGrassColor * 0.6;
    vec3 tipColor  = uGrassColor * 1.3;

    // vHeight is the actual Y coordinate (approx 0.0 to 1.8)
    // We clamp and scale it slightly to keep the color gradient looking natural
    float colorFactor = clamp(vHeight / 1.5, 0.0, 1.0);
    vec3 bladeColor = mix(baseColor, tipColor, colorFactor);


    // Dead grass: desaturate and yellow shift
    if (uIsDead == 1) {
        float grey = dot(bladeColor, vec3(0.3, 0.5, 0.2));
        bladeColor = mix(bladeColor, vec3(grey * 1.1, grey * 0.95, grey * 0.5), 0.6);
    }

    // Day/night lighting: darker at night, brighter in daytime.
    float ambient = mix(0.10, 0.45, uSunInfluence);
    float tipBoost = mix(0.15, 0.45, uSunInfluence) * colorFactor;
    float light = ambient + tipBoost;


    gl_FragColor = vec4(bladeColor * light, 1.0);
}
