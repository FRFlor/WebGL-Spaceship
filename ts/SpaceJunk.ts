import {Scene} from "babylonjs/scene";
import * as BABYLON from "babylonjs";
import {Mesh} from "babylonjs/Meshes/mesh";
import {Vector3} from "babylonjs/Maths/math";
import {randomBetween} from "./helpers";

export class SpaceJunk {
    public wrapper: Mesh;
    private scene: Scene;
    private speed: number;
    private rotationVector: Vector3;

    constructor(scene: Scene, startPosition: Vector3) {
        const size = randomBetween(1, 10);
        this.speed = -randomBetween(1, 20)/10;
        const random = Math.random();
        this.rotationVector = new BABYLON.Vector3(randomBetween(1, 10)/150, randomBetween(1, 10)/150, randomBetween(1, 10)/150);

        if (random < 0.15) {
            this.wrapper = BABYLON.MeshBuilder.CreateSphere("", {diameter: size})
        } else if (random < 0.35) {
            this.wrapper = BABYLON.MeshBuilder.CreateBox("", {size})
        } else if (random < 0.55) {
            this.wrapper = BABYLON.MeshBuilder.CreateCylinder("", {height: size, diameterBottom: size/2, diameterTop: size/2})
        } else if (random < 0.8) {
            this.wrapper = BABYLON.MeshBuilder.CreateCylinder("", {height: size, diameterBottom: size/2, diameterTop: 0})
        } else {
            this.wrapper = BABYLON.MeshBuilder.CreateTorus("", {diameter: size});
        }

        this.wrapper.material = scene.getMaterialByName('metal');
        this.wrapper.position.set(startPosition.x, startPosition.y, startPosition.z);
        this.wrapper.checkCollisions = true;
    }

    update() {
        this.wrapper.position.z += this.speed;
        this.wrapper.rotation.x += this.rotationVector.x;
        this.wrapper.rotation.y += this.rotationVector.y;
        this.wrapper.rotation.z += this.rotationVector.z;
    }

    dispose() {
        this.wrapper.dispose();
    }
}
