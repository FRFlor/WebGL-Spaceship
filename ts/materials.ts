import * as BABYLON from "babylonjs";
import {Scene} from "babylonjs/scene";

export function registerMaterials(scene: Scene) {
    const invisible = new BABYLON.StandardMaterial("invisible", scene);
    invisible.alpha = 0;

    const wireframe = new BABYLON.StandardMaterial("wireframe", scene);
    wireframe.wireframe = true;

    const red = new BABYLON.StandardMaterial("red", scene);
    red.diffuseColor = BABYLON.Color3.Red();

    const metal = new BABYLON.StandardMaterial("metal", scene);
    metal.diffuseTexture = new BABYLON.Texture("resources/textures/metal.jpg", scene);
}



