import {
	AssetType,
	BlinnPhongMaterial,
	Camera,
	Color,
	DirectLight,
	Engine,
	Material,
	MeshRenderer,
	PrimitiveMesh,
	Script,
	Shader,
	Vector3,
	WebGLEngine
} from "oasis-engine";

import VERT_SHADER from "./color.vs.glsl"
import FRAG_SHADER from "./color.fs.glsl";

// 初始化 shader
Shader.create("color", VERT_SHADER, FRAG_SHADER);

class ShaderMaterial extends Material {
	constructor(engine: Engine) {
		super(engine, Shader.find("color"));

		// this.shaderData.setFloat("u_sea_height", 0.6);
		// this.shaderData.setFloat("u_water_scale", 0.2);
		// this.shaderData.setFloat("u_water_speed", 3.5);
		// this.shaderData.setColor("u_sea_base", new Color(0.1, 0.2, 0.22));
		// this.shaderData.setColor("u_water_color", new Color(0.8, 0.9, 0.6));
	}
}

export function createOasis() {
	//-- create engine object
	const engine = new WebGLEngine("canvas");
	engine.canvas.resizeByClientSize();

	const scene = engine.sceneManager.activeScene;
	const rootEntity = scene.createRootEntity();

	//-- create camera
	const cameraEntity = rootEntity.createChild("camera_entity");
	cameraEntity.transform.position = new Vector3(0, 0, 15);
	cameraEntity.addComponent(Camera);

	let lightEntity = rootEntity.createChild("light");
	let directLight = lightEntity.addComponent(DirectLight);
	directLight.color = new Color(1.0, 1.0, 1.0);
	directLight.intensity = 0.5;
	lightEntity.transform.rotation = new Vector3(45, 45, 45);

	const planeEntity = rootEntity.createChild("plane");
	planeEntity.transform.rotate(90.0, 0.0, 0);
	const renderer = planeEntity.addComponent(MeshRenderer);
	renderer.mesh = PrimitiveMesh.createPlane(engine, 5, 5);
	// renderer.setMaterial(new BlinnPhongMaterial(engine));

	const material = new ShaderMaterial(engine);
	renderer.setMaterial(material);

	// class ColorScript extends Script {
	// 	onUpdate() {
	// 		// material.shaderData.setFloat("u_time", engine.time.timeSinceStartup * 0.001);
	// 	}
	// }
	// planeEntity.addComponent(ColorScript);

	engine.run();
}
