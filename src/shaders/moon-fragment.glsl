precision highp float;

uniform float uGood;
uniform float uTime;

varying vec2 vUvs;

float circle(in vec2 _st,in float _radius){
  vec2 dist= _st - vec2(0.5);
  return 1.0 - smoothstep(
  _radius - (_radius * .01),
  _radius + (_radius * .01),
  dot(dist, dist) * 4.0
);
}

void main() {
  float alpha = circle(vUvs, 1.0);
  float time = uTime / 100.0;
  vec3 color = 0.5 + 0.5 * cos(time + vUvs.xyx + vec3(1.0, 2.0, 0.0));
  float brightness = 0.9;
  gl_FragColor = vec4(brightness, brightness, brightness, alpha);
  // gl_FragColor = vec4(color, 1.0);
}
