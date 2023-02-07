varying vec2 v_uv;
varying vec3 v_position;
varying vec3 v_normal;

uniform float u_time;
uniform sampler2D u_texture;
uniform vec3 u_cameraPos;

#define EPS 0.001
#define MAX_ITR 100
#define MAX_DIS 100.0
#define PI	 	  3.141592

uniform float u_water_scale;
uniform float u_water_speed;

uniform vec3 u_sea_base;
uniform vec3 u_water_color;
uniform float u_sea_height;

// Distance Functions
float sd_sph(vec3 p, float r) { return length(p) - r; }

// Distance Map
float map(vec3 p, vec2 sc)
{    
  float l = cos(length(p * 2.0));
  vec2 u = vec2(l, sc.y);
  vec2 um = u * 0.3;
  um.x += u_time * 0.1 * u_water_speed;
  um.y += -u_time * 0.025 * u_water_speed;
  um.x += (um.y) * 2.0;    
  float a1 = texture2D(u_texture, (p.yz  *  .4 + um) * u_water_scale).x;
  float a2 = texture2D(u_texture, (p.zx  *  .4 + um) * u_water_scale).x;
  float a3 = texture2D(u_texture, (p.xy  *  .4 + um) * u_water_scale).x;
  
  float t1 = a1 + a2 + a3;
  t1 /= 15.0 * u_water_scale;
  
  float b1 = texture2D(u_texture, (p.yz  *  1. + u) * u_water_scale).x;
  float b2 = texture2D(u_texture, (p.zx  *  1. + u) * u_water_scale).x;
  float b3 = texture2D(u_texture, (p.xy  *  1. + u) * u_water_scale).x;
  
  float t2 = b1 + b2 + b3;
  t2 /= 15.0  *  u_water_scale;
  
  float comb = t1 * 0.4 + t2 * 0.1 * (1.0 - t1);
  
  return comb + sd_sph(p, 3.); // sd_box(p, vec3(1., 1., 1.)) + sdPlane(p, vec4(0., 0., 1.0, 0.));//
}

float diffuse(vec3 n,vec3 l,float p) {
  return pow(dot(n,l) * 0.4 + 0.6,p);
}

float specular(vec3 n,vec3 l,vec3 e,float s) {    
  float nrm = (s + 8.0) / (PI * 8.0);
  return pow(max(dot(reflect(e,n),l),0.0),s) * nrm;
}

// sky
vec3 getSkyColor(vec3 e) {
  e.y = max(e.y,0.0);
  return vec3(pow(1.0-e.y,2.0), 1.0-e.y, 0.6+(1.0-e.y)*0.4);
}

vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {  
  float fresnel = clamp(1.0 - dot(n,-eye), 0.0, 1.0);
  fresnel = pow(fresnel,3.0) * 0.65;

  vec3 reflected = getSkyColor(reflect(eye,n));    
  vec3 refracted = u_sea_base + diffuse(normalize(n),l,80.0) * u_water_color * 0.12; 

  vec3 color =  mix(refracted,reflected,fresnel);

  float atten = max(1.0 - dot(dist,dist) * 0.001, 0.0);
  color += u_water_color * (length(p) - u_sea_height) * 0.18 * atten; // 

  color += vec3(specular(n,l,eye,20.0));

  return color;
}

void main (void) {

  vec2 uv = vec2(v_uv.x * 0.5, v_uv.y * 0.5);//  / iResolution.xy;
  
  vec3 pos = v_position; 
  vec3 dist = pos - u_cameraPos;

  float dis = EPS;
  vec3 rayDir = normalize(dist);
  
  // Ray marching
  for(int i = 0; i < MAX_ITR; i++)
  {
    if(dis < EPS || dis > MAX_DIS)
      break;
    dis = map(pos, uv);
    pos += dis * rayDir;
  }
  
  if (dis >= EPS) 
  {
    discard;
  }
  
  vec3 lig = normalize(vec3(-1., -3, -4.5));
  vec2 eps = vec2(0.0, EPS);
  vec3 normal = normalize(vec3(
    map(pos + eps.yxx, uv) - map(pos - eps.yxx, uv),
    map(pos + eps.xyx, uv) - map(pos - eps.xyx, uv),
    map(pos + eps.xxy, uv) - map(pos - eps.xxy, uv)
  ));
  
  vec3 col = getSeaColor(pos, normal, lig, rayDir, dist);
  
  gl_FragColor = vec4(col,1.0);
}