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
  float time = uTime / 100.0;
  float cutOut = circle(vUvs, 0.4);
  float dist = distance(vUvs, vec2(0.5));
  float halo = 1.0 - smoothstep(0.2, 0.6, dist);
  float alpha = max(cutOut, halo);
  gl_FragColor = vec4(vec3(.86), 1.0) * alpha;
}
