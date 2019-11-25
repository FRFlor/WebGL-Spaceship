import * as BABYLON from "babylonjs";
import {Mesh, ParticleSystem} from "babylonjs";
import {Scene} from "babylonjs/scene";
import {renderAxes} from "./helpers";
import {IUserInput} from "../types";
import {Material} from "babylonjs/Materials/material";
import {FollowCamera} from "babylonjs/Cameras/followCamera";
import {ParticleSystemSet} from "babylonjs/Particles/particleSystemSet";
import {IParticleSystem} from "babylonjs/Particles/IParticleSystem";

const stabilizationStepAngle: number = BABYLON.Tools.ToRadians(1);
const maneuverStepAngle: number = BABYLON.Tools.ToRadians(3);
const maxManeuverAngle: number = BABYLON.Tools.ToRadians(20);
const maneuverSpeed: number = 0.3;
const regularSpeed: number = 1;
const turboSpeed: number = 2.5;


export class Spaceship {
    public wrapper: Mesh;
    public isInvulnerable: boolean = true;

    private camera: FollowCamera;
    private rearViewCamera: FollowCamera;
    private health: number = 5;
    private maxHealth: number = 5;
    private scene: Scene;
    private debugMode: boolean = true;
    private userInputs: IUserInput;
    private isInTurbo: boolean = false;

    private defaultMaterials: Material[];
    private damagedMaterial: Material;

    private engineParticles: ParticleSystem;
    private smokeParticles: ParticleSystem;
    private explosionParticles: ParticleSystemSet;

    constructor(scene: Scene, userInputs: IUserInput) {
        this.scene = scene;
        this.userInputs = userInputs;

        this.wrapper = BABYLON.MeshBuilder.CreateBox("spaceship", {height: 1, width: 4, depth: 5}, scene);
        this.wrapper.material = this.debugMode ? this.scene.getMaterialByName("wireframe") : this.scene.getMaterialByName("invisible");
        this.wrapper.ellipsoid = new BABYLON.Vector3(4, 1, 3);
        this.wrapper.checkCollisions = true;

        if (this.debugMode) {
            const localAxis = renderAxes(3, scene);
            localAxis.parent = this.wrapper;
        }

        BABYLON.SceneLoader.ImportMesh("", "./resources/gltf/low_poly_space_ship/", "scene.gltf", this.scene, (model) => {
            model[0].position.y -= 0.85;
            model[0].parent = this.wrapper;

            this.defaultMaterials = this.wrapper.getChildMeshes().map((mesh) => mesh.material);
            this.damagedMaterial = this.scene.getMaterialByName("red");
        });

        const flashLight = new BABYLON.PointLight("shipLight", new BABYLON.Vector3(0, 0, 0), scene);
        flashLight.parent = this.wrapper;

        this.initializeEngineParticles();
        this.engineParticles.start();
        this.initializeSmokeParticles();
        BABYLON.ParticleHelper.CreateAsync("explosion", this.scene)
            .then((explosionSystemSet: ParticleSystemSet) => {
                this.explosionParticles = explosionSystemSet;
                this.explosionParticles.systems.forEach((system: IParticleSystem) => {
                    system.emitter = this.wrapper;
                });
            });
        setTimeout(() => this.isInvulnerable = false, 1000);

        this.camera = new BABYLON.FollowCamera("Camera", new BABYLON.Vector3(0, 0, -5), scene, this.wrapper);
        this.camera.rotationOffset = 180;

        this.rearViewCamera = new BABYLON.FollowCamera("rear-view-camera", new BABYLON.Vector3(0, 0, -5), scene, this.wrapper);
        this.rearViewCamera.rotationOffset = 0;
        this.rearViewCamera.heightOffset = 0;
        this.rearViewCamera.radius = 20;
    }

    update() {
        if (this.scene.activeCamera !== this.rearViewCamera) {
            this.rearViewCamera.position.z = this.wrapper.position.z - 100;
        }
        this.handleUserInput();
        this.stabilizeFlight();
        this.moveForward();
    }

    get healthStatus() {
        return {
            current: this.health,
            max: this.maxHealth
        }
    }

