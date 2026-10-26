// Project the ground footprint using the same pose and vertical FOV as the
// cube. Keep the floor height fixed while the cube travels forward in Z.
export function getCubeShadow(cube, camera, height, restingY, cubeScale) {
    const distance = Math.max(.1, camera.position.z - cube.position.z);
    const focal = height / (2 * Math.tan(Math.PI / 8));
    const groundY = restingY - cubeScale * 1.6;
    const x = focal * (cube.position.x - camera.position.x) / distance;
    const y = -focal * (groundY - camera.position.y) / distance;
    const scale = 5 / distance;
    return `translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, 0) scale(${scale.toFixed(6)}) translate(-50%, -50%)`;
}
