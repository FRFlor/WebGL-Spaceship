import {Mesh} from "babylonjs/Meshes/mesh";
import {Scene} from "babylonjs/scene";
import {Vector3} from "babylonjs/Maths/math";
import * as BABYLON from "babylonjs";
import {randomBetween} from "./helpers";

export class BonusRing {
    public wrapper: Mesh;
    public hasCollided: boolean = false;
    private scene: Scene;

    constructor(scene: Scene,  position?: Vector3) {
        this.scene = scene;
        const radius = randomBetween(3,5);
        this.wrapper = BABYLON.MeshBuilder.CreateDisc("bonus-ring", {radius}, scene);

        [[-radius, 0], [radius, 0], [0, radius], [0, -radius]].forEach(([x, y]) => {
            let sphere = BABYLON.MeshBuilder.CreateSphere("", {diameter: 1});
            sphere.material = scene.getMaterialByName("gold");
            sphere.position.x = x;
            sphere.position.y = y;
            sphere.parent = this.wrapper;
        });

        this.wrapper.material = scene.getMaterialByName("transparent-green");

        if (position) {
            this.wrapper.position.set(position.x, position.y, position.z);
        }
    }

    update(target: Mesh) {
        this.wrapper.addRotation(0, 0, 0.1);
        this.checkForCollisionWithMesh(target);
    }

    private checkForCollisionWithMesh(mesh: Mesh) {
        this.hasCollided = this.wrapper.intersectsMesh(mesh);
        if (this.hasCollided) {
            window.dispatchEvent(new Event('bonus-ring-destroyed'));
            this.wrapper.dispose();
        }
    }
}
