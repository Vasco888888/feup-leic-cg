// All gameplay-loop state and behavior: HP/score economy, the menu/HUD DOM,
// bale spawning + pickup + delivery, and the per-second tick. Owned by MyScene
// as `scene.gameplay` and reads/writes scene world objects (wagon, terrain,
// barn, deliveryZone, camera) through the back-reference.
export class MyGameplay {
    constructor(scene) {
        this.scene = scene;

        // 'menu' on boot and after the wagon hits 0 HP; 'playing' once Play is clicked.
        // Gameplay updates are gated on this so the world stays frozen under the menu.
        this.gameState = 'menu';

        // HP economy — spec reference values, tune as needed
        this.maxHP = 100;
        this.wagonHP = this.maxHP;
        this.hpDecayPerSec = 1.0;

        // score = whole seconds the wagon has stayed alive; freezes at HP 0.
        // HP decay and score share one tick so the two readouts move in lockstep.
        this.score = 0;
        this._tickAccum = 0;

        // delivery zone — circular drop spot in front of the barn. Bales carried
        // by the wagon are consumed the instant the wagon enters the disc.
        this.hpPerBaleDelivery = 20;
        this.wagonInDeliveryZone = false;
        this.balesDelivered = 0;

        // Instantaneous-event readouts on the HUD: spike on each
        // collision/delivery and fade back to 0 over ~2.5s.
        this.lastDamage = 0;
        this.lastHealing = 0;
        this._damagePeak = 0;
        this._healingPeak = 0;
        this._eventFade = 2.5;

        // hay bales scattered around the field; populated in init() once barn is placed
        this.bales = [];
        // reach point sits ahead of the wagon centre (near the horse), with a
        // generous radius so the bale only needs to be in front of the rig
        this.pickupReachOffset = 5.0;
        this.balePickupRadius = 4.5;
        this.prevPickupKey = false;
        this.prevDropKey = false;

        this._menuEl = null;
        this._hudElems = null;
    }

    init() {
        this.bales = this._generateBales(22, 2024);

        this._menuEl = document.getElementById("menu");
        const playBtn = document.getElementById("menu-play");
        if (playBtn) playBtn.addEventListener("click", () => this.startGame());
    }

    isPlaying() { return this.gameState === 'playing'; }

    // per-frame HP/score tick — sub-second dt accumulates so the readouts step
    // exactly once per real-time second regardless of frame rate
    tick(dt) {
        // fade the instantaneous-event readouts back to 0 across _eventFade seconds
        if (this.lastDamage > 0 && this._damagePeak > 0) {
            this.lastDamage = Math.max(0, this.lastDamage - this._damagePeak * dt / this._eventFade);
        }
        if (this.lastHealing > 0 && this._healingPeak > 0) {
            this.lastHealing = Math.max(0, this.lastHealing - this._healingPeak * dt / this._eventFade);
        }

        this._tickAccum += dt;
        while (this._tickAccum >= 1) {
            this._tickAccum -= 1;
            if (this.wagonHP > 0) {
                this.wagonHP = Math.max(0, this.wagonHP - this.hpDecayPerSec);
                this.score += 1;
            }
        }
    }

    showMenu() {
        this.gameState = 'menu';
        if (this._menuEl) this._menuEl.classList.remove("hidden");
        // hide the dat.GUI panel behind the title screen
        if (this.scene.input && this.scene.input.setGuiVisible) {
            this.scene.input.setGuiVisible(false);
        }
    }

    startGame() {
        const scene = this.scene;

        // wipe the previous run's state so a Play after game-over starts clean
        this.wagonHP = this.maxHP;
        this.score = 0;
        this.balesDelivered = 0;
        this._tickAccum = 0;
        this.wagonInDeliveryZone = false;
        this.prevPickupKey = false;
        this.prevDropKey = false;
        this.lastDamage = 0;
        this.lastHealing = 0;
        this._damagePeak = 0;
        this._healingPeak = 0;

        this.bales = this._generateBales(22, 2024);

        if (scene.wagon) {
            scene.wagon.position[0] = 0;
            scene.wagon.position[1] = scene.terrain ? scene.terrain.getTerrainHeight(0, 0) : 0;
            scene.wagon.position[2] = 0;
            scene.wagon.heading = 0;
            scene.wagon.speed = 0;
            scene.wagon.pitch = 0;
            scene.wagon.roll = 0;
            scene.wagon.frontSpin = 0;
            scene.wagon.rearSpin = 0;
            scene.wagon.carriedBales = [];
            scene.wagon.activeCollisionIds = new Set();
            scene.wagon.newCollisionIds = [];
        }

        // snap the chase camera straight behind the wagon so it doesn't fly back from the death spot
        if (scene.chaseCamera) {
            const spawnY = scene.terrain ? scene.terrain.getTerrainHeight(0, 0) : 0;
            scene.chaseCamera.snapBehind(spawnY);
        }

        // reveal the dat.GUI now that the playthrough is starting
        if (scene.input && scene.input.setGuiVisible) {
            scene.input.setGuiVisible(true);
        }

        if (this._menuEl) this._menuEl.classList.add("hidden");
        this.gameState = 'playing';
    }

