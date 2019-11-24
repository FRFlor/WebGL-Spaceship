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

        const flashLight = new BABYLON.SpotLight("shipLight", new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 1), Math.PI / 6, 10 , scene);
        flashLight.parent = this.wrapper;
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
            this.wrapper.position.add(new BABYLON.Vector3(0, 0 , forwardSpeed));
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
