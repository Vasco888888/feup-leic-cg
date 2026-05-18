import { CGFscene, CGFcamera, CGFaxis, CGFappearance, CGFshader, CGFtexture } from "../lib/CGF.js";
import { MySkyDome } from "./models/environment/MySkyDome.js";
import { MyPlane } from "./models/primitives/MyPlane.js";
import { MyWagon } from "./models/props/wagon/MyWagon.js";
import { MyHayBale } from "./models/props/hay-bale/MyHayBale.js";
import { MyHayBaleArrow } from "./models/props/hay-bale/MyHayBaleArrow.js";
import { MyBarn } from "./models/props/barn/MyBarn.js";
import { MyTerrain } from "./models/environment/MyTerrain.js";
import { MyRockSet } from "./models/environment/MyRockSet.js";
import { MyFlowerSet } from "./models/environment/MyFlowerSet.js";
import { MyGrassSet } from "./models/environment/MyGrassSet.js";
import { MyMountainPanorama } from "./models/environment/MyMountainPanorama.js";

export class MyScene extends CGFscene {
    constructor() {
        super();

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
        this.skyRadius = 760.0;
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

        // gameplay HP economy — spec reference values, tune as needed
        this.maxHP = 100;
        this.wagonHP = this.maxHP;
        this.hpDecayPerSec = 1.0;

        // hay bales scattered around the field; populated in init() once barn is placed
        this.bales = [];
        // reach point sits ahead of the wagon centre (near the horse), with a
        // generous radius so the bale only needs to be in front of the rig
        this.pickupReachOffset = 5.0;
        this.balePickupRadius = 4.5;
        this.prevPickupKey = false;
        this.prevDropKey = false;
        // arrows only float above bales the wagon is close to, so finding them feels earned
        this.baleArrowRange = 55.0;

        // 45-degree side view: offsetX gives the side angle, Y and Z roughly equal
        this.cameraFollow = true;
        this.cameraOffsetX = 16.0;
        this.cameraOffsetY = 8.0;
        this.cameraOffsetZ = 18.0;
        this.cameraTargetUp = 4.0;
        this.cameraSmoothTau = 0.4;
        // separate tau so the rotational lag feels heavier than the translational follow
        this.cameraHeadingTau = 0.9;
        // smoothed heading the camera orbits around; matches wagon at rest
        this.cameraHeading = 0;
        // mouse Y position (no drag) raises/lowers the target so the camera tilts up/down
        this.cameraPitchOffset = 0;
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

        this.skyDome = new MySkyDome(this, 80, 28);
        this.floor = new MyPlane(this, 20);
        this.wagon = new MyWagon(this);
        this.hayBale = new MyHayBale(this);
        this.hayBaleArrow = new MyHayBaleArrow(this);
        this.barn = new MyBarn(this);
        this.barnPos = { x: -20, z: -20 };
        this.terrain = new MyTerrain(this, 96, 1200, 12, 42);
        this.bales = this._generateBales(22, 2024);
        this.rockSet = new MyRockSet(this, this.terrain, 95, 520, 123);
        this.flowerSet = new MyFlowerSet(this, this.terrain, 150, 500, 777);
        // many small patches so they hug the rolling hills
        this.grassSet = new MyGrassSet(this, this.terrain, 3500, 480, 580, 456);
        // panoramas sit just outside the terrain disc so the rim never occludes their foothills
        this.mountainPanorama = new MyMountainPanorama(this, 96, 85, 615, 60);
        this.mountainFarPanorama = new MyMountainPanorama(this, 96, 190, 720, 22);

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
            uTerrainSize: 1200.0,
            uTerrainRadius: 595.0,
            uLightDir: this.sunDirection,
            uAmbientStrength: 0.18,
            uDiffuseStrength: 0.65,
            uLamp0Pos: [0, 0, 0],
            uLamp1Pos: [0, 0, 0],
            uLampColor: [1.0, 0.7, 0.2],
            uLampRange: 16.0,
            uLampStrength: 0.0,
            uAOWagon: [0, 0, 1, 0],
            uAOBarn:  [0, 0, 1, 0],
            uAOBale0: [0, 0, 1, 0],
            uAOBale1: [0, 0, 1, 0],
            uAOBale2: [0, 0, 1, 0],
            uCloudOffset: 0.0,
            uCloudShadow: 0.35
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

        this.mountainShader = new CGFshader(this.gl, "shaders/mountain.vert", "shaders/mountain.frag");
        this.mountainShader.setUniformsValues({
            uTexture: 0,
            uTint: [1.0, 1.0, 1.0],
            uFogColor: [0.78, 0.85, 0.92],
            uFogStrength: 0.0,
            uPanoramaHeight: 1.0,
            uSunInfluence: 1.0
        });

        this.setUpdatePeriod(50);
    }

