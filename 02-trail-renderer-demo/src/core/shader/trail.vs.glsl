uniform mat4 u_projMat;
uniform mat4 u_viewMat;
uniform mat4 u_modelMat;

uniform float u_minIndex;
uniform float u_maxIndex;

uniform vec4 u_headColor;
uniform vec4 u_tailColor;

attribute float VERTWXNODEINDEX;
attribute float NODEINDEX;
attribute vec3 POSITION;

varying vec4 vColor;
varying vec2 v_uv;

void main(){
  float radio = ( u_maxIndex - NODEINDEX) / (u_maxIndex - u_minIndex );
  vColor = ( 1.0 - radio ) * u_headColor + radio * u_tailColor;
  float s = NODEINDEX / 80.0 * 8.0;
  float t = VERTWXNODEINDEX;
  
  v_uv = vec2( s, t );
  gl_Position = u_projMat * u_viewMat * vec4( vec3( POSITION.x, POSITION.y, POSITION.z ),1.0 );
}
