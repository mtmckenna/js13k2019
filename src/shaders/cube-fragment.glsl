precision highp float;

uniform vec3 uColor;
uniform float uFadeDistance;

varying vec3 vPosition;
varying vec2 vUvs;
varying vec4 vWorldPos;

void main() {
   gl_FragColor = vec4(uColor.xyz, 1.0);
  // float alpha = 1.0 - vPosition.z / uFadeDistance;
  float alpha = vWorldPos.z / 25.0;
  gl_FragColor = vec4(uColor.xyz, alpha);
}
