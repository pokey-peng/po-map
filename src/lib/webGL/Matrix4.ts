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

class Matrix4 extends Matrix implements IMatrix {
  private _tmpTransform: Float32Array
  private _tmpResult: Float32Array

  constructor() {
    super();
    this._tmpTransform = new Float32Array(16)
    this._tmpResult = new Float32Array(16)
    this.setIdentity();
  }

  setIdentity() {
    this._elements.set(IDENTITY_4)
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