    initCameras() {
        // seed at the rest offset (wagon at origin, facing +X) so the camera
        // starts behind the wagon and doesn't whip in on the first frame
        const startEye = vec3.fromValues(-this.cameraOffsetZ, this.cameraOffsetY, this.cameraOffsetX);
        const startTarget = vec3.fromValues(0, this.cameraTargetUp, 0);
        this.camera = new CGFcamera(0.6, 0.1, 1000, startEye, startTarget);
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
            this.lights[2].setConstantAttenuation(0.4);
            this.lights[2].setLinearAttenuation(0.08);
            this.lights[2].setQuadraticAttenuation(0.012);
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

        this.updateLampPositions();
    }

    updateLampPositions() {
        if (!this.wagon) return;

        // lamp positions in the wagon's pre-scale local frame
        const lampsLocal = [
            [1.3, 1.1,  0.75],
            [1.3, 1.1, -0.75]
        ];

        const cosH = Math.cos(this.wagon.heading);
        const sinH = Math.sin(this.wagon.heading);
        const scale = 1.5; // matches WAGON_SCALE inside MyWagon.display

        const world = lampsLocal.map(([lx, ly, lz]) => [
            this.wagon.position[0] + scale * (lx * cosH + lz * sinH),
            this.wagon.position[1] + scale * ly,
            this.wagon.position[2] + scale * (-lx * sinH + lz * cosH)
        ]);

        if (this.lights.length > 2) {
            this.lights[2].setPosition(world[0][0], world[0][1], world[0][2], 1);
        }
        if (this.lights.length > 3) {
            this.lights[3].setPosition(world[1][0], world[1][1], world[1][2], 1);
        }

        // terrain runs its own shader, so feed it the lamp world positions
        if (this.terrainShader) {
            this.terrainShader.setUniformsValues({
                uLamp0Pos: world[0],
                uLamp1Pos: world[1],
                uLampStrength: this.moonInfluence > 0.5 ? 1.0 : 0.0
            });
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
        this.currentTime = t;

        if (dt > 0) {
            this.wagonHP = Math.max(0, this.wagonHP - this.hpDecayPerSec * dt);
        }

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
            this.wagon.update(dt, this.getColliders());
            // wheels need to ride on the terrain, not the abstract plane at Y=0
            this.wagon.position[1] = this.terrain.getTerrainHeight(
                this.wagon.position[0],
                this.wagon.position[2]
            );
            this.applyWagonTerrainTilt(dt);
            this.handleHayBaleKeys();
            this.applyImpactDamage();
            if (this.cameraFollow) this.updateChaseCamera(dt);
        }

        this.updateTerrainEnvironment();
    }

