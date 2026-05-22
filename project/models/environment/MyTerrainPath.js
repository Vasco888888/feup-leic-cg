// Centerline geometry of the dirt road network. A single winding spine runs
// north from the barn; three spurs branch off it into the field. The terrain
// shader uses the same math (mirrored in shaders/terrain.frag) so the dirt
// pixels and the placement checks for rocks/grass/bales agree.

const BARN_X = -20;
const BARN_Z = -20;

// Winding spine x = spineX(z). At z = BARN_Z both sine arguments are 0 / π, so
// the spine passes exactly through the barn.
export function spineX(z) {
    const t = z - BARN_Z;
    return BARN_X + 70 * Math.sin(t * 0.0055)
                  + 25 * Math.sin(t * 0.013 + Math.PI);
}

// Distance from a 2D point to a line segment.
function distToSegment(px, pz, ax, az, bx, bz) {
    const abx = bx - ax, abz = bz - az;
    const apx = px - ax, apz = pz - az;
    const len2 = abx * abx + abz * abz;
    const t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / len2));
    const cx = ax + t * abx, cz = az + t * abz;
    return Math.hypot(px - cx, pz - cz);
}

// [anchorZ on spine, endX, endZ] for each spur
const SPURS = [
    [ 80,  220,   50],
    [200, -180,  250],
    [400,  200,  450]
];

// Shortest distance from (x, z) to the road network.
export function pathDist(x, z) {
    // spine only exists north of the barn
    let dist = z >= BARN_Z - 5 ? Math.abs(x - spineX(z)) : 1e6;
    for (const [anchorZ, endX, endZ] of SPURS) {
        dist = Math.min(dist, distToSegment(x, z, spineX(anchorZ), anchorZ, endX, endZ));
    }
    return dist;
}

export function onPath(x, z, clearance) {
    return pathDist(x, z) < clearance;
}
