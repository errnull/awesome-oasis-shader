import * as dat from "dat.gui";
import {
	AssetType,
	Camera,
	Color,
	Engine,
	Material,
	MeshRenderer,
	PrimitiveMesh,
	Script,
	Shader,
	Vector3,
	WebGLEngine
} from "oasis-engine";

import VERT_SHADER from "./water.vs.glsl"
import FRAG_SHADER from "./water.fs.glsl";

// 初始化 shader
Shader.create("water", VERT_SHADER, FRAG_SHADER);

class ShaderMaterial extends Material {
	constructor(engine: Engine) {
		super(engine, Shader.find("water"));

		this.shaderData.setFloat("u_sea_height", 0.6);
		this.shaderData.setFloat("u_water_scale", 0.2);
		this.shaderData.setFloat("u_water_speed", 3.5);
		this.shaderData.setColor("u_sea_base", new Color(0.1, 0.2, 0.22));
		this.shaderData.setColor("u_water_color", new Color(0.8, 0.9, 0.6));
	}
}

export function createOasis() {
	const gui = new dat.GUI();
	//-- create engine object
	const engine = new WebGLEngine("canvas");
	engine.canvas.resizeByClientSize();

	const scene = engine.sceneManager.activeScene;
	const rootEntity = scene.createRootEntity();

	//-- create camera
	const cameraEntity = rootEntity.createChild("camera_entity");
	cameraEntity.transform.position = new Vector3(0, 0, 15);
	cameraEntity.addComponent(Camera);

	const material = new ShaderMaterial(engine);

	// 创建球体形的海面
	const sphereEntity = rootEntity.createChild("sphere");
	const renderer = sphereEntity.addComponent(MeshRenderer);
	renderer.mesh = PrimitiveMesh.createSphere(engine, 3, 50);
	renderer.setMaterial(material);

	// 加载噪声纹理
	engine.resourceManager
		.load({
			type: AssetType.Texture2D,
			url: "https://gw.alipayobjects.com/mdn/rms_7c464e/afts/img/A*AC4IQZ6mfCIAAAAAAAAAAAAAARQnAQ"
		})
		.then((texture: any) => {
			material.shaderData.setTexture("u_texture", texture);
			engine.run();
		});

	// u_time 更新脚本
	class WaterScript extends Script {
		onUpdate() {
			material.shaderData.setFloat("u_time", engine.time.timeSinceStartup * 0.001);
		}
	}
	sphereEntity.addComponent(WaterScript);

	// debug
	function openDebug() {
		const shaderData = material.shaderData;
		const baseColor = shaderData.getColor("u_sea_base");
		const waterColor = shaderData.getColor("u_water_color");
		const debug = {
			sea_height: shaderData.getFloat("u_sea_height"),
			water_scale: shaderData.getFloat("u_water_scale"),
			water_speed: shaderData.getFloat("u_water_speed"),
			sea_base: [baseColor.r * 255, baseColor.g * 255, baseColor.b * 255],
			water_color: [waterColor.r * 255, waterColor.g * 255, waterColor.b * 255]
		};

		gui.add(debug, "sea_height", 0, 3).onChange((v) => {
			shaderData.setFloat("u_sea_height", v);
		});
		gui.add(debug, "water_scale", 0, 4).onChange((v) => {
			shaderData.setFloat("u_water_scale", v);
		});
		gui.add(debug, "water_speed", 0, 4).onChange((v) => {
			shaderData.setFloat("u_water_speed", v);
		});
		gui.addColor(debug, "sea_base").onChange((v) => {
			baseColor.r = v[0] / 255;
			baseColor.g = v[1] / 255;
			baseColor.b = v[2] / 255;
		});
		gui.addColor(debug, "water_color").onChange((v) => {
			waterColor.r = v[0] / 255;
			waterColor.g = v[1] / 255;
			waterColor.b = v[2] / 255;
		});
	}

	openDebug();
}
