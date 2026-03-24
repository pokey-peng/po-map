/**
 *
 */
interface IMatrix {
  elements: Float32Array;
  dimension: number;
  setIdentity(): void;
  setTranslate(x: number, y: number, z: number): void;
  setScale(x: number, y: number, z: number): void;
  setRotate(angle: number, x: number, y: number, z: number): void;
  translate(x: number, y: number, z: number): void;
  scale(x: number, y: number, z: number): void;
  rotate(angle: number, x: number, y: number, z: number): void;
}
abstract class Matrix {
  protected _elements: Float32Array;
  dimension: number;
  constructor() {
    this.dimension = 4;
    this._elements = new Float32Array(this.dimension * this.dimension);
  }

  get elements() {
    return this._elements;
  }
  abstract setIdentity(): void;
}

const IDENTITY_4 = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
class Vector4 {
  x: number;
  y: number;
  z: number;
  w: number;
  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
  get xyz() {
    return [this.x, this.y, this.z]
  }
  get xyzw() {
    return [this.x, this.y, this.z, this.w]
  }
  normalize() {
    const len = Math.hypot(this.x, this.y, this.z)
    if (len === 0) {
      throw new Error('Cannot normalize zero vector')
    }
    this.x /= len
    this.y /= len
    this.z /= len
  }
  // 点乘
  dot(other: Vector4): number {
    return this.x * other.x + this.y * other.y + this.z * other.z
  }
  // 叉乘
  cross(other: Vector4): Vector4 {
    return new Vector4(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x,
      0
    )
  }
}
class Matrix4 extends Matrix implements IMatrix {
  private _tmpTransform: Float32Array
  private _tmpResult: Float32Array

  constructor() {
    super();
    this._tmpTransform = new Float32Array(16)
    this._tmpResult = new Float32Array(16)
    this.setIdentity();
  }

  set(Matrix4: Matrix4) {
    this._elements.set(Matrix4.elements)
    return this
  }

  setIdentity() {
    this._elements.set(IDENTITY_4)
  }

  setLookAt(eyeX: number, eyeY: number, eyeZ: number, centerX: number, centerY: number, centerZ: number, upX: number, upY: number, upZ: number) {
    const eye = new Vector4(eyeX, eyeY, eyeZ)
    const center = new Vector4(centerX, centerY, centerZ)
    const up = new Vector4(upX, upY, upZ)

    const zAxis = new Vector4(
      eye.x - center.x,
      eye.y - center.y,
      eye.z - center.z,
      0
    )
    zAxis.normalize()

    const xAxis = up.cross(zAxis)
    xAxis.normalize()
    const yAxis = zAxis.cross(xAxis)

    this.setIdentity()
    this._elements.set([
      xAxis.x, yAxis.x, zAxis.x, 0,
      xAxis.y, yAxis.y, zAxis.y, 0,
      xAxis.z, yAxis.z, zAxis.z, 0,
      -xAxis.dot(eye), -yAxis.dot(eye), -zAxis.dot(eye), 1
    ])
  }

  setOrtho(left: number, right: number, bottom: number, top: number, near: number, far: number) {
    this.setIdentity()
    this._elements.set([
      2 / (right - left), 0, 0, 0,
      0, 2 / (top - bottom), 0, 0,
      0, 0, -2 / (far - near), 0,
      -(right + left) / (right - left), -(top + bottom) / (top - bottom), -(far + near) / (far - near), 1
    ])

  }

  setPerspective(fovY: number, aspect: number, near: number, far: number) {
    const f = 1 / Math.tan((fovY * Math.PI) / 360)
    this.setIdentity()
    this._elements.set([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, (2 * far * near) / (near - far), 0
    ])
  }

  setTranslate(x: number = 0, y: number = 0, z: number = 0) {
    this.setIdentity();
    this._elements[12] = x;
    this._elements[13] = y;
    this._elements[14] = z;
  }

  setScale(x: number = 1, y: number = 1, z: number = 1) {
    this.setIdentity();
    this._elements[0] = x;
    this._elements[5] = y;
    this._elements[10] = z;
  }

  setRotate(angle: number, x: number = 0, y: number = 0, z: number = 1) {
    const len = Math.hypot(x, y, z)
    if (len === 0) {
      throw new Error('Rotation axis cannot be zero vector')
    }
    x /= len
    y /= len
    z /= len

    const rad = (angle * Math.PI) / 180;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const t = 1 - c;

    this.setIdentity();
    this._elements.set(
      [
        t * x * x + c, t * x * y + s * z, t * x * z - s * y, 0,
        t * x * y - s * z, t * y * y + c, t * y * z + s * x, 0,
        t * x * z + s * y, t * y * z - s * x, t * z * z + c, 0,
        0, 0, 0, 1
      ]
    )
  }

  translate(x: number = 0, y: number = 0, z: number = 0) {
    const transform = this._tmpTransform
    transform.set(IDENTITY_4)
    transform[12] = x
    transform[13] = y
    transform[14] = z
    this.multiplyElements(transform)
  }

  scale(x: number = 1, y: number = 1, z: number = 1) {
    const transform = this._tmpTransform
    transform.set(IDENTITY_4)
    transform[0] = x
    transform[5] = y
    transform[10] = z
    this.multiplyElements(transform)
  }

  rotate(angle: number, x: number = 0, y: number = 0, z: number = 1) {
    const len = Math.hypot(x, y, z)
    if (len === 0) {
      throw new Error('Rotation axis cannot be zero vector')
    }
    x /= len
    y /= len
    z /= len

    const rad = (angle * Math.PI) / 180
    const c = Math.cos(rad)
    const s = Math.sin(rad)
    const t = 1 - c

    const transform = this._tmpTransform
    transform[0] = t * x * x + c
    transform[1] = t * x * y + s * z
    transform[2] = t * x * z - s * y
    transform[3] = 0

    transform[4] = t * x * y - s * z
    transform[5] = t * y * y + c
    transform[6] = t * y * z + s * x
    transform[7] = 0

    transform[8] = t * x * z + s * y
    transform[9] = t * y * z - s * x
    transform[10] = t * z * z + c
    transform[11] = 0

    transform[12] = 0
    transform[13] = 0
    transform[14] = 0
    transform[15] = 1

    this.multiplyElements(transform)
  }

  multiply(other: Matrix4) {
    this.multiplyElements(other.elements)
    return this
  }

  private multiplyElements(otherElements: Float32Array) {
    const a = this._elements;
    const b = otherElements;
    const result = this._tmpResult;
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        result[col * 4 + row] =
          a[0 * 4 + row] * b[col * 4 + 0] +
          a[1 * 4 + row] * b[col * 4 + 1] +
          a[2 * 4 + row] * b[col * 4 + 2] +
          a[3 * 4 + row] * b[col * 4 + 3];
      }
    }
    this._elements.set(result)
  }
}

export { Matrix4 }