    get forwardSpeed(): number {
        return this.isInTurbo ? turboSpeed : regularSpeed;
    }

    changeHealthByAmount(amount: number) {
        this.health += amount;
        if (this.healthFraction >= 0.5) {
            this.smokeParticles.stop();
            this.engineParticles.start();
        } else if (this.healthFraction < 0.5 && this.healthFraction >= 0.25) {
            this.smokeParticles.start();
            this.engineParticles.start();
        } else {
            this.smokeParticles.start();
            this.engineParticles.stop();
        }
    }

    restoreHealth() {
        this.engineParticles.start();
        this.smokeParticles.stop();
        this.health = this.maxHealth;
    }

    private updateTurbo() {
        this.isInTurbo = this.userInputs[" "];
        this.camera.radius = this.isInTurbo ? 10 : 5;
        this.engineParticles.minSize = this.isInTurbo ? 0.5 : 0.1;
        this.engineParticles.maxSize = this.isInTurbo ? 0.6 : 0.2;
    }

    private handleUserInput() {
        this.updateTurbo();

        if (this.userInputs["w"]) {
            this.wrapper.moveWithCollisions(new BABYLON.Vector3(0, maneuverSpeed, 0));
            if (this.wrapper.rotation.x >= -maxManeuverAngle) {
                this.wrapper.addRotation(-maneuverStepAngle, 0, 0);
            }
        }

        if (this.userInputs["s"]) {
            this.wrapper.moveWithCollisions(new BABYLON.Vector3(0, -maneuverSpeed, 0));
            if (this.wrapper.rotation.x <= maxManeuverAngle) {
                this.wrapper.addRotation(maneuverStepAngle, 0, 0);
            }
        }

        if (this.userInputs["a"]) {
            this.wrapper.moveWithCollisions(new BABYLON.Vector3(-maneuverSpeed, 0, 0));
            if (this.wrapper.rotation.z <= maxManeuverAngle) {
                this.wrapper.addRotation(0, 0, maneuverStepAngle);
            }
        }

        if (this.userInputs["d"]) {
            this.wrapper.moveWithCollisions(new BABYLON.Vector3(maneuverSpeed, 0, 0));
            if (this.wrapper.rotation.z >= -maxManeuverAngle) {
                this.wrapper.addRotation(0, 0, -maneuverStepAngle);
            }
        }
    }

    private moveForward() {
        if (this.isInvulnerable) {
            this.wrapper.position.z += this.forwardSpeed;
            return;
        }
        const desiredZ = this.wrapper.position.z + this.forwardSpeed;
        this.wrapper.moveWithCollisions(new BABYLON.Vector3(0, 0, this.forwardSpeed));
        const hasTriggeredCollision = !this.isInvulnerable && desiredZ - this.wrapper.position.z > this.forwardSpeed / 2;

        if (hasTriggeredCollision) {
            this.isInvulnerable = true;
            this.wrapper.getChildMeshes().forEach((mesh) => mesh.material = this.damagedMaterial);
            this.changeHealthByAmount(-1);
            window.dispatchEvent(new Event("spaceship-collided"));

            if (this.health === 0) {
                this.onDeath();
            }

            setTimeout(() => {
                this.wrapper.getChildMeshes().forEach((mesh, index) => mesh.material = this.defaultMaterials[index]);
                this.isInvulnerable = false;
            }, 1000);
        }
    }

    private stabilizeFlight() {
        const rotationAxisByKeyboardInput = {
            w: "x",
            s: "x",
            a: "z",
            d: "z"
        };

        ["x", "y", "z"].forEach(axis => {
            const isKeyPressed = Object.keys(rotationAxisByKeyboardInput).some(key => {
                return rotationAxisByKeyboardInput[key] === axis && this.userInputs[key]
            });

            if (isKeyPressed) {
                return;
            }

            if (this.wrapper.rotation[axis] !== 0) {
                this.wrapper.rotation[axis] += this.wrapper.rotation[axis] > 0 ? -stabilizationStepAngle : stabilizationStepAngle;
            }
            if (this.wrapper.rotation[axis] >= -stabilizationStepAngle && this.wrapper.rotation[axis] <= stabilizationStepAngle) {
                this.wrapper.rotation[axis] = 0;
            }
        });
    }