    _generateBales(count, seed) {
        const bales = [];
        const TWO_PI = Math.PI * 2;
        const terrainSize = 1200;
        const maxDist = 220;
        const minDist = 18;

        const hash = (n) => {
            let h = ((n + seed * 919) * 374761393) | 0;
            h = (h ^ (h >>> 13)) * 1274126177;
            return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
        };

        let attempts = 0;
        while (bales.length < count && attempts < count * 60) {
            const i = attempts;
            attempts++;
            const angle = hash(i * 3) * TWO_PI;
            const dist = minDist + Math.sqrt(hash(i * 3 + 1)) * (maxDist - minDist);
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;

            // keep bales off the dirt roads
            const u = x / terrainSize + 0.5;
            const v = z / terrainSize + 0.5;
            const c1 = 0.5
                + 0.18 * Math.sin(v * TWO_PI * 1.2 + 0.8)
                + 0.08 * Math.sin(v * TWO_PI * 2.7 + 2.1);
            const c2 = 0.5
                + 0.16 * Math.sin(u * TWO_PI * 1.0 + 1.6)
                + 0.07 * Math.sin(u * TWO_PI * 2.4 + 4.3);
            if (Math.abs(u - c1) < 0.045) continue;
            if (Math.abs(v - c2) < 0.045) continue;

            // keep clear of the barn and the wagon spawn
            const dxBarn = x - this.barnPos.x;
            const dzBarn = z - this.barnPos.z;
            if (dxBarn * dxBarn + dzBarn * dzBarn < 90) continue;

            // small no-spawn ring around origin where the wagon starts
            if (x * x + z * z < 80) continue;

            bales.push({ pos: [x, 0, z], held: false });
        }
        return bales;
    }

    applyWagonTerrainTilt(dt) {
        const w = this.wagon;
        const cosH = Math.cos(w.heading);
        const sinH = Math.sin(w.heading);

        // wheelbase/track in world units; mirrors MyWagon's wheel offsets
        const halfWheelbase = 1.1 * 1.5;
        const halfTrack     = 1.1 * 1.5;

        const fx = w.position[0] + halfWheelbase * cosH;
        const fz = w.position[2] - halfWheelbase * sinH;
        const rx = w.position[0] - halfWheelbase * cosH;
        const rz = w.position[2] + halfWheelbase * sinH;

        const leftX  = w.position[0] - halfTrack * sinH;
        const leftZ  = w.position[2] - halfTrack * cosH;
        const rightX = w.position[0] + halfTrack * sinH;
        const rightZ = w.position[2] + halfTrack * cosH;

        const hf = this.terrain.getTerrainHeight(fx, fz);
        const hr = this.terrain.getTerrainHeight(rx, rz);
        const hl = this.terrain.getTerrainHeight(leftX, leftZ);
        const hri = this.terrain.getTerrainHeight(rightX, rightZ);

        const targetPitch = Math.atan2(hf - hr, halfWheelbase * 2.0);
        // right-side-higher rolls the body LEFT (away from the rise), so flip sign
        const targetRoll  = Math.atan2(hl - hri, halfTrack * 2.0);

        // smooth so quick bumps don't make the body shake
        const k = 1.0 - Math.exp(-dt / 0.12);
        w.pitch += (targetPitch - w.pitch) * k;
        w.roll  += (targetRoll  - w.roll)  * k;
    }

    updateTerrainEnvironment() {
        if (!this.terrainShader) return;

        const aoOff = [0, 0, 1, 0];
        const aoFor = (pos, radius, strength) => [pos[0], pos[2], radius, strength];

        const aoWagon = this.wagon
            ? aoFor(this.wagon.position, 4.2, 0.55)
            : aoOff;
        const aoBarn = this.barnPos
            ? [this.barnPos.x, this.barnPos.z, 5.5, 0.6]
            : aoOff;

        const baleSlots = [aoOff, aoOff, aoOff];
        let slot = 0;
        for (const bale of this.bales) {
            if (bale.held || slot >= 3) continue;
            baleSlots[slot++] = [bale.pos[0], bale.pos[2], 1.8, 0.5];
        }

        this.terrainShader.setUniformsValues({
            uCloudOffset: this.cloudOffset,
            uAOWagon: aoWagon,
            uAOBarn: aoBarn,
            uAOBale0: baleSlots[0],
            uAOBale1: baleSlots[1],
            uAOBale2: baleSlots[2]
        });
    }

