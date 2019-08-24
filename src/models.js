let QUAD = new Float32Array([
  -0.5,  0.5, 0.0,
  -0.5, -0.5, 0.0,
   0.5,  0.5, 0.0,
  -0.5, -0.5, 0.0,
   0.5, -0.5, 0.0,
   0.5,  0.5, 0.0,
]);

let DOT = new Float32Array([0, 0, 0]);

let TRAIL = new Float32Array([
  -0.1,  1.0, 0.0,
  -0.1,  0.0, 0.0,
   0.1,  1.0, 0.0,
  -0.1,  0.0, 0.0,
   0.1,  0.0, 0.0,
   0.1,  1.0, 0.0,
  ]);

  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Creating_3D_objects_using_WebGL
  const CUBE = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
  ];

  const CUBE_INDICES = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ];


const QUAD_UVS = new Float32Array([0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1]);

const UNIFORM_NAMES = [
  "modelMatrix",
  "viewMatrix",
  "projectionMatrix",
  "uTime",
];

export { QUAD, TRAIL, DOT, CUBE, CUBE_INDICES, QUAD_UVS, UNIFORM_NAMES };