import { CGFscene, CGFcamera, CGFaxis, CGFappearance, CGFshader, CGFtexture } from "../lib/CGF.js";
import { MySkyDome } from "./models/environment/MySkyDome.js";
import { MyPlane } from "./models/primitives/MyPlane.js";
import { MyWagon } from "./models/props/wagon/MyWagon.js";
import { MyHayBale } from "./models/props/hay-bale/MyHayBale.js";
import { MyBarn } from "./models/props/barn/MyBarn.js";
import { MyTerrain } from "./models/environment/MyTerrain.js";
import { MyRockSet } from "./models/environment/MyRockSet.js";
import { MyFlowerSet } from "./models/environment/MyFlowerSet.js";
import { MyGrassSet } from "./models/environment/MyGrassSet.js";
import { MyMountainPanorama } from "./models/environment/MyMountainPanorama.js";

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
        this.spotLightEnabled = false; // off by default so the sun controls the lighting

        this.cloudSpeed = 0.01;
        this.cloudOffset = 0.0;
        this.skyRadius = 260.0;
        this.terrainYOffset = 0.0;

        this.sunDirection = vec3.fromValues(-0.35, 0.72, 0.60);
        this.moonDirection = vec3.fromValues(0.35, -0.72, -0.60);
        this.dayCycleSpeed = 0.2;
        this.dayTime = Math.PI / 2.5;
        this.sunInfluence = 1.0;
        this.moonInfluence = 0.0;
        this.pauseDayCycle = true;

        // wagon physics needs a real dt between frames
        this.lastUpdateTime = null;

        // hay bale state — ground position, carry flag, and key edge-trigger memory
        this.balePos = [5, 0.9, 5];
        this.baleHeld = false;
        // reach point sits ahead of the wagon centre (near the horse), with a
        // generous radius so the bale only needs to be in front of the rig
        this.pickupReachOffset = 5.0;
        this.balePickupRadius = 4.5;
        this.prevPickupKey = false;
        this.prevDropKey = false;
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
        this.terrain = new MyTerrain(this, 128, 520, 10, 42);
        this.rockSet = new MyRockSet(this, this.terrain, 30, 200, 123);
        this.flowerSet = new MyFlowerSet(this, this.terrain, 50, 190, 777);
        // many small patches so they hug the rolling hills
        this.grassSet = new MyGrassSet(this, this.terrain, 400, 100, 250, 456);
        this.mountainPanorama = new MyMountainPanorama(this, 80, 80, 250, 30);
        this.mountainFarPanorama = new MyMountainPanorama(this, 80, 120, 255, 10);

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

        this.mountainAppearance = new CGFappearance(this);
        this.mountainAppearance.setAmbient(1, 1, 1, 1);
        this.mountainAppearance.setDiffuse(1, 1, 1, 1);
        this.mountainAppearance.setSpecular(0, 0, 0, 1);
        this.mountainAppearance.setShininess(1.0);
        this.mountainTexture = new CGFtexture(this, "textures/environment/sky/hills.png");
        this.mountainAppearance.setTexture(this.mountainTexture);
        this.mountainAppearance.setTextureWrap('REPEAT', 'CLAMP_TO_EDGE');

        this.mountainFarAppearance = new CGFappearance(this);
        this.mountainFarAppearance.setAmbient(0.5, 0.5, 0.6, 1); // darker silhouette for the far layer
        this.mountainFarAppearance.setDiffuse(0.5, 0.5, 0.6, 1);
        this.mountainFarAppearance.setSpecular(0, 0, 0, 1);
        this.mountainFarAppearance.setShininess(1.0);
        this.mountainFarTexture = new CGFtexture(this, "textures/environment/sky/mountains.png");
        this.mountainFarAppearance.setTexture(this.mountainFarTexture);
        this.mountainFarAppearance.setTextureWrap('REPEAT', 'CLAMP_TO_EDGE');


        this.terrainAppearance = new CGFappearance(this);
        this.terrainAppearance.setAmbient(0.8, 0.8, 0.8, 1.0);
        this.terrainAppearance.setDiffuse(1.0, 1.0, 1.0, 1.0);
        this.terrainAppearance.setSpecular(0.05, 0.05, 0.05, 1.0);
        this.terrainAppearance.setShininess(8.0);

        this.grassTexture = new CGFtexture(this, "textures/environment/terrain/grass.jpeg");
        this.dirtTexture = new CGFtexture(this, "textures/environment/terrain/dirt.png");
        this.flowerTexture = new CGFtexture(this, "textures/environment/terrain/flowers.png");

        this.terrainShader = new CGFshader(this.gl, "shaders/terrain.vert", "shaders/terrain.frag");
        this.terrainShader.setUniformsValues({
            uGrassTexture: 0,
            uDirtTexture: 1,
            uFlowerTexture: 2,
            uTerrainSize: 520.0,
            uTerrainRadius: 255.0,
            uLightDir: this.sunDirection,
            uAmbientStrength: 0.18,
            uDiffuseStrength: 0.65
        });

        this.skyShader = new CGFshader(this.gl, "shaders/sky.vert", "shaders/sky.frag");
        this.moonTexture = new CGFtexture(this, "textures/environment/sky/moon.jpg");
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
            this.lights[2].setPosition(1.3, 1.3, 0.75, 1); // lamp 1
            this.lights[2].setAmbient(0, 0, 0, 1);
            this.lights[2].setDiffuse(1.0, 0.7, 0.2, 1); // warm
            this.lights[2].setSpecular(1.0, 0.7, 0.2, 1);
            this.lights[2].setConstantAttenuation(0.1);
            this.lights[2].setLinearAttenuation(0.2);
            this.lights[2].setQuadraticAttenuation(0.1);
            this.lights[2].disable();
            this.lights[2].update();
        }

        if (this.lights.length > 3) {
            this.lights[3].setPosition(1.3, 1.3, -0.75, 1); // lamp 2
            this.lights[3].setAmbient(0, 0, 0, 1);
            this.lights[3].setDiffuse(1.0, 0.7, 0.2, 1); // warm
            this.lights[3].setSpecular(1.0, 0.7, 0.2, 1);
            this.lights[3].setConstantAttenuation(0.1);
            this.lights[3].setLinearAttenuation(0.2);
            this.lights[3].setQuadraticAttenuation(0.1);
            this.lights[3].disable();
            this.lights[3].update();
        }

        if (this.lights.length > 3) {
            this.lights[3].setPosition(1.4, 1.45, -0.6, 1); // lamp 2
            this.lights[3].setAmbient(0, 0, 0, 1);
            this.lights[3].setDiffuse(1.0, 0.7, 0.2, 1); // warm
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

        // blend sun/moon through twilight for gradual transitions
        this.sunInfluence = this.smoothstep(-0.12, 0.32, sunElevation);
        this.moonInfluence = 1.0 - this.smoothstep(-0.32, 0.12, sunElevation);

        const ambientNight = [0.10, 0.11, 0.16];
        const ambientDay = [0.24, 0.24, 0.22];
        const ambientR = ambientNight[0] + (ambientDay[0] - ambientNight[0]) * this.sunInfluence;
        const ambientG = ambientNight[1] + (ambientDay[1] - ambientNight[1]) * this.sunInfluence;
        const ambientB = ambientNight[2] + (ambientDay[2] - ambientNight[2]) * this.sunInfluence;
        this.setGlobalAmbientLight(ambientR, ambientG, ambientB, 1.0);

        let activeDir = this.sunDirection;

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

            activeDir = (this.sunInfluence >= this.moonInfluence) ? this.sunDirection : this.moonDirection;
            this.lights[0].setPosition(activeDir[0], activeDir[1], activeDir[2], 0);
            this.lights[0].setDiffuse(diffuseR, diffuseG, diffuseB, 1.0);
            this.lights[0].setSpecular(specR, specG, specB, 1.0);
        }

        if (this.terrainShader) {
            const terrainAmbient = 0.08 + 0.22 * this.sunInfluence;
            const terrainDiffuse = 0.08 + 0.57 * this.sunInfluence;
            this.terrainShader.setUniformsValues({
                uLightDir: activeDir,
                uAmbientStrength: terrainAmbient,
                uDiffuseStrength: terrainDiffuse
            });
        }

        if (this.lights.length > 2) {
            // lamps on when sun is low
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
        // dt in seconds, clamped so a tab-switch pause doesn't teleport the wagon
        let dt = 0;
        if (this.lastUpdateTime !== null) {
            dt = (t - this.lastUpdateTime) / 1000.0;
            if (dt < 0) dt = 0;
            if (dt > 0.1) dt = 0.1;
        }
        this.lastUpdateTime = t;

        if (!this.pauseDayCycle) {
            this.dayTime = (t / 1000.0) * this.dayCycleSpeed;
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

        this.cloudOffset = ((t / 1000.0) * this.cloudSpeed) % 1000.0;

        this.skyShader.setUniformsValues({
            uSunDirection: this.sunDirection,
            uMoonDirection: this.moonDirection
        });

        this.applyDynamicLighting();

        this.grassSet.update(t, this.sunInfluence);

        if (this.wagon && dt > 0) {
            this.wagon.update(dt);
            this.handleHayBaleKeys();
        }
    }

    handleHayBaleKeys() {
        if (!this.gui) return;
        const pickupKey = this.gui.isKeyPressed("KeyP");
        const dropKey = this.gui.isKeyPressed("KeyL");

        // edge-trigger so one tap = one action
        if (pickupKey && !this.prevPickupKey && !this.baleHeld) {
            // pickup zone centred ahead of the wagon so the horse blocking the body
            // doesn't make the bale unreachable
            const reachX = this.wagon.position[0] + this.pickupReachOffset * Math.cos(this.wagon.heading);
            const reachZ = this.wagon.position[2] - this.pickupReachOffset * Math.sin(this.wagon.heading);
            const dx = reachX - this.balePos[0];
            const dz = reachZ - this.balePos[2];
            if (dx * dx + dz * dz <= this.balePickupRadius * this.balePickupRadius) {
                if (this.wagon.pickup(this.hayBale)) {
                    this.baleHeld = true;
                }
            }
        }

        if (dropKey && !this.prevDropKey && this.baleHeld) {
            const dropPos = this.wagon.dropPosition();
            this.wagon.releaseBale();
            this.balePos[0] = dropPos[0];
            this.balePos[1] = 0.9; // resting height above terrainYOffset
            this.balePos[2] = dropPos[2];
            this.baleHeld = false;
        }

        this.prevPickupKey = pickupKey;
        this.prevDropKey = dropKey;
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

        // camera lives inside the dome, so render both sides
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
            this.cloudShader.setUniformsValues({ uCloudOffset: this.cloudOffset });
            this.pushMatrix();
            // inner shell avoids z-fighting with the base sky
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

        // sits just below the terrain base so it never z-fights
        this.translate(0, this.terrainYOffset - 0.02, 0);
        this.rotate(-Math.PI / 2, 1, 0, 0);
        this.scale(650, 650, 1);

        this.floorAppearance.apply();
        this.floor.display();

        this.popMatrix();
    }

    displayTerrain() {
        this.pushMatrix();

        this.translate(0, this.terrainYOffset, 0);

        this.terrainAppearance.apply();
        this.setActiveShader(this.terrainShader);

        this.grassTexture.bind(0);
        this.dirtTexture.bind(1);
        this.flowerTexture.bind(2);

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
            this.pushMatrix();
            this.translate(0, this.terrainYOffset, 0);
            this.rockSet.display();
            this.popMatrix();
        }

        if (this.showFlowers) {
            this.pushMatrix();
            this.translate(0, this.terrainYOffset, 0);
            this.flowerSet.display();
            this.popMatrix();
        }

        if (this.showGrass) {
            this.pushMatrix();
            this.translate(0, this.terrainYOffset, 0);
            this.grassSet.display();
            this.popMatrix();
        }

        this.displayMountainPanorama();

        this.pushMatrix();
        this.translate(0, this.terrainYOffset, 0);
        this.wagon.display();
        this.popMatrix();

        this.pushMatrix();
        this.translate(this.barnPos.x, this.terrainYOffset, this.barnPos.z);
        this.barn.display();
        this.popMatrix();

        if (!this.baleHeld) {
            this.pushMatrix();
            this.translate(this.balePos[0], this.terrainYOffset + this.balePos[1], this.balePos[2]);
            this.scale(2.0, 2.0, 2.0);
            this.hayBale.display();
            this.popMatrix();
        }

        if (this.displayAxis) {
            this.axis.display();
        }
    }

    displayMountainPanorama() {
        this.pushMatrix();

        // sky shader must not affect the panorama
        this.setActiveShader(this.defaultShader);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.pushMatrix();
        this.translate(0, this.terrainYOffset - 20, 0);
        this.mountainFarAppearance.apply();
        this.mountainFarPanorama.display();
        this.popMatrix();

        this.pushMatrix();
        this.translate(0, this.terrainYOffset - 10, 0);
        this.mountainAppearance.apply();
        this.mountainPanorama.display();
        this.popMatrix();

        this.gl.disable(this.gl.BLEND);
        this.popMatrix();
    }
}
