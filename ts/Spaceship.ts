import {Mesh} from "babylonjs";
import {Scene} from "babylonjs/scene";
import * as BABYLON from "babylonjs";
import {renderAxes} from "./helpers";
import {IUserInput} from "../types";
import {Material} from "babylonjs/Materials/material";
import {StandardMaterial} from "babylonjs/Materials/standardMaterial";

const stabilizationStepAngle: number = BABYLON.Tools.ToRadians(1);
const maneuverStepAngle: number = BABYLON.Tools.ToRadians(3);
const maxManeuverAngle: number = BABYLON.Tools.ToRadians(20);
const maneuverSpeed: number = 0.3;
const forwardSpeed: number = 1;


export class Spaceship {
    public wrapper: Mesh;
    public hasCollided: boolean = false;

    private scene: Scene;
    private debugMode: boolean = true;
    private userInputs: IUserInput;

    private defaultMaterials: Material[];
    private damagedMaterial: Material;

    constructor(scene: Scene, userInputs: IUserInput) {
        this.scene = scene;
        this.userInputs = userInputs;

        this.wrapper = BABYLON.MeshBuilder.CreateBox("spaceship", {height: 1, width: 4, depth: 5}, scene);
        this.wrapper.material = this.debugMode ? this.scene.getMaterialByName('wireframe') : this.scene.getMaterialByName('invisible');
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

        const particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
        //Texture of each particle
        particleSystem.particleTexture = new BABYLON.Texture("./resources/textures/flare.png", scene);

        // Where the particles come from
        particleSystem.emitter = this.wrapper; // the starting object, the emitter
        particleSystem.minEmitBox = new BABYLON.Vector3(-1, -0.5, -1.5); // Starting all from
        particleSystem.maxEmitBox = new BABYLON.Vector3(1, 0.5, -1.5); // To...

        // Colors of all particles
        particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
        particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
        particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

        // Size of each particle (random between...
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.5;

        // Life time of each particle (random between...
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 1.5;

        // Emission rate
        particleSystem.emitRate = 1500;

        // Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        // Set the gravity of all particles
        particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);

        // Direction of each particle after it has been emitted
        particleSystem.direction1 = new BABYLON.Vector3(-7, 8, 3);
        particleSystem.direction2 = new BABYLON.Vector3(7, 8, -3);

        // Angular speed, in radians
        particleSystem.minAngularSpeed = 0;
        particleSystem.maxAngularSpeed = Math.PI;

        // Speed
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.005;

        // Start the particle system
        particleSystem.start();

    }

    update() {
        this.handleUserInput();
        this.stabilizeFlight();
        this.moveForward();
    }

    private handleUserInput() {
        if (this.userInputs["w"]) {
            this.wrapper.moveWithCollisions(new BABYLON.Vector3(0, maneuverSpeed , 0));
            if (this.wrapper.rotation.x >= -maxManeuverAngle) {
                this.wrapper.addRotation(-maneuverStepAngle, 0, 0);
            }
        }

        if (this.userInputs["s"]) {
            this.wrapper.moveWithCollisions(new BABYLON.Vector3(0, -maneuverSpeed , 0));
            if (this.wrapper.rotation.x <= maxManeuverAngle) {
                this.wrapper.addRotation(maneuverStepAngle, 0, 0);
            }
        }

        if (this.userInputs["a"]) {
            this.wrapper.moveWithCollisions(new BABYLON.Vector3(-maneuverSpeed, 0 , 0));
            if (this.wrapper.rotation.z <= maxManeuverAngle) {
                this.wrapper.addRotation(0, 0, maneuverStepAngle);
            }
        }

        if (this.userInputs["d"]) {
            this.wrapper.moveWithCollisions(new BABYLON.Vector3(maneuverSpeed, 0 , 0));
            if (this.wrapper.rotation.z >= -maxManeuverAngle) {
                this.wrapper.addRotation(0, 0, -maneuverStepAngle);
            }
        }
    }

    private moveForward() {
        if (this.hasCollided) {
            this.wrapper.position.z += forwardSpeed;
            return;
        }
        const desiredZ = this.wrapper.position.z + forwardSpeed;
        this.wrapper.moveWithCollisions(new BABYLON.Vector3(0, 0 , forwardSpeed));
        const hasTriggeredCollision = !this.hasCollided && desiredZ - this.wrapper.position.z > forwardSpeed/2;

        if (hasTriggeredCollision) {
            this.hasCollided = true;
            this.wrapper.getChildMeshes().forEach((mesh) => mesh.material = this.damagedMaterial);
            window.dispatchEvent(new Event('spaceship-collided'));

            setTimeout(() => {
                this.wrapper.getChildMeshes().forEach((mesh, index) => mesh.material = this.defaultMaterials[index]);
                this.hasCollided = false;
            }, 1000);
        }
    }

    private stabilizeFlight() {
        const rotationAxisByKeyboardInput = {
            w: 'x',
            s: 'x',
            a: 'z',
            d: 'z'
        };

        ['x','y','z'].forEach(axis => {
            const isKeyPressed = Object.keys(rotationAxisByKeyboardInput).some( key => {
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
}
