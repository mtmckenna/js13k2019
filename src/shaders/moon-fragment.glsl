precision highp float;

uniform float uGood;
uniform float uTime;
uniform float uStar;
uniform vec2 uSeed;

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
  float isMoon = (1.0 - uStar);
  float cutOut = circle(vUvs, 0.4) * isMoon;
  float dist = distance(vUvs, vec2(0.5));
  float halo = 1.0 - smoothstep(0.2, 0.6, dist);
  float alpha = max(cutOut, halo);
  alpha -= uSeed.x * uStar;
  float twinkle = sin(uTime * uSeed.x / 500.0) * uStar * uSeed.y;
  alpha -= twinkle;
  alpha = clamp(alpha, 0.1, 1.0);
  gl_FragColor = vec4(vec3(.86), 1.0) * alpha;
}
