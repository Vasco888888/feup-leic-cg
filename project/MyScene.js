import { CGFscene, CGFcamera, CGFaxis, CGFappearance, CGFshader, CGFtexture } from "../lib/CGF.js";
import { MySkyDome } from "./MySkyDome.js";
import { MyPlane } from "./MyPlane.js";
import { MyWagon } from "./models/wagon/MyWagon.js";
import { MyHayBale } from "./models/hay-bale/MyHayBale.js";
import { MyBarn } from "./models/barn/MyBarn.js";
import { MyTerrain } from "./MyTerrain.js";
import { MyRockSet } from "./MyRockSet.js";
import { MyFlowerSet } from "./MyFlowerSet.js";
import { MyGrassSet } from "./MyGrassSet.js";

export class MyScene extends CGFscene {
    constructor() {
        super();

        this.displayAxis = true;
        this.showSky = true;
        this.showClouds = true;
        this.showTerrain = true;
        this.terrainWireframe = false;
        this.showRocks = true;
        this.showFlowers = true;
        this.showGrass = true;

        this.sunLightEnabled = true;
        this.spotLightEnabled = false; // Disabled by default so the sun controls the lighting

        this.cloudSpeed = 0.01;
        this.cloudOffset = 0.0;
        this.skyRadius = 260.0;

        this.sunDirection = vec3.fromValues(-0.35, 0.72, 0.60);
        this.moonDirection = vec3.fromValues(0.35, -0.72, -0.60);
        this.dayCycleSpeed = 0.2;
        this.dayTime = 0;
        this.sunInfluence = 1.0;
        this.moonInfluence = 0.0;
    }

