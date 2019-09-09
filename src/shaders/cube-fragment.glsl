precision highp float;

uniform vec3 uColor;
varying vec2 vUvs;

void main() {
  float distance = vUvs.x;
  gl_FragColor = vec4(uColor.xyz, distance);
}