    updateChaseCamera(dt) {
        const w = this.wagon;

        // chase the wagon's heading on a slower timescale so the camera
        // visibly trails behind when the wagon turns
        const kHead = 1.0 - Math.exp(-dt / this.cameraHeadingTau);
        let dh = w.heading - this.cameraHeading;
        // shortest-path wrap so we don't take the long way around the circle
        while (dh > Math.PI) dh -= 2 * Math.PI;
        while (dh < -Math.PI) dh += 2 * Math.PI;
        this.cameraHeading += dh * kHead;

        // offsets are wagon-local: X is rightward, Y is up, Z is backward
        const cosH = Math.cos(this.cameraHeading);
        const sinH = Math.sin(this.cameraHeading);

        const side = this.cameraOffsetX;
        const back = this.cameraOffsetZ;

        const desiredEyeX = w.position[0] + side * sinH - back * cosH;
        const desiredEyeY = w.position[1] + this.cameraOffsetY;
        const desiredEyeZ = w.position[2] + side * cosH + back * sinH;

        // mouse-driven pitch raises/lowers the target so the camera tilts up to the sky
        const desiredTgtX = w.position[0];
        const desiredTgtY = w.position[1] + this.cameraTargetUp + this.cameraPitchOffset;
        const desiredTgtZ = w.position[2];

        // frame-rate independent exponential smoothing
        const k = 1.0 - Math.exp(-dt / this.cameraSmoothTau);

        const eye = this.camera.position;
        eye[0] += (desiredEyeX - eye[0]) * k;
        eye[1] += (desiredEyeY - eye[1]) * k;
        eye[2] += (desiredEyeZ - eye[2]) * k;

        const tgt = this.camera.target;
        tgt[0] += (desiredTgtX - tgt[0]) * k;
        tgt[1] += (desiredTgtY - tgt[1]) * k;
        tgt[2] += (desiredTgtZ - tgt[2]) * k;
    }

    getColliders() {
        const colliders = this.rockSet ? this.rockSet.getColliders() : [];

        // barn footprint: 10x10 square, treated as a tight circle
        colliders.push({ x: this.barnPos.x, z: this.barnPos.z, radius: 6.5 });

        // every grounded hay bale is a soft collider so the horse can muzzle
        // up to it, but the wagon bed still bumps into it
        for (const bale of this.bales) {
            if (!bale.held) {
                colliders.push({ x: bale.pos[0], z: bale.pos[2], radius: 1.5, soft: true });
            }
        }

        return colliders;
    }

    applyImpactDamage() {
        // each new contact with a damaging collider takes a random 5..15 HP bite;
        // wagon's edge-detection guarantees a single hit per contact event
        const hits = this.wagon.newCollisionIds;
        if (!hits || hits.length === 0) return;
        for (let i = 0; i < hits.length; i++) {
            const damage = 5 + Math.floor(Math.random() * 11);
            this.wagonHP = Math.max(0, this.wagonHP - damage);
        }
    }