    init(application) {
        super.init(application);

        this.initCameras();
        this.initLights();

        this.gl.clearColor(0.53, 0.75, 0.96, 1.0);
        this.gl.clearDepth(100.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.enableTextures(true);

        this.axis = new CGFaxis(this, 8, 0.1);
        this.skyDome = new MySkyDome(this, 80, 28);
        this.floor = new MyPlane(this, 20);
        this.wagon = new MyWagon(this);
        this.hayBale = new MyHayBale(this);
        this.barn = new MyBarn(this);
        this.barnPos = { x: -20, z: -20 };
        this.terrain = new MyTerrain(this, 128, 520, 22, 42);
        this.rockSet = new MyRockSet(this, this.terrain, 30, 200, 123);
        this.flowerSet = new MyFlowerSet(this, this.terrain, 50, 190, 777);
        this.grassSet = new MyGrassSet(this, this.terrain, 40, 15, 190, 456);

        this.skyAppearance = new CGFappearance(this);
        this.skyAppearance.setAmbient(1.0, 1.0, 1.0, 1.0);
        this.skyAppearance.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.skyAppearance.setSpecular(0.0, 0.0, 0.0, 1.0);
        this.skyAppearance.setShininess(1.0);

        this.cloudAppearance = new CGFappearance(this);
        this.cloudAppearance.setAmbient(1.0, 1.0, 1.0, 1.0);
        this.cloudAppearance.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.cloudAppearance.setSpecular(0.0, 0.0, 0.0, 1.0);
        this.cloudAppearance.setShininess(1.0);

        this.floorAppearance = new CGFappearance(this);
        this.floorAppearance.setAmbient(0.08, 0.24, 0.08, 1.0);
        this.floorAppearance.setDiffuse(0.18, 0.62, 0.20, 1.0);
        this.floorAppearance.setSpecular(0.04, 0.10, 0.04, 1.0);
        this.floorAppearance.setShininess(12.0);

        // ── Terrain appearance & shader ──
        this.terrainAppearance = new CGFappearance(this);
        this.terrainAppearance.setAmbient(0.8, 0.8, 0.8, 1.0);
        this.terrainAppearance.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.terrainAppearance.setSpecular(0.05, 0.05, 0.05, 1.0);
        this.terrainAppearance.setShininess(8.0);

        this.grassTexture = new CGFtexture(this, "textures/grass.png");
        this.dirtTexture  = new CGFtexture(this, "textures/dirt.png");

        this.terrainShader = new CGFshader(this.gl, "shaders/terrain.vert", "shaders/terrain.frag");
        this.terrainShader.setUniformsValues({
            uGrassTexture:  0,
            uDirtTexture:   1,
            uTerrainSize:   520.0,
            uTerrainRadius: 255.0
        });

        this.skyShader = new CGFshader(this.gl, "shaders/sky.vert", "shaders/sky.frag");
        this.moonTexture = new CGFtexture(this, "textures/environment/moon.jpg");
        this.skyShader.setUniformsValues({
            uSunDirection: this.sunDirection,
            uSunColor: [1.0, 0.92, 0.73],
            uMoonTexture: 0
        });

        this.cloudShader = new CGFshader(this.gl, "shaders/clouds.vert", "shaders/clouds.frag");
        this.cloudShader.setUniformsValues({ uCloudOffset: 0.0 });

        this.setUpdatePeriod(50);
    }

    initCameras() {
        this.camera = new CGFcamera(
            0.4,
            0.1,
            1000,
            vec3.fromValues(35, 25, 35),
            vec3.fromValues(0, 8, 0)
        );
    }

    initLights() {
        this.setGlobalAmbientLight(0.18, 0.18, 0.20, 1.0);

        if (this.lights.length > 0) {
            this.lights[0].setPosition(this.sunDirection[0], this.sunDirection[1], this.sunDirection[2], 0);
            this.lights[0].setAmbient(0.0, 0.0, 0.0, 1.0);
            this.lights[0].setDiffuse(1.00, 0.95, 0.80, 1.0);
            this.lights[0].setSpecular(0.90, 0.82, 0.70, 1.0);
            this.lights[0].enable();
            this.lights[0].update();
        }

        if (this.lights.length > 1) {
            this.lights[1].setPosition(45, 85, -30, 1);
            this.lights[1].setAmbient(0.05, 0.05, 0.05, 1.0);
            this.lights[1].setDiffuse(1.00, 0.90, 0.70, 1.0);
            this.lights[1].setSpecular(0.80, 0.70, 0.60, 1.0);
            this.lights[1].setSpotDirection(-45, -85, 30);
            this.lights[1].setSpotExponent(8);
            this.lights[1].setSpotCutOff(55);
            this.lights[1].enable();
            this.lights[1].update();
        }

        if (this.lights.length > 2) {
            this.lights[2].setPosition(1.3, 1.3, 0.75, 1); // Lamp 1 position
            this.lights[2].setAmbient(0, 0, 0, 1);
            this.lights[2].setDiffuse(1.0, 0.7, 0.2, 1); // Warm light
            this.lights[2].setSpecular(1.0, 0.7, 0.2, 1);
            this.lights[2].setConstantAttenuation(0.1);
            this.lights[2].setLinearAttenuation(0.2);
            this.lights[2].setQuadraticAttenuation(0.1);
            this.lights[2].disable();
            this.lights[2].update();
        }

        if (this.lights.length > 3) {
            this.lights[3].setPosition(1.3, 1.3, -0.75, 1); // Lamp 2 position
            this.lights[3].setAmbient(0, 0, 0, 1);
            this.lights[3].setDiffuse(1.0, 0.7, 0.2, 1); // Warm light
            this.lights[3].setSpecular(1.0, 0.7, 0.2, 1);
            this.lights[3].setConstantAttenuation(0.1);
            this.lights[3].setLinearAttenuation(0.2);
            this.lights[3].setQuadraticAttenuation(0.1);
            this.lights[3].disable();
            this.lights[3].update();
        }

        if (this.lights.length > 3) {
            this.lights[3].setPosition(1.4, 1.45, -0.6, 1); // Lamp 2 position
            this.lights[3].setAmbient(0, 0, 0, 1);
            this.lights[3].setDiffuse(1.0, 0.7, 0.2, 1); // Warm light
            this.lights[3].setSpecular(1.0, 0.7, 0.2, 1);
            this.lights[3].setConstantAttenuation(0.1);
            this.lights[3].setLinearAttenuation(0.2);
            this.lights[3].setQuadraticAttenuation(0.1);
            this.lights[3].disable();
            this.lights[3].update();
        }

        this.applyDynamicLighting();
    }

    smoothstep(edge0, edge1, x) {
        const t = Math.max(0.0, Math.min(1.0, (x - edge0) / (edge1 - edge0)));
        return t * t * (3.0 - 2.0 * t);
    }

    applyDynamicLighting() {
        const sunElevation = this.sunDirection[1];

        // Sun and moon are blended through twilight so transitions are gradual.
        this.sunInfluence = this.smoothstep(-0.12, 0.32, sunElevation);
        this.moonInfluence = 1.0 - this.smoothstep(-0.32, 0.12, sunElevation);

        const ambientNight = [0.10, 0.11, 0.16];
        const ambientDay = [0.24, 0.24, 0.22];
        const ambientR = ambientNight[0] + (ambientDay[0] - ambientNight[0]) * this.sunInfluence;
        const ambientG = ambientNight[1] + (ambientDay[1] - ambientNight[1]) * this.sunInfluence;
        const ambientB = ambientNight[2] + (ambientDay[2] - ambientNight[2]) * this.sunInfluence;
        this.setGlobalAmbientLight(ambientR, ambientG, ambientB, 1.0);

        if (this.lights.length > 0) {
            const dayStrength = 0.25 + 0.95 * this.sunInfluence;
            const twilightWarmth = 1.0 - this.smoothstep(0.05, 0.45, sunElevation);
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

            const activeDir = (this.sunInfluence >= this.moonInfluence) ? this.sunDirection : this.moonDirection;
            this.lights[0].setPosition(activeDir[0], activeDir[1], activeDir[2], 0);
            this.lights[0].setDiffuse(diffuseR, diffuseG, diffuseB, 1.0);
            this.lights[0].setSpecular(specR, specG, specB, 1.0);
        }

        if (this.lights.length > 2) {
            // Lamp is on when sun is low
            if (this.moonInfluence > 0.5) {
                this.lights[2].enable();
                if (this.lights.length > 3) this.lights[3].enable();
            } else {
                this.lights[2].disable();
                if (this.lights.length > 3) this.lights[3].disable();
            }
        }
    }

    update(t) {
        this.dayTime = (t / 1000.0) * this.dayCycleSpeed;
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

        this.cloudOffset = ((t / 1000.0) * this.cloudSpeed) % 1000.0;
        
        this.skyShader.setUniformsValues({ 
            uSunDirection: this.sunDirection,
            uMoonDirection: this.moonDirection
        });

        this.applyDynamicLighting();

        // Light direction and intensity are updated in applyDynamicLighting.
        // Update grass wind animation
        this.grassSet.update(t);
    }

    updateLightStates() {
        if (this.lights.length > 0) {
            if (this.sunLightEnabled) this.lights[0].enable();
            else this.lights[0].disable();
            this.lights[0].update();
        }

        if (this.lights.length > 1) {
            if (this.spotLightEnabled) this.lights[1].enable();
            else this.lights[1].disable();
            this.lights[1].update();
        }

        if (this.lights.length > 2) {
            this.lights[2].update();
        }
        if (this.lights.length > 3) {
            this.lights[3].update();
        }
    }

    displaySkyDome() {
        this.pushMatrix();
        this.scale(this.skyRadius, this.skyRadius, this.skyRadius);

        // Gameplay is inside the dome, so render both sides for this pass.
        this.gl.disable(this.gl.CULL_FACE);

        this.skyAppearance.apply();
        this.setActiveShader(this.skyShader);
        this.skyShader.setUniformsValues({ uSunDirection: this.sunDirection });
        this.moonTexture.bind(0);
        this.skyDome.display();

        if (this.showClouds) {
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

            this.cloudAppearance.apply();
            this.setActiveShader(this.cloudShader);
            this.pushMatrix();
            // Draw clouds on a slightly inner shell to avoid z-overlap with the base sky.
            this.scale(0.985, 0.985, 0.985);
            this.skyDome.display();
            this.popMatrix();

            this.gl.disable(this.gl.BLEND);
        }

        this.gl.enable(this.gl.CULL_FACE);

        this.setActiveShader(this.defaultShader);
        this.popMatrix();
    }
    displayFloor() {
        this.pushMatrix();

        // Put a large green floor slightly below origin.
        this.translate(0, -0.02, 0);
        this.rotate(-Math.PI / 2, 1, 0, 0);
        this.scale(650, 650, 1);

        this.floorAppearance.apply();
        this.floor.display();

        this.popMatrix();
    }

    displayTerrain() {
        this.pushMatrix();

        this.terrainAppearance.apply();
        this.setActiveShader(this.terrainShader);

        // Bind textures to the correct sampler units
        this.grassTexture.bind(0);
        this.dirtTexture.bind(1);

        if (this.terrainWireframe) {
            this.terrain.setLineMode();
        } else {
            this.terrain.setFillMode();
        }

        this.terrain.display();

        this.setActiveShader(this.defaultShader);
        this.popMatrix();
    }

    display() {
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.updateProjectionMatrix();
        this.loadIdentity();
        this.applyViewMatrix();

        this.updateLightStates();

        if (this.showSky) {
            this.gl.depthMask(false);
            this.displaySkyDome();
            this.gl.depthMask(true);
        }

        if (this.showTerrain) {
            this.displayTerrain();
        } else {
            this.displayFloor();
        }

        if (this.showRocks) {
            this.rockSet.display();
        }

        if (this.showFlowers) {
            this.flowerSet.display();
        }

        if (this.showGrass) {
            this.grassSet.display();
        }

        this.wagon.display();

        // Display Barn
        this.pushMatrix();
        this.translate(this.barnPos.x, 0, this.barnPos.z);
        this.barn.display();
        this.popMatrix();

        // Display Hay Bale
        this.pushMatrix();
        this.translate(5, 0.25, 5);
        this.hayBale.display();
        this.popMatrix();

        if (this.displayAxis) {
            this.axis.display();
        }
    }
}
