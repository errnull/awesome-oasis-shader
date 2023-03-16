

import { BaseMaterial, BlinnPhongMaterial, BufferMesh, CullMode, MeshTopology, Texture } from "oasis-engine";
import { Material } from "oasis-engine";
import { Shader } from "oasis-engine";
import { Buffer, BufferBindFlag, BufferUsage, IndexFormat, Mesh, VertexElement, VertexElementFormat } from "oasis-engine";
import { MathUtil, Vector3, Color, Matrix, Matrix3x3, Quaternion, Vector4 } from "@oasis-engine/math";
import { Renderer } from "oasis-engine";

import TrailFs from "./shader/trail.fs.glsl";
import TrailVs from "./shader/trail.vs.glsl";

Shader.create("trail-shader", TrailVs, TrailFs);

export class TrailRenderer extends Renderer {

  private _mesh: Mesh;
  private _texture: Texture;
  private _material: BaseMaterial;

  private _currentLength: number;
  private _currentEnd: number;
  private _currentNodeIndex: number;

  private _width: number;
  private _length: number;

  private _vertexCount: number;
  private _verticesPerNode: number;

  private _nodeIDsBuffer: Buffer;
  private _nodeIDs: Float32Array;
  private _finalNodeIDs: Float32Array;

  private _vertexNodeIDsBuffer: Buffer;
  private _vertexNodeIDs: Float32Array;

  private _vertexBuffer: Buffer;
  private _positions: Float32Array;
  private _finalPositions: Float32Array;

  private _headVertexArray: Array<Vector3>;
  private _tempHeadVertexArray: Array<Vector3>;

  private _headColor: Color;
  private _trailColor: Color;

