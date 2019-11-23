import * as BABYLON from 'babylonjs';

const canvas: HTMLCanvasElement = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);

const createScene = () => {
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 2, new BABYLON.Vector3(0, 0, 5),
        scene);
    camera.attachControl(canvas, true);

    const light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1, 1, 0), scene);
    const light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(0, 1, -1), scene);

    const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', {diameter: 2}, scene);

    return scene;
};

const scene = createScene();

engine.runRenderLoop(() => {
    scene.render();
});

window.addEventListener('resize', function() {
    engine.resize();
});
