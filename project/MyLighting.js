// Sun/moon directional light, the two wagon lamps, and the day/night cycle
// that drives ambient + diffuse blending across the directional light, the
// terrain shader, and the sky/mountain tints. Owned by MyScene as
// `scene.lighting` and pushes uniforms onto scene.skyShader / scene.terrainShader.
export class MyLighting {
    constructor(scene) {
        this.scene = scene;

        this.sunDirection = vec3.fromValues(-0.35, 0.72, 0.60);
        this.moonDirection = vec3.fromValues(0.35, -0.72, -0.60);
        // one full sun-arc per real-time minute
        this.dayCycleSpeed = (2 * Math.PI) / 60;
        // start a bit past noon so the first frame of Play looks like daylight
        this.dayTime = Math.PI / 2.5;

        // blend factors derived from sun elevation; read by grass, mountain, sky shaders
        this.sunInfluence = 1.0;
        this.moonInfluence = 0.0;
    }

    init() {
        const scene = this.scene;
        scene.setGlobalAmbientLight(0.18, 0.18, 0.20, 1.0);

        if (scene.lights.length > 0) {
            scene.lights[0].setPosition(this.sunDirection[0], this.sunDirection[1], this.sunDirection[2], 0);
            scene.lights[0].setAmbient(0.0, 0.0, 0.0, 1.0);
            scene.lights[0].setDiffuse(1.00, 0.95, 0.80, 1.0);
            scene.lights[0].setSpecular(0.90, 0.82, 0.70, 1.0);
            scene.lights[0].enable();
            scene.lights[0].update();
        }

        if (scene.lights.length > 1) {
            scene.lights[1].setPosition(45, 85, -30, 1);
            scene.lights[1].setAmbient(0.05, 0.05, 0.05, 1.0);
            scene.lights[1].setDiffuse(1.00, 0.90, 0.70, 1.0);
            scene.lights[1].setSpecular(0.80, 0.70, 0.60, 1.0);
            scene.lights[1].setSpotDirection(-45, -85, 30);
            scene.lights[1].setSpotExponent(8);
            scene.lights[1].setSpotCutOff(55);
            scene.lights[1].enable();
            scene.lights[1].update();
        }

        // two warm lamps mounted on the wagon — positions are wagon-local and get
        // re-pushed each frame in updateLampPositions(). Initial values here are
        // just so the lights have valid state before the first update.
        if (scene.lights.length > 2) {
            scene.lights[2].setPosition(1.3, 1.3, 0.75, 1); // lamp 1
            scene.lights[2].setAmbient(0, 0, 0, 1);
            scene.lights[2].setDiffuse(1.0, 0.7, 0.2, 1);
            scene.lights[2].setSpecular(1.0, 0.7, 0.2, 1);
            scene.lights[2].setConstantAttenuation(0.4);
            scene.lights[2].setLinearAttenuation(0.08);
            scene.lights[2].setQuadraticAttenuation(0.012);
            scene.lights[2].disable();
            scene.lights[2].update();
        }

        if (scene.lights.length > 3) {
            scene.lights[3].setPosition(1.4, 1.45, -0.6, 1); // lamp 2
            scene.lights[3].setAmbient(0, 0, 0, 1);
            scene.lights[3].setDiffuse(1.0, 0.7, 0.2, 1);
            scene.lights[3].setSpecular(1.0, 0.7, 0.2, 1);
            scene.lights[3].setConstantAttenuation(0.1);
            scene.lights[3].setLinearAttenuation(0.2);
            scene.lights[3].setQuadraticAttenuation(0.1);
            scene.lights[3].disable();
            scene.lights[3].update();
        }

        this._applyDynamicLighting();
    }

    update(t, dt, playing) {
        // dt-accumulated so the cycle freezes cleanly while the menu is up
        if (playing && dt > 0) {
            this.dayTime += dt * this.dayCycleSpeed;
        }
        this.sunDirection = vec3.fromValues(
            Math.cos(this.dayTime),
            Math.sin(this.dayTime),
            0.6
        );
        this.moonDirection = vec3.fromValues(
            -this.sunDirection[0],
            -this.sunDirection[1],
            -this.sunDirection[2]
        );

        if (this.scene.skyShader) {
            this.scene.skyShader.setUniformsValues({
                uSunDirection: this.sunDirection,
                uMoonDirection: this.moonDirection
            });
        }

        this._applyDynamicLighting();
    }

    // re-issue light.update() each render so any state changes from
    // _applyDynamicLighting take effect; the spotlight stays disabled.
    updateLightStates() {
        const scene = this.scene;
        if (scene.lights.length > 0) scene.lights[0].update();
        if (scene.lights.length > 1) scene.lights[1].update();
        if (scene.lights.length > 2) scene.lights[2].update();
        if (scene.lights.length > 3) scene.lights[3].update();
    }

