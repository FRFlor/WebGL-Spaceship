import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import {Spaceship} from "./Spaceship";

const canvas: HTMLCanvasElement = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);

const createScene = () => {
    const scene = new BABYLON.Scene(engine);

    const inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));

    const light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
    const light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), scene);

    const origin = BABYLON.MeshBuilder.CreateBox("origin", {size: 0.5}, scene);
    origin.position.set(0, 0, 0);

    const metal = new BABYLON.StandardMaterial("grass0", scene);
    metal.diffuseTexture = new BABYLON.Texture("resources/textures/metal.jpg", scene);

    const bottomWall = BABYLON.MeshBuilder.CreateBox('bottomWall', {height: 10, width: 100, depth: 1000}, scene);
    const topWall = BABYLON.MeshBuilder.CreateBox('topWall', {height: 10, width: 100, depth: 1000}, scene);
    const leftWall = BABYLON.MeshBuilder.CreateBox('leftWall', {height: 100, width: 10, depth: 1000}, scene);
    const rightWall = BABYLON.MeshBuilder.CreateBox('rightWall', {height: 100, width: 10, depth: 1000}, scene);
    bottomWall.material = metal;
    topWall.material = metal;
    leftWall.material = metal;
    rightWall.material = metal;
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

    Array.from({length: 200}, (_, index: number) => {
        const box = BABYLON.MeshBuilder.CreateBox(`box_${index}`, {size: 1}, scene);
        box.position.set(0, 0, (index+2)*75);
        box.checkCollisions = true;
    });

    let spaceShip = new Spaceship(scene, inputMap);

    // const camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 2, new BABYLON.Vector3(0, 0, 7), scene);
    const camera = new BABYLON.FollowCamera("Camera", new BABYLON.Vector3(0, 0, -10), scene, spaceShip.wrapper);
    camera.rotationOffset = 180;
    // camera.attachControl(canvas, true);

    let spaceShipCollided = false;
    // Game/Render loop
    scene.onBeforeRenderObservable.add(() => {
        spaceShip.update();
    });

    return scene;
};

const scene = createScene();

engine.runRenderLoop(() => {
    scene.render();
});

window.addEventListener("resize", function () {
    engine.resize();
});


