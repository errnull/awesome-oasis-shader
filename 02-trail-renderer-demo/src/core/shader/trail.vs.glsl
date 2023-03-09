attribute float nodeID;
attribute float nodeVertexID;
attribute vec3 nodeCenter;
uniform float minID;
uniform float maxID;
uniform float trailLength;
uniform float maxTrailLength;
uniform float verticesPerNode;
uniform vec2 textureTileFactor;
uniform vec4 headColor;
uniform vec4 tailColor;
varying vec4 vColor;
varying vec2 vUV;
uniform float dragTexture;

uniform mat4 u_projMat;
uniform mat4 u_viewMat;
uniform mat4 u_modelMat;

uniform mat4 u_MVPMat;
attribute vec3 POSITION;


void main(){
  
  // minID = 0.0;
  // maxID = 1.0;
  // trailLength = 1.0;


  float fraction = 1.0;
  // vColor = (1.0 - fraction) * headColor + fraction * tailColor;
  vec4 realPosition = vec4((1.0 - fraction) * POSITION.xyz + fraction * nodeCenter.xyz, 1.0);
  // float s = 0.0;
  // float t = 0.0;
  // if(dragTexture == 1.0) {
  //   s = fraction * textureTileFactor.s;
  //   t = (nodeVertexID / verticesPerNode) * textureTileFactor.t;
  // } else {
  //   s = nodeID / maxTrailLength * textureTileFactor.s;
  //   t = (nodeVertexID / verticesPerNode) * textureTileFactor.t;
  // }
  // vUV = vec2(s, t);
  // gl_Position = u_projMat * u_viewMat * realPosition;
    gl_Position = u_MVPMat  *  vec4( vec3(POSITION.x, POSITION.y, POSITION.z), 1.0 );

}