    _applyDynamicLighting() {
        const scene = this.scene;
        const sunElevation = this.sunDirection[1];

        // blend sun/moon through twilight for gradual transitions
        this.sunInfluence = MyLighting.smoothstep(-0.12, 0.32, sunElevation);
        this.moonInfluence = 1.0 - MyLighting.smoothstep(-0.32, 0.12, sunElevation);

        const ambientNight = [0.10, 0.11, 0.16];
        const ambientDay = [0.24, 0.24, 0.22];
        const ambientR = ambientNight[0] + (ambientDay[0] - ambientNight[0]) * this.sunInfluence;
        const ambientG = ambientNight[1] + (ambientDay[1] - ambientNight[1]) * this.sunInfluence;
        const ambientB = ambientNight[2] + (ambientDay[2] - ambientNight[2]) * this.sunInfluence;
        scene.setGlobalAmbientLight(ambientR, ambientG, ambientB, 1.0);

        let activeDir = this.sunDirection;

        if (scene.lights.length > 0) {
            const dayStrength = 0.25 + 0.95 * this.sunInfluence;
            const twilightWarmth = 1.0 - MyLighting.smoothstep(0.05, 0.45, sunElevation);
            const dayColor = [
                1.0,
                0.86 + 0.10 * (1.0 - twilightWarmth),
                0.64 + 0.22 * (1.0 - twilightWarmth)
            ];

            const moonStrength = 0.08 + 0.24 * this.moonInfluence;
            const moonColor = [0.38, 0.46, 0.62];

            const diffuseR = dayColor[0] * dayStrength * this.sunInfluence + moonColor[0] * moonStrength * this.moonInfluence;
            const diffuseG = dayColor[1] * dayStrength * this.sunInfluence + moonColor[1] * moonStrength * this.moonInfluence;
            const diffuseB = dayColor[2] * dayStrength * this.sunInfluence + moonColor[2] * moonStrength * this.moonInfluence;

            const daySpec = 0.05 + 0.80 * this.sunInfluence;
            const moonSpec = 0.02 + 0.10 * this.moonInfluence;
            const specR = daySpec * this.sunInfluence + moonSpec * this.moonInfluence;
            const specG = (daySpec * 0.95) * this.sunInfluence + (moonSpec * 1.05) * this.moonInfluence;
            const specB = (daySpec * 0.85) * this.sunInfluence + (moonSpec * 1.20) * this.moonInfluence;

            activeDir = (this.sunInfluence >= this.moonInfluence) ? this.sunDirection : this.moonDirection;
            scene.lights[0].setPosition(activeDir[0], activeDir[1], activeDir[2], 0);
            scene.lights[0].setDiffuse(diffuseR, diffuseG, diffuseB, 1.0);
            scene.lights[0].setSpecular(specR, specG, specB, 1.0);
        }

        if (scene.terrainShader) {
            const terrainAmbient = 0.08 + 0.22 * this.sunInfluence;
            const terrainDiffuse = 0.08 + 0.57 * this.sunInfluence;
            scene.terrainShader.setUniformsValues({
                uLightDir: activeDir,
                uAmbientStrength: terrainAmbient,
                uDiffuseStrength: terrainDiffuse
            });
        }

        if (scene.lights.length > 2) {
            // lamps on when sun is low
            if (this.moonInfluence > 0.5) {
                scene.lights[2].enable();
                if (scene.lights.length > 3) scene.lights[3].enable();
            } else {
                scene.lights[2].disable();
                if (scene.lights.length > 3) scene.lights[3].disable();
            }
        }

        this._updateLampPositions();
    }

    _updateLampPositions() {
        const scene = this.scene;
        if (!scene.wagon) return;

        // lamp positions in the wagon's pre-scale local frame
        const lampsLocal = [
            [1.3, 1.1,  0.75],
            [1.3, 1.1, -0.75]
        ];

        const cosH = Math.cos(scene.wagon.heading);
        const sinH = Math.sin(scene.wagon.heading);
        const scale = 1.5; // matches WAGON_SCALE inside MyWagon.display

        const world = lampsLocal.map(([lx, ly, lz]) => [
            scene.wagon.position[0] + scale * (lx * cosH + lz * sinH),
            scene.wagon.position[1] + scale * ly,
            scene.wagon.position[2] + scale * (-lx * sinH + lz * cosH)
        ]);

        if (scene.lights.length > 2) {
            scene.lights[2].setPosition(world[0][0], world[0][1], world[0][2], 1);
        }
        if (scene.lights.length > 3) {
            scene.lights[3].setPosition(world[1][0], world[1][1], world[1][2], 1);
        }

        // terrain runs its own shader, so feed it the lamp world positions
        if (scene.terrainShader) {
            scene.terrainShader.setUniformsValues({
                uLamp0Pos: world[0],
                uLamp1Pos: world[1],
                uLampStrength: this.moonInfluence > 0.5 ? 1.0 : 0.0
            });
        }
    }

    static smoothstep(edge0, edge1, x) {
        const t = Math.max(0.0, Math.min(1.0, (x - edge0) / (edge1 - edge0)));
        return t * t * (3.0 - 2.0 * t);
    }
}