    private initializeEngineParticles() {
        this.engineParticles = new BABYLON.ParticleSystem("particles", 2000, this.scene);
        //Texture of each particle
        this.engineParticles.particleTexture = new BABYLON.Texture("./resources/textures/flare.png", this.scene);

        // Where the particles come from
        this.engineParticles.emitter = this.wrapper; // the starting object, the emitter
        this.engineParticles.minEmitBox = new BABYLON.Vector3(-1, -0.5, -1.5); // Starting all from
        this.engineParticles.maxEmitBox = new BABYLON.Vector3(1, 0.5, -1.5); // To...

        // Colors of all particles
        this.engineParticles.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
        this.engineParticles.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
        this.engineParticles.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

        // Size of each particle (random between...
        this.engineParticles.minSize = 0.1;
        this.engineParticles.maxSize = 0.2;

        // Life time of each particle (random between...
        this.engineParticles.minLifeTime = 0.1;
        this.engineParticles.maxLifeTime = 0.1;

        // Emission rate
        this.engineParticles.emitRate = 1500;

        // Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
        this.engineParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        // Set the gravity of all particles
        this.engineParticles.gravity = new BABYLON.Vector3(0, -9.81, 0);

        // Direction of each particle after it has been emitted
        this.engineParticles.direction1 = new BABYLON.Vector3(-7, 8, 3);
        this.engineParticles.direction2 = new BABYLON.Vector3(7, 8, -3);

        // Angular speed, in radians
        this.engineParticles.minAngularSpeed = 0;
        this.engineParticles.maxAngularSpeed = Math.PI;

        // Speed
        this.engineParticles.minEmitPower = 1;
        this.engineParticles.maxEmitPower = 3;
        this.engineParticles.updateSpeed = 0.005;
    }

    private initializeSmokeParticles() {
        this.smokeParticles = new BABYLON.ParticleSystem("particles", 2000, this.scene);
        //Texture of each particle
        this.smokeParticles.particleTexture = new BABYLON.Texture("./resources/textures/flare.png", this.scene);

        // Where the particles come from
        this.smokeParticles.emitter = this.wrapper; // the starting object, the emitter
        this.smokeParticles.minEmitBox = new BABYLON.Vector3(-1, -0.5, -1.5); // Starting all from
        this.smokeParticles.maxEmitBox = new BABYLON.Vector3(1, 0.5, -1.5); // To...

        // Colors of all particles
        this.smokeParticles.color1 = new BABYLON.Color4(1, 165 / 255, 0, 1.0);
        this.smokeParticles.color2 = new BABYLON.Color4(1, 0, 0, 1.0);
        this.smokeParticles.colorDead = new BABYLON.Color4(128 / 255, 128 / 255, 128 / 255, 1);

        // Size of each particle (random between...
        this.smokeParticles.minSize = 0.2;
        this.smokeParticles.maxSize = 0.3;

        // Life time of each particle (random between...
        this.smokeParticles.minLifeTime = 0.1;
        this.smokeParticles.maxLifeTime = 0.1;

        // Emission rate
        this.smokeParticles.emitRate = 1500;

        // Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
        this.smokeParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        // Set the gravity of all particles
        this.smokeParticles.gravity = new BABYLON.Vector3(0, -9.81, 0);

        // Direction of each particle after it has been emitted
        this.smokeParticles.direction1 = new BABYLON.Vector3(-7, 8, 3);
        this.smokeParticles.direction2 = new BABYLON.Vector3(7, 8, -3);

        // Angular speed, in radians
        this.smokeParticles.minAngularSpeed = 0;
        this.smokeParticles.maxAngularSpeed = Math.PI;

        // Speed
        this.smokeParticles.minEmitPower = 1;
        this.smokeParticles.maxEmitPower = 3;
        this.smokeParticles.updateSpeed = 0.005;
    }

    private get healthFraction(): number {
        return this.health / this.maxHealth;
    }

    private onDeath() {
        this.explosionParticles.start();
    }
}
