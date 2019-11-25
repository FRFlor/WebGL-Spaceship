import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import {Spaceship} from "./Spaceship";
import {registerMaterials} from "./materials";
import {BonusRing} from "./BonusRing";
import {SpaceJunk} from "./SpaceJunk";
import {randomBetween} from "./helpers";

const canvas: HTMLCanvasElement = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);
let spaceShip;
let bonusRings: BonusRing[] = [];
let spaceJunks: SpaceJunk[] = [];
let score: number = 350;
let isGameOver: boolean = false;

const createScene = () => {
    const scene = new BABYLON.Scene(engine);
    const ambient = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
    ambient.intensity = 0.5;

    registerMaterials(scene);

    bonusRings = Array.from({length: 10}, () => {
        const position = new BABYLON.Vector3(randomBetween(-20, 20), randomBetween(-20, 20), randomBetween(100, 900));
       return  new BonusRing(scene, position);
    });

    spaceJunks = Array.from({length: 100}, () => {
        const position = new BABYLON.Vector3(randomBetween(-20, 20), randomBetween(-20, 20), randomBetween(50, 1500));
        return new SpaceJunk(scene, position);
    });

    const inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));

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


    spaceShip = new Spaceship(scene, inputMap);

    window.addEventListener("spaceship-collided", () => {
        document.getElementById("overlay").classList.remove("hidden");
        spaceShip.changeHealthByAmount(-1);
        setTimeout(() => {
            if (spaceShip.healthStatus.current > 0) {
                document.getElementById("overlay").classList.add("hidden");
            }
        }, 500);
    });

    window.addEventListener("bonus-ring-destroyed", () => {
        score += 500;
    });

    scene.onBeforeRenderObservable.add(() => {
        spaceShip.update();
    });

    return scene;
};

const scene = createScene();

engine.runRenderLoop(() => {
    if (isGameOver) {
        return;
    }
    scene.render();

    bonusRings.forEach((ring: BonusRing) => {
        ring.update(spaceShip.wrapper);
    });
    bonusRings = bonusRings.filter(ring => !ring.hasCollided);

    spaceJunks.forEach(junk => {
        junk.update();
        if (junk.wrapper.position.z < spaceShip.wrapper.position.z - 50) {
            junk.wrapper.position.z = 1000 + randomBetween(5, 300);
        }
    });

    score--;

    const {current, max} = spaceShip.healthStatus;
    document.getElementById("health").innerText = `Health: ${current} / ${max}`;
    document.getElementById("exit").innerText = `Distance: ${Math.max(0, Math.floor(1000 - spaceShip.wrapper.position.z))}`;
    document.getElementById("score").innerText = `Score: ${score}`;

    if (spaceShip.healthStatus.current <= 0 || score <= 0) {
        document.getElementById("overlay").classList.remove("hidden");
        isGameOver = true;
    }

    if (spaceShip.wrapper.position.z > 1000) {
        spaceShip.isInvulnerable = true;
        scene.activeCamera = spaceShip.rearViewCamera;
        spaceJunks.forEach(junk => junk.dispose());
        setTimeout(() => isGameOver = true, 1500);
    }
});

window.addEventListener("resize", function () {
    engine.resize();
});