    handleHayBaleKeys() {
        if (!this.gui) return;
        const pickupKey = this.gui.isKeyPressed("KeyP");
        const dropKey = this.gui.isKeyPressed("KeyL");

        // pickup: find the nearest grounded bale inside the reach circle
        if (pickupKey && !this.prevPickupKey && !this.wagon.isFull()) {
            const reachX = this.wagon.position[0] + this.pickupReachOffset * Math.cos(this.wagon.heading);
            const reachZ = this.wagon.position[2] - this.pickupReachOffset * Math.sin(this.wagon.heading);
            const r2 = this.balePickupRadius * this.balePickupRadius;
            let best = null;
            let bestDist = Infinity;
            for (const bale of this.bales) {
                if (bale.held) continue;
                const dx = reachX - bale.pos[0];
                const dz = reachZ - bale.pos[2];
                const d2 = dx * dx + dz * dz;
                if (d2 <= r2 && d2 < bestDist) {
                    best = bale;
                    bestDist = d2;
                }
            }
            if (best) this.wagon.pickup(best);
        }

        // drop the most recently picked-up bale at the rear of the wagon
        if (dropKey && !this.prevDropKey && this.wagon.carriedBales.length > 0) {
            const dropPos = this.wagon.dropPosition();
            const released = this.wagon.releaseBale();
            if (released) {
                released.pos[0] = dropPos[0];
                released.pos[1] = 0;
                released.pos[2] = dropPos[2];
            }
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
        // keep the dome centred on the camera so its edge never drifts into view
        if (this.camera) {
            this.translate(this.camera.position[0], 0, this.camera.position[2]);
        }
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
        this.scale(1500, 1500, 1);

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

        // bales: cull distant ones so we don't pay for unseen geometry
        const camX = this.camera ? this.camera.position[0] : 0;
        const camZ = this.camera ? this.camera.position[2] : 0;
        const baleCullDistSq = 160 * 160;
        const arrowRangeSq = this.baleArrowRange * this.baleArrowRange;

        for (const bale of this.bales) {
            if (bale.held) continue;
            const cdx = bale.pos[0] - camX;
            const cdz = bale.pos[2] - camZ;
            if (cdx * cdx + cdz * cdz > baleCullDistSq) continue;
            const groundY = this.terrain.getTerrainHeight(bale.pos[0], bale.pos[2]);
            this.pushMatrix();
            // bale geometry is centred (half-y 0.25 * scale 1.5 = 0.375), so lift
            // by that amount to sit the base flush with the terrain
            this.translate(bale.pos[0], groundY + 0.375, bale.pos[2]);
            this.scale(1.5, 1.5, 1.5);
            this.hayBale.display();
            this.popMatrix();
        }

        // batch the arrows under one shader bind so we don't switch per bale
        this.hayBaleArrow.beginBatch();
        for (const bale of this.bales) {
            if (bale.held) continue;
            const dx = bale.pos[0] - this.wagon.position[0];
            const dz = bale.pos[2] - this.wagon.position[2];
            if (dx * dx + dz * dz >= arrowRangeSq) continue;
            const groundY = this.terrain.getTerrainHeight(bale.pos[0], bale.pos[2]);
            this.pushMatrix();
            this.translate(bale.pos[0], groundY + 0.75 + 1.4, bale.pos[2]);
            this.hayBaleArrow.drawInstance();
            this.popMatrix();
        }
        this.hayBaleArrow.endBatch();
    }

    displayMountainPanorama() {
        this.pushMatrix();

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        // recentre the panoramas on the camera so the wagon never reaches their edge
        const camX = this.camera ? this.camera.position[0] : 0;
        const camZ = this.camera ? this.camera.position[2] : 0;

        const hazeColor = this.getMountainHazeColor();

        this.setActiveShader(this.mountainShader);

        this.pushMatrix();
        this.translate(camX, this.terrainYOffset - 44, camZ);
        this.mountainFarAppearance.apply();
        this.mountainFarTexture.bind(0);
        this.mountainShader.setUniformsValues({
            uTexture: 0,
            uTint: [0.78, 0.82, 0.92],
            uFogColor: hazeColor,
            uFogStrength: 0.55,
            uPanoramaHeight: this.mountainFarPanorama.height,
            uSunInfluence: this.sunInfluence,
            uSunDir: this.sunDirection
        });
        this.mountainFarPanorama.display();
        this.popMatrix();

        this.pushMatrix();
        this.translate(camX, this.terrainYOffset - 7, camZ);
        this.mountainAppearance.apply();
        this.mountainTexture.bind(0);
        this.mountainShader.setUniformsValues({
            uTexture: 0,
            uTint: [1.0, 1.0, 1.0],
            uFogColor: hazeColor,
            uFogStrength: 0.22,
            uPanoramaHeight: this.mountainPanorama.height,
            uSunInfluence: this.sunInfluence,
            uSunDir: this.sunDirection
        });
        this.mountainPanorama.display();
        this.popMatrix();

        this.setActiveShader(this.defaultShader);

        this.gl.disable(this.gl.BLEND);
        this.popMatrix();
    }

    getMountainHazeColor() {
        const sunElevation = this.sunDirection[1];
        const day = [0.75, 0.85, 0.95];
        const sunset = [0.92, 0.62, 0.45];
        const night = [0.12, 0.15, 0.22];
        const daySunsetMix = this.smoothstep(-0.15, 0.35, sunElevation);
        const sunsetNightMix = this.smoothstep(-0.5, -0.1, sunElevation);
        const out = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
            const sd = sunset[i] + (day[i] - sunset[i]) * daySunsetMix;
            out[i] = night[i] + (sd - night[i]) * sunsetNightMix;
        }
        return out;
    }
}
