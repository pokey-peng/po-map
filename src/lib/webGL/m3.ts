/**
 * A utility class for 2D matrix operations in WebGL.
 *
 * This class provides static methods for creating and manipulating 3x3 transformation matrices
 * commonly used in 2D WebGL applications. All matrices are represented as Float32Arrays of length 9
 * in column-major order.
 *
 * Key functionalities include:
 * - Creating projection matrices for converting pixel coordinates to clip space
 * - Creating transformation matrices (translation, rotation, scaling)
 * - Multiplying matrices to combine transformations
 * - Transforming points using these matrices
 *
 * Example usage:
 * ```typescript
 * // Create a transformation matrix that first scales, then rotates, then translates
 * const matrix = M3.multiplyMany(
 *   M3.translation(100, 50),     // Third: translate by (100, 50)
 *   M3.rotation(45),             // Second: rotate 45 degrees
 *   M3.scaling(2, 2)             // First: scale by 2x
 * );
 *
 * // Transform a point using the matrix
 * const transformedPoint = M3.transformPoint(matrix, new Float32Array([10, 20, 1]));
 * ```
 */
class M3 {
  static identity(): Float32Array {
    return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])
  }
  /**
   * Creates a 2D projection matrix for WebGL.
   *
   * This function generates a 3x3 matrix that converts from pixel coordinates to clip space
   * coordinates in WebGL, where clip space coordinates range from -1 to 1 in both x and y directions.
   *
   * @param width - The width of the rendering area in pixels
   * @param height - The height of the rendering area in pixels
   * @returns A 3x3 projection matrix as a Float32Array of length 9
   *
   */
  static projection(width: number, height: number): Float32Array {
    return new Float32Array([2 / width, 0, 0, 0, -2 / height, 0, -1, 1, 1])
  }
  /**
   * Creates a translation matrix for 2D transformations.
   *
   * This function generates a 3x3 matrix that translates points in 2D space by the specified
   * x and y offsets.
   *
   * @param tx - The translation offset in the x direction
   * @param ty - The translation offset in the y direction
   * @returns A 3x3 translation matrix as a Float32Array of length 9
   *
   */
  static translation(tx: number, ty: number): Float32Array {
    return new Float32Array([1, 0, 0, 0, 1, 0, tx, ty, 1])
  }
  /**
   * Creates a rotation matrix for 2D transformations.
   *
   * This function generates a 3x3 matrix that rotates points in 2D space by the specified angle
   * in degrees.
   *
   * @param angle - The rotation angle in degrees
   * @returns A 3x3 rotation matrix as a Float32Array of length 9
   *
   * @example
   * const rotationMatrix = M3.rotation(45);
   * // rotationMatrix will be a Float32Array representing the rotation matrix
   * [
   *   cos(angle), -sin(angle), 0,
   *   sin(angle), cos(angle), 0,
   *   0, 0, 1
   * ]
   */
  static rotation(angle: number): Float32Array {
    const radians = (angle * Math.PI) / 180
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)
    return new Float32Array([cos, -sin, 0, sin, cos, 0, 0, 0, 1])
  }
  /**
   * Creates a scaling matrix for 2D transformations.
   *
   * This function generates a 3x3 matrix that scales points in 2D space by the specified
   * x and y scaling factors.
   *
   * @param sx - The scaling factor in the x direction
   * @param sy - The scaling factor in the y direction
   * @returns A 3x3 scaling matrix as a Float32Array of length 9
   */
  static scaling(sx: number, sy: number): Float32Array {
    return new Float32Array([sx, 0, 0, 0, sy, 0, 0, 0, 1])
  }
  /**
   * Multiplies two 3x3 matrices.
   *
   * This function takes two 3x3 matrices represented as Float32Arrays and returns their product
   * as a new Float32Array.
   *
   * @param a - The first matrix as a Float32Array of length 9
   * @param b - The second matrix as a Float32Array of length 9
   * @returns The product of the two matrices as a new Float32Array of length 9
   */
  static multiply(a: Float32Array, b: Float32Array): Float32Array {
    const result = new Float32Array(9)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        result[i * 3 + j] =
          a[i * 3 + 0] * b[0 * 3 + j] + a[i * 3 + 1] * b[1 * 3 + j] + a[i * 3 + 2] * b[2 * 3 + j]
      }
    }
    return result
  }
  /**
   * Multiplies multiple 3x3 matrices.
   *
   * This function takes a base matrix and an arbitrary number of additional matrices,
   * and returns their product as a new Float32Array.
   *
   * @param a - The base matrix as a Float32Array of length 9
   * @param b - The additional matrices as Float32Arrays of length 9
   * @returns The product of the matrices as a new Float32Array of length 9
   */
  static multiplyMany(a: Float32Array, ...b: Float32Array[]): Float32Array {
    let result = a
    for (let i = 0; i < b.length; i++) {
      result = M3.multiply(result, b[i])
    }
    return result
  }

  /**
   * Transforms a point using a 3x3 transformation matrix.
   *
   * This function takes a transformation matrix and a point represented as a Float32Array,
   * and returns the transformed point as a new Float32Array.
   *
   * @param matrix - The transformation matrix as a Float32Array of length 9
   * @param point - The point to be transformed as a Float32Array of length 3
   * @returns The transformed point as a new Float32Array of length 3
   */
  static transformPoint(matrix: Float32Array, point: Float32Array): Float32Array {
    const x = point[0]
    const y = point[1]
    const transformedPoint = new Float32Array(3)
    transformedPoint[0] = matrix[0] * x + matrix[3] * y + matrix[6]
    transformedPoint[1] = matrix[1] * x + matrix[4] * y + matrix[7]
    transformedPoint[2] = 1
    return transformedPoint
  }
}

export default M3
