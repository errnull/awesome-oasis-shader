import {
	BlinnPhongMaterial,
	Camera,
	Script,
	Entity,
	MeshRenderer,
	PrimitiveMesh,
	Vector3,
	MathUtil,
	Quaternion,
	Matrix,
	WebGLEngine,
	ParticleRenderer,
	TrailRenderer,
} from "oasis-engine";
// import { OrbitControl } from "oasis-engine-toolkit";

class Moving extends Script {

	private _lastTrailUpdateTime: number;

	private _lastTargetPosition: Vector3;
	private _currentTargetPosition: Vector3;

	private _lastDirection: Vector3;
	private _currentDirection: Vector3;

	private _tempUp: Vector3;
	private _baseForward: Vector3;

	private _tempQuaternion: Quaternion;

	private _tempRotationMatrix: Matrix;
	private _lastRotationMatrix: Matrix;

	private _tempTranslationMatrix: Matrix;

	constructor(entity: Entity) {
		super(entity);

		this._lastTrailUpdateTime = performance.now();

		this._lastTargetPosition = new Vector3();
		this._currentTargetPosition = new Vector3();

		this._lastDirection = new Vector3();
		this._currentDirection = new Vector3();

		this._tempUp = new Vector3();
		this._baseForward = new Vector3(0, 0, -1);

		this._tempQuaternion = new Quaternion();
		
		this._tempRotationMatrix = new Matrix();
		this._lastRotationMatrix = new Matrix();

		this._tempTranslationMatrix = new Matrix();

	}

	onUpdate() {

		this._tempRotationMatrix.identity();
		this._tempTranslationMatrix.identity();

		const time = performance.now();

		const scaledTime = time *0.001;
		var areaScale = 4;
		this._lastTargetPosition.copyFrom(this._currentTargetPosition);

		this._currentTargetPosition.x = Math.sin( scaledTime ) * areaScale;
		this._currentTargetPosition.y = Math.sin(scaledTime * 1.1) * areaScale;
		this._currentTargetPosition.z = Math.sin(scaledTime * 1.6) * areaScale;

		this._lastDirection.copyFrom(this._currentDirection);
		
		this._currentDirection.copyFrom(this._currentTargetPosition);
		this._currentDirection.subtract( this._lastTargetPosition );
		this._currentDirection.normalize();

		Vector3.cross(this._currentDirection, this._baseForward, this._tempUp);
		const angle = this.findAngleFrom(this._baseForward, this._currentDirection);

		if(Math.abs(angle) > 0.01 && this._tempUp.lengthSquared() > 0.001) {
			this._tempQuaternion = this.setFromUnitVectors(this._baseForward, this._currentDirection);
			this._tempQuaternion.normalize();

			Matrix.rotationQuaternion(this._tempQuaternion, this._tempRotationMatrix);
			this._lastRotationMatrix.copyFrom(this._tempRotationMatrix);
		}	
		
		this._tempTranslationMatrix.translate(this._currentTargetPosition);
		this._tempTranslationMatrix.multiply(this._tempRotationMatrix);

		this.entity.transform.localMatrix = this._tempTranslationMatrix;
	}

	private findAngleFrom(v1: Vector3, v2: Vector3): number {
		const denominator = Math.sqrt( v1.lengthSquared() * v2.lengthSquared() );
		if ( denominator === 0 ) return Math.PI / 2;
		const theta = Vector3.dot(v1, v2);
		return Math.acos( MathUtil.clamp( theta, - 1, 1 ) );
	}

	private setFromUnitVectors(vFrom: Vector3, vTo: Vector3): Quaternion {
		const quaternion = new Quaternion();

		let r = Vector3.dot(vFrom, vTo) + 1;
		if ( r < Number.EPSILON ) {
			r = 0;
			if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {
				quaternion.x = - vFrom.y;
				quaternion.y = vFrom.x;
				quaternion.z = 0;
				quaternion.w = r;
			} else {
				quaternion.x = 0;
				quaternion.y = - vFrom.z;
				quaternion.z = vFrom.y;
				quaternion.w = r;
			}
		} else {
			quaternion.x = vFrom.y * vTo.z - vFrom.z * vTo.y;
			quaternion.y = vFrom.z * vTo.x - vFrom.x * vTo.z;
			quaternion.z = vFrom.x * vTo.y - vFrom.y * vTo.x;
			quaternion.w = r;
		}
		return quaternion.normalize();
	}
}

export function createOasis() {
	const engine = new WebGLEngine("canvas");
	engine.canvas.resizeByClientSize();
	const scene = engine.sceneManager.activeScene;
	const rootEntity = scene.createRootEntity();

	// init camera
	const cameraEntity = rootEntity.createChild("camera");
	cameraEntity.addComponent(Camera);
	const pos = cameraEntity.transform.position;
	pos.set(10, 10, 10);
	cameraEntity.transform.position = pos;
	cameraEntity.transform.lookAt(new Vector3(0, 0, 0));

	// init light
	scene.ambientLight.diffuseSolidColor.set(1, 1, 1, 1);
	scene.ambientLight.diffuseIntensity = 1.2;

	const planeEntity = rootEntity.createChild("plane");
	const renderer = planeEntity.addComponent(MeshRenderer);
	const mtl = new BlinnPhongMaterial(engine);
	const color = mtl.baseColor;
	color.r = 0.0;
	color.g = 0.8;
	color.b = 0.5;
	color.a = 1.0;
	// renderer.mesh = PrimitiveMesh.createPlane(engine);
	renderer.mesh = PrimitiveMesh.createCuboid(engine, 0.5, 0.5, 0.5);
	renderer.setMaterial(mtl);

	planeEntity.addComponent(TrailRenderer);
	planeEntity.addComponent(Moving);

	engine.run();
}