  constructor(props) {
    super(props);
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
   * texture of trail.
   */
  get texture(): Texture {
    return this._texture;
  }

  set texture(value: Texture) {
    this._texture = value;
    if (value) {
      this.shaderData.enableMacro("trailTexture");
      this.material.shaderData.setTexture("u_texture", value);
    } else {
      this.shaderData.disableMacro("trailTexture");
    }
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
    this._init();
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
   * nodeIDs vertex of trail.
   */
  get nodeIDs(): Float32Array {
    return this._nodeIDs;
  }

  set nodeIDs(value: Float32Array) {
    this._nodeIDs = value;
  }

  /** 
   * head color for trail
   */
  get headColor(): Color {
    return this._headColor;
  }

  set headColor(value: Color) {
    this._headColor = value;
    this.material.shaderData.setVector4("u_headColor", new Vector4(value.r, value.g, value.b, value.a));
  }

  /**
   * trail color for trail
   */
  get trailColor(): Color {
    return this._trailColor;
  }

  set trailColor(value: Color) {
    this._trailColor = value;
    this.material.shaderData.setVector4("u_tailColor", new Vector4(value.r, value.g, value.b, value.a));
  }

  /**
   * @internal
   */
  _cloneTo(target: TrailRenderer): void {

  }

  private _init() {
    this._currentLength = 0;
    this._currentEnd = -1;
    this._currentNodeIndex = 0;

    this._createHeadVertexList();

    this._tempHeadVertexArray = [];
    for (let i = 0; i < 128; i++) {
      this._tempHeadVertexArray.push(new Vector3(0, 0, 0));
    }

    this._vertexCount = this._length * this._verticesPerNode;
    this._positions = new Float32Array(this._vertexCount * 3);
    this._nodeIDs = new Float32Array(this._vertexCount);
    this._vertexNodeIDs = new Float32Array(this._vertexCount);

    this._createMesh();
    this._createMaterial();

    if (this._headColor && this._trailColor) {
      this.headColor = this._headColor;
      this.trailColor = this._trailColor;
    }
  }

  private _createMaterial(): Material {
    this._material = new BaseMaterial(this.engine, Shader.find("trail-shader"));
    this._material.isTransparent = true;
    return this._material;
  }

  private _createMesh(): BufferMesh {
    const mesh = new BufferMesh(this.engine, "trail-Mesh");

    const nodeIDsButter = new Buffer(this.engine, BufferBindFlag.VertexBuffer, this._nodeIDs, BufferUsage.Dynamic);
    mesh.setVertexBufferBinding(nodeIDsButter, 4, 0)

    const vertexNodeIDsBuffer = new Buffer(this.engine, BufferBindFlag.VertexBuffer, this._vertexNodeIDs, BufferUsage.Dynamic);
    mesh.setVertexBufferBinding(vertexNodeIDsBuffer, 4, 1);

    const positionBuffer = new Buffer(this.engine, BufferBindFlag.VertexBuffer, this.positions, BufferUsage.Dynamic);
    mesh.setVertexBufferBinding(positionBuffer, 12, 2);
    mesh.setVertexElements(
      [
        new VertexElement("NODEINDEX", 0, VertexElementFormat.Float, 0),
        new VertexElement("VERTWXNODEINDEX", 0, VertexElementFormat.Float, 1),
        new VertexElement("POSITION", 0, VertexElementFormat.Vector3, 2),
      ])
    mesh.addSubMesh(0, 0, MeshTopology.TriangleStrip);

    this._nodeIDsBuffer = nodeIDsButter;
    this._vertexNodeIDsBuffer = vertexNodeIDsBuffer;
    this._vertexBuffer = positionBuffer;
    this._mesh = mesh;

    return mesh;
  }

  private _createHeadVertexList(): void {
    const headWidth = this.width == 0 ? 1 : this.width;
    this._headVertexArray = [];

    let halfWidth = headWidth || 1.0;
    halfWidth = halfWidth / 2.0;

    this._headVertexArray.push(new Vector3(-halfWidth, 0, 0));
    this._headVertexArray.push(new Vector3(halfWidth, 0, 0));

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

    const subMeshes = mesh.subMeshes;
    for (let i = 0, n = subMeshes.length; i < n; i++) {
      if (material) {
        const element = renderElementPool.getFromPool();
        element.setValue(this, mesh, mesh.subMeshes[i], material, renderState, shaderPasse);
        renderPipeline.pushPrimitive(element);
      }
    }
  }

  /**
   * @override
   * @internal
   */
  update(deltaTime: number): void {
    this._updateBuffer();
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
    this._updateNodeIndex(this._currentEnd, this._currentNodeIndex);
    this._currentNodeIndex++;

    this._updateTrailUniform();
  }

  private _updateSingleBuffer(nodeIndex: number, transformMatrix: Matrix) {
    const { positions } = this;

    for (let i = 0; i < this._headVertexArray.length; i++) {
      let vertex = this._tempHeadVertexArray[i];
      vertex.copyFrom(this._headVertexArray[i]);
    }
    for (let i = 0; i < this._headVertexArray.length; i++) {
      let vertex = this._tempHeadVertexArray[i];
      vertex.transformToVec3(transformMatrix);
    }
    for (let i = 0; i < this._headVertexArray.length; i++) {
      let positionIndex = ((this._verticesPerNode * nodeIndex) + i) * 3;
      let transformedHeadVertex = this._tempHeadVertexArray[i];

      positions[positionIndex] = transformedHeadVertex.x;
      positions[positionIndex + 1] = transformedHeadVertex.y;
      positions[positionIndex + 2] = transformedHeadVertex.z;
    }

    const finalVertexCount = this._currentLength * this._verticesPerNode * 3;
    this._finalPositions = new Float32Array(finalVertexCount);

    if (finalVertexCount == positions.length && nodeIndex != this.length - 1) {
      // 重组一下 position 数组
      let positionIndex = (this._verticesPerNode * (nodeIndex + 1)) * 3;
      for (let i = positionIndex; i < finalVertexCount; i++) {
        this._finalPositions[i - positionIndex] = positions[i];
      }
      for (let i = 0; i < positionIndex; i++) {
        this._finalPositions[finalVertexCount - positionIndex + i] = positions[i];
      }
    } else {
      for (let i = 0; i < finalVertexCount - 1; i++) {
        this._finalPositions[i] = positions[i];
      }
    }
    this._vertexBuffer.setData(this._finalPositions);
    if (this.mesh.subMesh) {
      this.mesh.subMesh.count = this._currentLength * 2;
    }
  }

  private _updateNodeIndex(nodeIndex: number, id: number) {
    const { nodeIDs } = this;
    for (let i = 0; i < this._verticesPerNode; i++) {
      let baseIndex = nodeIndex * this._verticesPerNode + i;
      this._nodeIDs[baseIndex] = id;
      this._vertexNodeIDs[baseIndex] = i;
    }
    this._vertexNodeIDsBuffer.setData(this._vertexNodeIDs);

    const finalNodeIDCount = this._currentLength * this._verticesPerNode;
    this._finalNodeIDs = new Float32Array(finalNodeIDCount);
    if (finalNodeIDCount == this.nodeIDs.length && nodeIndex != this.length - 1) {
      // 重组一下 nodeID 数组
      let nodeIDIndex = (this._verticesPerNode * (nodeIndex + 1));
      for (let i = nodeIDIndex; i < finalNodeIDCount; i++) {
        this._finalNodeIDs[i - nodeIDIndex] = nodeIDs[i];
      }
      for (let i = 0; i < nodeIDIndex; i++) {
        this._finalNodeIDs[finalNodeIDCount - nodeIDIndex + i] = nodeIDs[i];
      }
    } else {
      for (let i = 0; i < finalNodeIDCount - 1; i++) {
        this._finalNodeIDs[i] = nodeIDs[i];
      }
    }
    this._nodeIDsBuffer.setData(this._finalNodeIDs);
  }

  private _updateTrailUniform() {
    const shaderData = this.material.shaderData;

    let minID, maxID = this._currentNodeIndex;
    if (this._currentLength < this._length) {
      minID = 0;
    } else {
      minID = this._currentNodeIndex - this._length;
    }
    shaderData.setFloat("u_minIndex", minID);
    shaderData.setFloat("u_maxIndex", maxID);
  }
}
