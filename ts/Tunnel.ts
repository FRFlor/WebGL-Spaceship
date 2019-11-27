import {Scene} from "babylonjs/scene";
import * as BABYLON from "babylonjs";

export default class Tunnel {
    constructor(scene: Scene) {
        const bottomWall = BABYLON.MeshBuilder.CreateBox("bottomWall", {height: 10, width: 100, depth: 1000}, scene);
        const topWall = BABYLON.MeshBuilder.CreateBox("topWall", {height: 10, width: 100, depth: 1000}, scene);
        const leftWall = BABYLON.MeshBuilder.CreateBox("leftWall", {height: 100, width: 10, depth: 1000}, scene);
        const rightWall = BABYLON.MeshBuilder.CreateBox("rightWall", {height: 100, width: 10, depth: 1000}, scene);
        bottomWall.material = scene.getMaterialByName("metal");
        topWall.material = scene.getMaterialByName("metal");
        leftWall.material = scene.getMaterialByName("metal");
        rightWall.material = scene.getMaterialByName("metal");
        bottomWall.position.z = 500;
        topWall.position.z = 500;
        leftWall.position.z = 500;
        rightWall.position.z = 500;
        bottomWall.position.y = -25;
        topWall.position.y = 25;
        leftWall.position.x = -25;
        rightWall.position.x = 25;
        bottomWall.checkCollisions = true;
        topWall.checkCollisions = true;
        leftWall.checkCollisions = true;
        rightWall.checkCollisions = true;
    }
}
