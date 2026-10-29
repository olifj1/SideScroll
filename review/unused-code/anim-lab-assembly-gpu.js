/* SideScroll v1.1.11 — shared textured-triangle compositor for animated Atlas meshes.
 * Canvas2D clips/draws one atlas image PER TRIANGLE and can stall phone playback.
 * This optional WebGL1 layer composites all triangles with reusable GPU textures.
 * Rendering and skin calculations stay separate; Canvas2D remains the fallback.
 */
(() => {
  'use strict';
  let instance=null, unavailable=false;
  function create(){
    const canvas=document.createElement('canvas');
    const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true,
      preserveDrawingBuffer:true,depth:false,stencil:false,powerPreference:'low-power'});
    if(!gl)return null;
    const vertex=`attribute vec2 a_xy; attribute vec2 a_uv;
      uniform vec2 u_size; varying vec2 v_uv;
      void main(){v_uv=a_uv;gl_Position=vec4(a_xy.x/u_size.x*2.0-1.0,1.0-a_xy.y/u_size.y*2.0,0.0,1.0);}`;
    const fragment=`#ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      void main(){gl_FragColor=texture2D(u_tex,v_uv);}`;
    function shader(kind,src){
      const sh=gl.createShader(kind);gl.shaderSource(sh,src);gl.compileShader(sh);
      if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));
      return sh;
    }
    let program;
    try{
      program=gl.createProgram();
      gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));
      gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));
      gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    }catch(e){console.warn('[Anim Lab] GPU atlas unavailable:',e);return null;}
    const buffer=gl.createBuffer(),xy=gl.getAttribLocation(program,'a_xy'),uv=gl.getAttribLocation(program,'a_uv');
    const size=gl.getUniformLocation(program,'u_size'),texUnit=gl.getUniformLocation(program,'u_tex');
    const textures=new WeakMap();let failed=false,draws=0;
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;unavailable=false;instance=null;});
    function prepare(w,h){
      if(failed)return false;
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
      gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.enableVertexAttribArray(xy);gl.enableVertexAttribArray(uv);
      gl.vertexAttribPointer(xy,2,gl.FLOAT,false,16,0);
      gl.vertexAttribPointer(uv,2,gl.FLOAT,false,16,8);
      gl.uniform2f(size,w,h);gl.uniform1i(texUnit,0);
      gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);draws=0;
      return true;
    }
    function imageTexture(image){
      let entry=textures.get(image);
      const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;
      if(entry&&entry.w===w&&entry.h===h)return entry.texture;
      const texture=entry?.texture||gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
      textures.set(image,{texture,w,h});
      return texture;
    }
    function paint(image,mesh,points){
      if(failed)return false;
      const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;
      if(!w||!h)return false;
      const triangles=mesh.triangles||[],v=mesh.vertices||[];
      if(!triangles.length)return true;
      const data=new Float32Array(triangles.length*12);let cursor=0;
      for(const tri of triangles){
        for(let i=0;i<3;i++){
          const n=tri[i],dst=points[n],src=v[n];
          if(!dst||!src){cursor+=4;continue;}
          data[cursor++]=dst.x;data[cursor++]=dst.y;
          data[cursor++]=src.x/w;data[cursor++]=src.y/h;
        }
      }
      try{
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,imageTexture(image));
        gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
        gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES,0,triangles.length*3);draws++;
        return true;
      }catch(e){failed=true;console.warn('[Anim Lab] GPU draw failed; use Canvas2D:',e);return false;}
    }
    return {canvas,prepare,paint,stats:()=>({draws,failed})};
  }
  window.AnimLabGpuAtlas=Object.freeze({
    begin:(width,height)=>{
      if(unavailable)return null;
      if(!instance){instance=create();if(!instance){unavailable=true;return null;}}
      return instance.prepare(width,height)?instance:null;
    },
    status:()=>instance?.stats()||{draws:0,unavailable}
  });
})();