    updateHUD() {
        // cache the DOM lookups once; readouts are pushed each frame so they
        // mirror the dat.GUI controllers without an extra render layer
        if (!this._hudElems) {
            this._hudElems = {
                hp: document.getElementById("hud-hp-value"),
                score: document.getElementById("hud-score-value"),
                bales: document.getElementById("hud-bales-value")
            };
        }
        if (this._hudElems.hp) this._hudElems.hp.textContent = Math.round(this.wagonHP);
        if (this._hudElems.score) this._hudElems.score.textContent = this.score;
        if (this._hudElems.bales) this._hudElems.bales.textContent = this.balesDelivered;
    }

    applyImpactDamage() {
        // each new contact with a damaging collider takes a random 5..15 HP bite;
        // wagon's edge-detection guarantees a single hit per contact event
        const hits = this.scene.wagon.newCollisionIds;
        if (!hits || hits.length === 0) return;
        let totalDamage = 0;
        for (let i = 0; i < hits.length; i++) {
            const damage = 5 + Math.floor(Math.random() * 11);
            this.wagonHP = Math.max(0, this.wagonHP - damage);
            totalDamage += damage;
        }
        // surface the bite on the instantaneous-damage bar
        this.lastDamage = totalDamage;
        this._damagePeak = Math.max(this._damagePeak, totalDamage);
    }

    applyDelivery() {
        const scene = this.scene;
        if (!scene.deliveryZone || !scene.wagon) return;
        const inside = scene.deliveryZone.contains(scene.wagon.position[0], scene.wagon.position[2]);
        // edge-detected: deliveries fire once per zone entry, not every frame inside
        if (inside && !this.wagonInDeliveryZone) {
            const carried = scene.wagon.carriedBales;
            if (carried && carried.length > 0) {
                const restored = carried.length * this.hpPerBaleDelivery;
                this.wagonHP = Math.min(this.maxHP, this.wagonHP + restored);
                this.balesDelivered += carried.length;
                const deliveredSet = new Set(carried);
                this.bales = this.bales.filter(b => !deliveredSet.has(b));
                scene.wagon.carriedBales = [];
                // surface the heal on the instantaneous-heal bar
                this.lastHealing = restored;
                this._healingPeak = Math.max(this._healingPeak, restored);
            }
        }
        this.wagonInDeliveryZone = inside;
    }

    handleHayBaleKeys() {
        const scene = this.scene;
        if (!scene.input) return;
        const pickupKey = scene.input.isKeyPressed("KeyP");
        const dropKey = scene.input.isKeyPressed("KeyL");

        // pickup: find the nearest grounded bale inside the reach circle
        if (pickupKey && !this.prevPickupKey && !scene.wagon.isFull()) {
            const reachX = scene.wagon.position[0] + this.pickupReachOffset * Math.cos(scene.wagon.heading);
            const reachZ = scene.wagon.position[2] - this.pickupReachOffset * Math.sin(scene.wagon.heading);
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
            if (best) scene.wagon.pickup(best);
        }

        // drop the most recently picked-up bale at the rear of the wagon
        if (dropKey && !this.prevDropKey && scene.wagon.carriedBales.length > 0) {
            const dropPos = scene.wagon.dropPosition();
            const released = scene.wagon.releaseBale();
            if (released) {
                released.pos[0] = dropPos[0];
                released.pos[1] = 0;
                released.pos[2] = dropPos[2];
            }
        }

        this.prevPickupKey = pickupKey;
        this.prevDropKey = dropKey;
    }

    _generateBales(count, seed) {
        const bales = [];
        const TWO_PI = Math.PI * 2;
        const maxDist = 460;
        const minDist = 18;

        const hash = (n) => {
            let h = ((n + seed * 919) * 374761393) | 0;
            h = (h ^ (h >>> 13)) * 1274126177;
            return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
        };

        const barnPos = this.scene.barnPos;
        let attempts = 0;
        while (bales.length < count && attempts < count * 60) {
            const i = attempts;
            attempts++;
            const angle = hash(i * 3) * TWO_PI;
            const dist = minDist + Math.sqrt(hash(i * 3 + 1)) * (maxDist - minDist);
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;

            // keep bales off the dirt roads (world-unit path math)
            const c1 = 85.0 * Math.sin(z * 0.0042 + 3.9)
                     + 28.0 * Math.sin(z * 0.013 + 5.4);
            const c2 = -40.0 + 55.0 * Math.sin(x * 0.0048 + 4.7)
                            + 22.0 * Math.sin(x * 0.011 + 1.3);
            if (Math.abs(x - c1) < 9) continue;
            if (Math.abs(z - c2) < 9) continue;

            // keep clear of the barn and the wagon spawn
            const dxBarn = x - barnPos.x;
            const dzBarn = z - barnPos.z;
            if (dxBarn * dxBarn + dzBarn * dzBarn < 90) continue;

            // small no-spawn ring around origin where the wagon starts
            if (x * x + z * z < 80) continue;

            bales.push({ pos: [x, 0, z], held: false });
        }
        return bales;
    }
}
