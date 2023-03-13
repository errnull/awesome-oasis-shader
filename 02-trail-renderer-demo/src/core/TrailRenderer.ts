

import { BlinnPhongMaterial, BufferMesh, CullMode, MeshTopology } from "oasis-engine";
import { Material } from "oasis-engine";
import { Shader } from "oasis-engine";
import { Buffer, BufferBindFlag, BufferUsage, IndexFormat, Mesh, VertexElement, VertexElementFormat } from "oasis-engine";
import { MathUtil, Vector3, Color, Matrix, Matrix3x3, Quaternion } from "@oasis-engine/math";
import { Renderer } from "oasis-engine";

import TrailFs from "./shader/trail.fs.glsl";
import TrailVs from "./shader/trail.vs.glsl";

Shader.create("trail-shader", TrailVs, TrailFs);

export class TrailRenderer extends Renderer {

  private _mesh: Mesh;
  private _material: Material;

  private _currentLength: number;
  private _currentEnd: number;

  private _width: number;
  private _length: number;

  private _localHeadVertexArray;
  private _verticesPerNode;

  private _vertexCount: number;

  private _positions: Float32Array;
  private _vertexBuffer: Buffer;

  private _tempLocalHeadVertexArray: Array<Vector3>;

  constructor(props) {
    super(props);

    this._currentLength = 0;
    this._currentEnd = -1;
    this._length = 200;

    this._createHeadVertexList();

    this._tempLocalHeadVertexArray = [];
    for (let i = 0; i < 128; i++) {
      this._tempLocalHeadVertexArray.push(new Vector3(0, 0, 0));
    }

    this._vertexCount = this._length * this._verticesPerNode;
    this._positions = new Float32Array(this._vertexCount * 3);

    this._createMesh();
    this._createMaterial();
  }

  /**
   * mesh of trail.
   */
  get mesh(): Mesh {
    return this._mesh;
  }

  set mesh(value: Mesh) {
    this._mesh = value;
  }

  /**
   * material of trail.
   */
  get material(): Material {
    return this._material;
  }

  set material(value: Material) {
    this._material = value;
  }

  /**
   * width of trail.
   */
  get width(): number {
    return this._width;
  }

  set width(value: number) {
    this._width = value;
  }

  /**
   * length of trail.
   */
  get length(): number {
    return this._length;
  }

  set length(value: number) {
    this._length = value;
  }

  /**
   * positions vertex of trail.
   */
  get positions(): Float32Array {
    return this._positions;
  }

  set positions(value: Float32Array) {
    this._positions = value;
  }

  /**
   * @internal
   */
  _cloneTo(target: TrailRenderer): void {

  }

  private _createMaterial(): Material {
    this._material = new Material(this.engine, Shader.find("trail-shader"));
    return this._material;
  }

  private _createMesh(): BufferMesh {
    const mesh = new BufferMesh(this.engine, "trail-Mesh");

    this.positions[0] = -0.5;
    this.positions[1] = -1;
    this.positions[2] = 0;

    this.positions[3] = 0.5;
    this.positions[4] = -1;
    this.positions[5] = 0;

    this.positions[6] = -0.5;
    this.positions[7] = -2;
    this.positions[8] = 0;

    this.positions[9] = 0.5;
    this.positions[10] = -2;
    this.positions[11] = 0;

    this.positions[12] = -0.5;
    this.positions[13] = -3;
    this.positions[14] = 0;

    this.positions[15] = 0.5;
    this.positions[16] = -3;
    this.positions[17] = 0;


    const positionBuffer = new Buffer(this.engine, BufferBindFlag.VertexBuffer, this.positions, BufferUsage.Dynamic);
    mesh.setVertexBufferBinding(positionBuffer, 12);
    mesh.setVertexElements(
      [
        new VertexElement("POSITION", 0, VertexElementFormat.Vector3, 0),
      ])

    mesh.addSubMesh(0, 7, MeshTopology.TriangleStrip);

    this._vertexBuffer = positionBuffer;
    this._mesh = mesh;

    return mesh;
  }

  private _createHeadVertexList(): void {
    const localHeadWidth = 1;
    this._localHeadVertexArray = [];

    let halfWidth = localHeadWidth || 1.0;
    halfWidth = halfWidth / 2.0;

    this._localHeadVertexArray.push(new Vector3(-halfWidth, 1, 0));
    this._localHeadVertexArray.push(new Vector3(halfWidth, 1, 0));

    this._verticesPerNode = 2;
  }

  /**
  * @override
  */
  protected _render(context: any): void {
    const { mesh, material } = this;

    const renderPipeline = context.camera._renderPipeline;
    const renderElementPool = this._engine._renderElementPool;

    const renderState = material.renderState;
    const shaderPasse = material.shader.passes[0];
    renderState.rasterState.cullMode = CullMode.Off;

    const element = renderElementPool.getFromPool();
    element.setValue(this, mesh, mesh.subMeshes[0], material, renderState, shaderPasse);
    renderPipeline.pushPrimitive(element);
  }

  /**
   * @override
   * @internal
   */
  update(deltaTime: number): void {
    // this._updateBuffer();
  }

  private _updateBuffer(): void {
    let nextIndex = this._currentEnd + 1 >= this.length ? 0 : this._currentEnd + 1;

    if (this._currentLength < this._length) {
      this._currentLength++;
    }
    this._currentEnd++;
    if (this._currentEnd >= this.length) {
      this._currentEnd = 0;
    }

    const currentEntityMatrix = new Matrix();
    currentEntityMatrix.copyFrom(this.entity.transform.worldMatrix);

    this._updateSingleBuffer(nextIndex, currentEntityMatrix);
  }

  private _updateSingleBuffer(nodeIndex: number, transformMatrix: Matrix) {
    const { positions } = this;

    for (let i = 0; i < this._localHeadVertexArray.length; i++) {
      let vertex = this._tempLocalHeadVertexArray[i];
      vertex.copyFrom(this._localHeadVertexArray[i]);
    }
    for (let i = 0; i < this._localHeadVertexArray.length; i++) {
      let vertex = this._tempLocalHeadVertexArray[i];
      vertex.transformToVec3(transformMatrix);
    }

    for (let i = 0; i < this._localHeadVertexArray.length; i++) {

      let positionIndex = ((this._verticesPerNode * nodeIndex) + i) * 3;
      let transformedHeadVertex = this._tempLocalHeadVertexArray[i];

      positions[positionIndex] = transformedHeadVertex.x;
      positions[positionIndex + 1] = transformedHeadVertex.y;
      positions[positionIndex + 2] = transformedHeadVertex.z;
    }

    const finalVertexCount = this._currentLength * 6;
    const finalPositions = new Float32Array(finalVertexCount);

    // console.log(finalVertexCount);
    // console.log(nodeIndex);

    for (let i = 0; i < finalVertexCount - 1; i++) {
      if (positions.length > finalVertexCount) {
        finalPositions[i] = positions[i];
      } else {
        finalPositions[i] = positions[positions.length - finalVertexCount + 1];
      }
    }
    this._vertexBuffer.setData(finalPositions);
  }
}
