precision highp float;

uniform vec3 uColor;
uniform float uFadeDistance;

varying vec3 vPosition;

void main() {
  //  gl_FragColor = vec4(uColor.xyz, 1.0);
  float alpha = vPosition.z / uFadeDistance;
  gl_FragColor = vec4(uColor.xyz, alpha);
}
