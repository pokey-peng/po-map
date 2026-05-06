import { BoxGeometry, SphereGeometry, Mesh, MeshStandardMaterial, TextureLoader } from "three";
import { MathUtils } from "three";
import type { Mesh as MeshType } from "three";
interface MeshWithTick extends MeshType {
  tick?: (delta: number) => void
}
function createCube() {
  const geometry = new BoxGeometry(2, 2, 2)
  //const geometry = new SphereGeometry(2)
  const material = createMaterial()
  const cube: MeshWithTick = new Mesh(geometry, material)
  const radian = MathUtils.degToRad(30)
  let translateX = 0.5;
  cube.tick = (delta: number) => {
    cube.rotation.x += radian * delta
    const translateRange = [-1, 1]
    const currentX = cube.position.x
    if (currentX <= translateRange[0] || currentX >= translateRange[1]) {
      translateX = -1 * translateX
    }
    const moveDistance = translateX * delta
    cube.position.x += moveDistance;
  }
  return cube
}

function createMaterial() {
  const textureLoader = new TextureLoader()
  const texture = textureLoader.load('/imgs/texture/uv-test-bw.png')
  const texture2 = textureLoader.load('/imgs/texture/uv-test-col.png')
  console.log('texture', texture)
  const material = new MeshStandardMaterial({
    color: 'white',
    map: texture,
    alphaMap: texture2,
    transparent: true,
  })

  return material
}
export { createCube }
