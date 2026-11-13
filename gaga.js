/* GAGA 嘎嘎 — TAYDER MUSIC 店貓 3D 原型引擎（WebGL2 即時渲染，無外部套件）
   Gaga.create(canvas, opts) -> { setPose(p), play(state), setExpression(name), render(), stop() }
*/
(function (root) {
  'use strict';

  var VS = '#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

  var FS = [
    '#version 300 es',
    'precision highp float;',
    'out vec4 o;',
    'uniform vec2 uRes;uniform float uYaw,uCamPitch,uZoom,uShadow;uniform vec3 uOffset;',
    'uniform vec3 uHeadRot;uniform float uBob,uSquash,uWalk,uWalkAmt;',
    'uniform vec3 uArmL,uArmR;uniform vec2 uTail;',
    'uniform float uEye,uMouth,uBrow,uLid,uBlush,uEarDroop,uPupil;uniform vec2 uLook;',
    'mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1,0,0,0,c,s,0,-s,c);}',
    'mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0,-s,0,1,0,s,0,c);}',
    'mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0,-s,c,0,0,0,1);}',
    'float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}',
    'float sdE(vec3 p,vec3 r){float k0=length(p/r);float k1=length(p/(r*r));return k0*(k0-1.)/k1;}',
    'float sdRC(vec3 p,vec3 a,vec3 b,float r1,float r2){vec3 ba=b-a;float l2=dot(ba,ba);float rr=r1-r2;float a2=l2-rr*rr;float il2=1./l2;vec3 pa=p-a;float y=dot(pa,ba);float z=y-l2;vec3 xv=pa*l2-ba*y;float x2=dot(xv,xv);float y2=y*y*l2;float z2=z*z*l2;float k=sign(rr)*rr*rr*x2;if(sign(z)*a2*z2>k)return sqrt(x2+z2)*il2-r2;if(sign(y)*a2*y2<k)return sqrt(x2+y2)*il2-r1;return (sqrt(x2*a2*il2)+y*rr)*il2-r1;}',
    'float sdTorus(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}',
    // 共用姿勢
    'vec3 headPivot(){return vec3(0.,1.02+uBob,0.04);}',
    'mat3 headM(){return rz(-uHeadRot.z)*rx(-uHeadRot.x)*ry(-uHeadRot.y);}',
    'vec3 tailP(float t){float sw=uTail.x*sin(uTail.y+t*2.6)*t;return vec3(sw+0.18*t*t*t,0.22+1.05*t-0.28*t*t+uBob*t,-0.44-0.38*sin(t*1.4));}',
    // 部位距離：x=距離 y=部位 id（1頭 2身 3腳 4尾 5項圈 6吊牌 7鼻 8吻部 9耳）
    'vec2 U(vec2 a,vec2 b){return a.x<b.x?a:b;}',
    'vec2 headGroup(vec3 p){',
    ' vec3 q=headM()*(p-headPivot())-vec3(0.,0.52,0.02);',
    ' float h=sdE(q,vec3(0.80,0.67,0.70));',
    ' h=smin(h,length(q-vec3(0.47,-0.18,0.20))-0.33,0.14);',
    ' h=smin(h,length(q-vec3(-0.47,-0.18,0.20))-0.33,0.14);',
    ' float m=sdE(q-vec3(0.,-0.19,0.58),vec3(0.27,0.17,0.21));',
    ' float n=sdE(q-vec3(0.,-0.10,0.775),vec3(0.075,0.05,0.05));',
    ' vec3 qe=vec3(abs(q.x),q.y,q.z);',
    ' float dr=uEarDroop;vec3 tip=vec3(0.58+0.22*dr,0.86-0.40*dr,-0.04);',
    ' vec3 qz=qe;qz.z=(qz.z+0.02)*1.15;',
    ' float e=sdRC(qz,vec3(0.38,0.38,-0.03),vec3(tip.x,tip.y,tip.z*1.15),0.25,0.05)*0.85;',
    ' float d=min(smin(smin(h,m,0.05),e,0.06),n);',
    ' float id=1.;float mn=h;if(m<mn){mn=m;id=8.;}if(e<mn){mn=e;id=9.;}if(n<mn+0.004){id=7.;}',
    ' return vec2(d,id);}',
    'vec2 bodyGroup(vec3 p){',
    ' vec3 bc=vec3(0.,0.68+uBob*0.6,0.);vec3 rad=vec3(0.58,0.60,0.48)*vec3(1.+uSquash*0.5,1.-uSquash,1.+uSquash*0.4);',
    ' float b=sdE(p-bc,rad);',
    ' b=smin(b,length(p-vec3(0.,0.98+uBob,0.24))-0.30,0.12);',
    ' vec3 pq=vec3(abs(p.x),p.y,p.z);',
    ' float hh=sdE(pq-vec3(0.39,0.28,-0.04),vec3(0.26,0.28,0.36));b=smin(b,hh,0.10);',
    ' vec2 r=vec2(b,2.);',
    ' float wl=sin(uWalk)*uWalkAmt;',
    ' vec3 fl=vec3(0.39,0.06+max(0.,-wl)*0.10,0.24+wl*0.22);vec3 fr=vec3(-0.39,0.06+max(0.,wl)*0.10,0.24-wl*0.22);',
    ' float hf=min(sdE(p-fl,vec3(0.15,0.08,0.21)),sdE(p-fr,vec3(0.15,0.08,0.21)));',
    ' vec3 sL=vec3(0.25,0.86+uBob,0.20),sR=vec3(-0.25,0.86+uBob,0.20);',
    ' vec3 pL=vec3(0.26,0.12,0.33)+vec3(0.,0.,-wl*0.2)+uArmL;vec3 pR=vec3(-0.26,0.12,0.33)+vec3(0.,0.,wl*0.2)+uArmR;',
    ' float aL=sdRC(p,sL,pL,0.14,0.15);float aR=sdRC(p,sR,pR,0.14,0.15);',
    ' float legs=min(min(aL,aR),hf);',
    ' if(legs<r.x){r=vec2(smin(b,legs,0.05),3.);}else{r.x=smin(b,legs,0.05);}',
    ' float tl=1e3;vec3 pa=tailP(0.);for(int i=1;i<=6;i++){float t=float(i)/6.;vec3 pb=tailP(t);tl=min(tl,sdRC(p,pa,pb,0.11-0.025*(t-1./6.),0.11-0.025*t));pa=pb;}',
    ' r=U(r,vec2(tl,4.));',
    ' vec3 cp=p-vec3(0.,0.84+uBob,0.04);cp.y+=0.10*cp.z;cp.z*=1.08;float c=sdTorus(cp,vec2(0.50,0.048))/1.08;r=U(r,vec2(c,5.));',
    ' vec3 tp=p-vec3(0.,0.72+uBob,0.555);tp.z*=2.2;float tg=sdRC(tp,vec3(0.,0.05,0.),vec3(0.,-0.07,0.),0.085,0.03)/2.2;r=U(r,vec2(tg,6.));',
    ' return r;}',
    'vec3 toLocal(vec3 p){return ry(uYaw)*(p-uOffset);}',
    'vec2 map2(vec3 p){vec3 l=toLocal(p);vec2 h=headGroup(l);vec2 b=bodyGroup(l);float d=smin(h.x,b.x,0.06);return vec2(d,h.x<b.x?h.y:b.y);}',
    'float map(vec3 p){return map2(p).x;}',
    'vec3 nrm(vec3 p){vec2 e=vec2(.0015,-.0015);return normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx));}',
    'float shadow(vec3 ro,vec3 rd){float r=1.,t=0.03;for(int i=0;i<22;i++){float h=map(ro+rd*t);r=min(r,10.*h/t);t+=clamp(h,0.03,0.25);if(r<0.02||t>3.)break;}return clamp(r,0.,1.);}',
    'float ao(vec3 p,vec3 n){float o=0.,s=1.;for(int i=1;i<=4;i++){float h=0.05*float(i);o+=(h-map(p+n*h))*s;s*=0.7;}return clamp(1.-2.2*o,0.,1.);}',
    'float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h);}',
    'float ink(float d,float w){float aa=0.006;return 1.-smoothstep(w-aa,w+aa,d);}',
    'vec3 L2(vec3 c){return pow(c,vec3(2.2));}',
    // 眼睛
    'vec4 eyeD(vec2 uv,float side,float type){',
    ' vec2 c=vec2(0.40*side,0.0);vec2 rr=vec2(0.19,0.235);vec2 e=(uv-c)/rr;',
    ' vec4 col=vec4(0.);vec3 dark=L2(vec3(0.10,0.09,0.11));',
    ' if(type<0.5||(type>2.5&&type<3.5&&side<0.)||(type>3.5&&side<0.)){',
    '  float d=length(e);if(d<1.){',
    '   float lidY=1.-2.*uLid;',
    '   if(e.y>lidY){return vec4(0.);}',
    '   vec3 iris=mix(L2(vec3(0.42,0.66,0.28)),L2(vec3(0.80,0.86,0.42)),smoothstep(0.6,-0.8,e.y));',
    '   vec2 pp=e-uLook*0.35;float pu=length(pp*vec2(1.25,1.))/max(uPupil,0.2);',
    '   vec3 cc=mix(iris,dark,1.-smoothstep(0.58,0.64,pu));',
    '   cc=mix(cc,dark,smoothstep(0.86,0.98,d));',
    '   float hl=length(e-vec2(-0.32,0.38)-uLook*0.25);float hl2=length(e-vec2(0.30,-0.30)-uLook*0.25);',
    '   cc=mix(cc,vec3(1.),1.-smoothstep(0.20,0.25,hl));cc=mix(cc,vec3(1.),1.-smoothstep(0.09,0.13,hl2));',
    '   if(e.y>lidY-0.14)cc=mix(cc,dark,smoothstep(lidY-0.14,lidY-0.04,e.y));',
    '   return vec4(cc,1.-smoothstep(0.97,1.03,d));}',
    '  return vec4(0.);}',
    ' if(type<1.5||(type>3.5&&side>0.)){float d=abs(length((uv-c-vec2(0.,-0.10))/vec2(0.15,0.17))-1.)*0.15;if(uv.y<c.y-0.04)d=1.;return vec4(dark,ink(d,0.022));}',
    ' if(type<2.5){float d=abs(length((uv-c-vec2(0.,0.10))/vec2(0.15,0.15))-1.)*0.15;if(uv.y>c.y+0.02)d=1.;return vec4(dark,ink(d,0.02));}',
    ' float d=seg(uv,c+vec2(-0.12,0.03),c+vec2(0.12,-0.01));return vec4(dark,ink(d,0.022));}',
    'vec4 decal(vec3 q){',
    ' float u=atan(q.x,q.z);float v=atan(q.y,length(q.xz));vec2 uv=vec2(u,v);',
    ' if(q.z<0.05)return vec4(0.);',
    ' vec4 a=vec4(0.);',
    ' vec3 dark=L2(vec3(0.16,0.10,0.10));',
    ' float bl=length((vec2(abs(u),v)-vec2(0.66,-0.14))/vec2(0.13,0.075));a=mix(a,vec4(L2(vec3(1.,0.55,0.55)),0.6*uBlush),(1.-smoothstep(0.6,1.,bl))*step(0.01,uBlush));',
    ' vec4 el=eyeD(uv,-1.,uEye);a=mix(a,el,el.a);vec4 er=eyeD(uv,1.,uEye);a=mix(a,er,er.a);',
    ' float bd=1e3;vec2 au=vec2(abs(u),v);',
    ' if(uBrow>0.5&&uBrow<1.5)bd=abs(length((au-vec2(0.40,0.18))/vec2(0.13,0.10))-1.)*0.1+(v<0.25?1.:0.);',
    ' if(uBrow>1.5&&uBrow<2.5)bd=seg(au,vec2(0.29,0.24),vec2(0.52,0.31));',
    ' if(uBrow>2.5)bd=seg(au,vec2(0.29,0.31),vec2(0.52,0.25));',
    ' a=mix(a,vec4(dark,1.),ink(bd,0.016));',
    ' float md=1e3;float my=-0.235;',
    ' if(uMouth<0.5){md=min(abs(length(vec2(u-0.065,v-my-0.01)/vec2(0.065,0.05))-1.)*0.05,abs(length(vec2(u+0.065,v-my-0.01)/vec2(0.065,0.05))-1.)*0.05);if(v>my+0.005)md=1e3;md=min(md,seg(uv,vec2(0.,-0.16),vec2(0.,my+0.0)));}',
    ' if(uMouth>0.5&&uMouth<1.5){vec2 m=vec2(u,v-my+0.005)/vec2(0.12,0.11);float f=length(m);if(v<my+0.005&&f<1.){vec3 cc=mix(L2(vec3(0.55,0.15,0.18)),L2(vec3(0.98,0.52,0.55)),smoothstep(-0.35,-0.75,m.y));a=mix(a,vec4(cc,1.),1.-smoothstep(0.94,1.,f));}md=seg(uv,vec2(0.,-0.16),vec2(0.,my+0.005));md=min(md,v<my+0.005?abs(f-1.)*0.1:seg(uv,vec2(-0.12,my-0.005),vec2(0.12,my-0.005)));}',
    ' if(uMouth>1.5&&uMouth<2.5){md=min(seg(uv,vec2(-0.06,my-0.03),vec2(0.,my)),seg(uv,vec2(0.,my),vec2(0.06,my-0.03)));md=min(md,seg(uv,vec2(0.,-0.16),vec2(0.,my)));}',
    ' if(uMouth>2.5&&uMouth<3.5){float f=length(vec2(u,v-my+0.025)/vec2(0.045,0.055));if(f<1.)a=mix(a,vec4(L2(vec3(0.45,0.12,0.15)),1.),1.-smoothstep(0.9,1.,f));md=seg(uv,vec2(0.,-0.16),vec2(0.,my+0.02));}',
    ' if(uMouth>3.5&&uMouth<4.5){md=min(seg(uv,vec2(-0.02,my-0.01),vec2(0.09,my+0.005)),seg(uv,vec2(0.,-0.16),vec2(0.,my-0.005)));}',
    ' if(uMouth>4.5){float w=my-0.01+0.012*sin(u*55.);md=abs(v-w)*0.8;if(abs(u)>0.10)md=1e3;md=min(md,seg(uv,vec2(0.,-0.16),vec2(0.,my)));}',
    ' a=mix(a,vec4(dark,1.),ink(md,0.011));',
    ' return a;}',
    // 毛色與花紋
    'vec3 albedo(vec3 p,float id,out vec4 dc,out float spec){',
    ' vec3 fur=L2(vec3(0.97,0.60,0.27));vec3 str=L2(vec3(0.84,0.40,0.15));vec3 cream=L2(vec3(1.,0.94,0.84));',
    ' dc=vec4(0.);spec=0.;vec3 l=toLocal(p);',
    ' if(id==7.){spec=0.6;return L2(vec3(0.93,0.47,0.52));}',
    ' if(id==5.){spec=0.25;return L2(vec3(0.12,0.21,0.27));}',
    ' if(id==6.){spec=0.5;vec3 c=L2(vec3(0.94,0.48,0.18));vec3 tp=l-vec3(0.,0.72+uBob,0.555);float t=step(abs(tp.x),0.012)*step(-0.05,tp.y)*step(tp.y,0.03)+step(abs(tp.y-0.03),0.012)*step(abs(tp.x),0.045);return mix(c,L2(vec3(1.,0.97,0.92)),clamp(t,0.,1.));}',
    ' if(id==1.||id==8.||id==9.){',
    '  vec3 q=headM()*(l-headPivot())-vec3(0.,0.52,0.02);',
    '  if(id==9.){vec3 qe=vec3(abs(q.x),q.y,q.z);if(q.z>-0.02&&abs(qe.x-0.47-0.1*(qe.y-0.45))<0.10-0.15*(qe.y-0.42)&&qe.y<0.80-0.3*uEarDroop)return L2(vec3(0.98,0.70,0.68));return fur;}',
    '  vec3 qd=q-vec3(0.,-0.05,0.);dc=decal(qd);',
    '  if(id==8.)return cream;',
    '  float u=atan(q.x,q.z);float v=atan(q.y,length(q.xz));',
    '  float cr=1.-smoothstep(0.30,0.36,length(vec2(u*0.8,(v+0.30)*1.1)));',
    '  float s=0.;',
    '  if(v>0.30&&abs(u)<0.32){float m=abs(sin(u*15.+1.57));s=smoothstep(0.82,0.9,m)*smoothstep(0.30,0.40,v)*(1.-smoothstep(0.55,0.75,v));}',
    '  if(abs(u)>0.80&&abs(u)<1.7){s=max(s,smoothstep(0.75,0.85,sin(v*20.+0.4))*smoothstep(0.80,0.95,abs(u)));}',
    '  if(abs(u)>1.9){s=max(s,smoothstep(0.55,0.70,sin(u*7.+v*2.)));}',
    '  if(v>0.62&&abs(u)>0.32){s=max(s,smoothstep(0.6,0.75,sin(u*8.)));}',
    '  vec3 c=mix(fur,str,s*0.85);return mix(c,cream,cr);}',
    ' if(id==4.){float best=1e3,bt=0.;for(int i=0;i<=12;i++){float t=float(i)/12.;float d=length(l-tailP(t));if(d<best){best=d;bt=t;}}return mix(fur,str,smoothstep(0.2,0.6,sin(bt*26.)));}',
    ' if(id==3.){if(l.y<0.30)return cream;return mix(fur,str,smoothstep(0.55,0.8,sin(l.y*22.)));}',
    ' vec3 b=l-vec3(0.,0.68,0.);float a=atan(b.x,b.z);',
    ' float chest=1.-smoothstep(0.55,0.75,abs(a));chest*=smoothstep(0.05,0.15,l.z);',
    ' float s=smoothstep(0.55,0.80,sin(l.y*15.+1.5*sin(a*1.7)))*smoothstep(0.7,1.2,abs(a));',
    ' if(abs(a)>2.7)s=max(s,0.8*(1.-smoothstep(0.08,0.12,abs(l.x))));',
    ' return mix(mix(fur,str,s*0.85),cream,chest);}',
    'void main(){',
    ' vec2 fc=gl_FragCoord.xy;vec2 p=(2.*fc-uRes)/uRes.y;',
    ' vec3 ta=vec3(0.,1.08,0.)+vec3(uOffset.x,0.,0.);',
    ' vec3 ro=ta+rx(uCamPitch)*vec3(0.,0.,5.4*uZoom);ro.y+=0.25;',
    ' vec3 ww=normalize(ta-ro);vec3 uu=normalize(cross(ww,vec3(0.,1.,0.)));vec3 vv=cross(uu,ww);',
    ' vec3 rd=normalize(p.x*uu+p.y*vv+2.6*ww);',
    ' vec3 sc=uOffset+vec3(0.,1.15,0.);vec3 oc=ro-sc;float bb=dot(oc,rd);float cc=dot(oc,oc)-2.4*2.4;float hd=bb*bb-cc;',
    ' float t=-1.;',
    ' if(hd>0.){float t0=max(-bb-sqrt(hd),0.);float t1=-bb+sqrt(hd);t=t0;bool hit=false;for(int i=0;i<110;i++){float d=map(ro+rd*t);if(d<0.0012*t){hit=true;break;}t+=d*0.9;if(t>t1)break;}if(!hit)t=-1.;}',
    ' vec3 kl=normalize(vec3(-0.55,0.85,0.65));',
    ' if(t<0.){',
    '  float a=0.;if(uShadow>0.5&&rd.y<0.){float tp=-ro.y/rd.y;vec3 g=ro+rd*tp-uOffset;float d=length(g.xz*vec2(1.,1.4));a=0.28*exp(-d*d*3.2);}',
    '  o=vec4(vec3(0.10,0.12,0.16)*a,a);return;}',
    ' vec3 pos=ro+rd*t;vec3 n=nrm(pos);vec2 m=map2(pos);',
    ' vec4 dc;float sp;vec3 alb=albedo(pos,m.y,dc,sp);',
    ' float occ=ao(pos,n);',
    ' float dif=clamp((dot(n,kl)+0.25)/1.25,0.,1.);float sh=shadow(pos+n*0.01,kl);',
    ' vec3 col=alb*L2(vec3(1.,0.95,0.88))*dif*mix(0.45,1.,sh)*1.25;',
    ' col+=alb*L2(vec3(0.60,0.70,0.85))*(0.5+0.5*n.y)*0.38*occ;',
    ' vec3 fl=normalize(vec3(0.8,0.2,0.4));col+=alb*L2(vec3(1.,0.80,0.70))*clamp(dot(n,fl),0.,1.)*0.20*occ;',
    ' float fr=pow(1.-clamp(dot(n,-rd),0.,1.),3.);col+=L2(vec3(1.,0.86,0.7))*fr*0.22*occ;',
    ' vec3 h=normalize(kl-rd);col+=vec3(1.)*pow(clamp(dot(n,h),0.,1.),40.)*sp*sh;',
    ' col+=alb*0.06*(1.-occ)*vec3(0.9,0.4,0.2);',
    ' if(dc.a>0.){vec3 dl=dc.rgb*(0.55+0.55*dif)*mix(0.7,1.,occ);if(dot(dc.rgb,vec3(1.))>2.9)dl=dc.rgb;col=mix(col,dl,dc.a);}',
    ' col=col/(1.+col*0.12);',
    ' o=vec4(pow(col,vec3(1./2.2)),1.);',
    '}'
  ].join('\n');

  // ---------- 姿勢與表情 ----------
  var BASE = {
    yaw: 0, camPitch: -0.06, zoom: 1, shadow: 1, offset: [0, 0, 0],
    headRot: [0, 0, 0], bob: 0, squash: 0, walk: 0, walkAmt: 0,
    armL: [0, 0, 0], armR: [0, 0, 0], tail: [0.25, 0],
    eye: 0, mouth: 0, brow: 0, lid: 0, blush: 0, earDroop: 0, pupil: 1, look: [0, 0]
  };

  // 表情：eye 0睜 1笑眼 2閉 3困惑 4眨眼；mouth 0貓嘴w 1張嘴笑 2嘟嘴 3小o 4扁嘴 5波浪；brow 0無 1上揚 2傲嬌 3擔心
  var EXPR = {
    idle:     { label: '自然待機', en: 'Idle',     eye: 0, mouth: 0, brow: 0, lid: 0.08, blush: 0.25, look: [0, 0], headRot: [0, 0, 0] },
    tsundere: { label: '傲嬌',     en: 'Tsundere', eye: 0, mouth: 2, brow: 2, lid: 0.42, blush: 0.9, look: [-0.9, 0.05], headRot: [-0.08, 0.38, -0.1], pupil: 0.9 },
    curious:  { label: '好奇',     en: 'Curious',  eye: 0, mouth: 3, brow: 1, lid: 0, blush: 0.2, look: [0.15, 0.2], headRot: [0.05, -0.1, 0.32], pupil: 1.35 },
    think:    { label: '思考',     en: 'Think',    eye: 0, mouth: 4, brow: 3, lid: 0.18, blush: 0, look: [0.7, 0.75], headRot: [0.12, -0.18, -0.12], armR: [0.14, 0.66, 0.36] },
    happy:    { label: '開心',     en: 'Happy',    eye: 1, mouth: 1, brow: 1, lid: 0, blush: 0.85, look: [0, 0], headRot: [0.06, 0, 0.08] },
    confused: { label: '困惑',     en: 'Confused', eye: 3, mouth: 5, brow: 3, lid: 0, blush: 0, look: [0.3, -0.1], headRot: [0, 0.1, -0.28], earDroop: 0.6, pupil: 0.7 },
    sleep:    { label: '睡著',     en: 'Sleep',    eye: 2, mouth: 0, brow: 0, lid: 1, blush: 0.4, look: [0, 0], headRot: [-0.3, 0, 0.18], squash: 0.12, bob: -0.07, earDroop: 0.35 },
    welcome:  { label: '招呼',     en: 'Welcome',  eye: 0, mouth: 1, brow: 1, lid: 0, blush: 0.5, look: [0, 0.05], headRot: [0.05, 0, 0.12], armR: [-0.60, 1.20, 0.15] },
    remind:   { label: '提醒',     en: 'Remind',   eye: 4, mouth: 1, brow: 1, lid: 0, blush: 0.3, look: [0.4, 0], headRot: [0, -0.15, 0.1], armR: [-0.55, 0.55, 0.15] },
    goodbye:  { label: '告別',     en: 'Goodbye',  eye: 1, mouth: 0, brow: 0, lid: 0, blush: 0.6, look: [0, 0], headRot: [0.04, 0, -0.1], armL: [0.60, 1.20, 0.15] }
  };

  var WALK_DIR = 1;
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mixPose(a, b, t) {
    var r = {};
    for (var k in a) {
      if (Array.isArray(a[k])) { r[k] = a[k].map(function (v, i) { return lerp(v, b[k][i], t); }); }
      else if (k === 'eye' || k === 'mouth' || k === 'brow') r[k] = t < 0.5 ? a[k] : b[k];
      else r[k] = lerp(a[k], b[k], t);
    }
    return r;
  }
  function withExpr(name, extra) {
    var p = clone(BASE), e = EXPR[name] || EXPR.idle;
    for (var k in e) if (k !== 'label' && k !== 'en') p[k] = clone(e[k]);
    if (extra) for (var j in extra) p[j] = clone(extra[j]);
    return p;
  }
  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

  // 動作：每個動作 = 時間 t(秒) -> 姿勢；dur 為一個循環長度，loop 決定是否循環
  var ACTIONS = {
    idle: { dur: 4, loop: true, f: function (t) {
      var p = withExpr('idle'); p.bob = 0.012 * Math.sin(t * Math.PI); p.tail = [0.3, t * 1.6];
      var bl = t % 4; if (bl > 3.75) p.lid = 1 - Math.abs(bl - 3.875) / 0.125; p.headRot[2] = 0.04 * Math.sin(t * 0.8); return p; } },
    walk: { dur: 1.2, loop: true, f: function (t) {
      var p = withExpr('idle'); var ph = t / 1.2 * Math.PI * 2; p.walk = ph; p.walkAmt = 1; p.bob = 0.03 * Math.abs(Math.sin(ph)); p.yaw = -1.2 * WALK_DIR;
      p.tail = [0.35, ph]; p.headRot = [0.02, -0.5 * WALK_DIR, 0.03 * Math.sin(ph)]; p.lid = 0; return p; } },
    wave: { dur: 2.4, loop: false, f: function (t) {
      var p = withExpr('welcome'); var up = ease(Math.min(1, t / 0.35)) * (t > 2.0 ? 1 - ease((t - 2.0) / 0.4) : 1);
      p.armR = [-0.60 * up + 0.09 * Math.sin(t * 12) * up, 1.20 * up, 0.15 * up]; p.tail = [0.45, t * 3]; p.headRot[2] = 0.12 * up; return p; } },
    happy: { dur: 1.6, loop: false, f: function (t) {
      var p = withExpr('happy'); var j = Math.max(0, Math.sin(t / 1.6 * Math.PI * 2)); p.offset = [0, 0.22 * j, 0]; p.squash = -0.06 * j + (j < 0.05 ? 0.06 : 0);
      p.armL = [0.15, 0.55 * j, 0.1]; p.armR = [-0.15, 0.55 * j, 0.1]; p.tail = [0.6, t * 6]; return p; } },
    curious: { dur: 2.4, loop: false, f: function (t) {
      var p = withExpr('curious'); var k = ease(Math.min(1, t / 0.5)); p.headRot = [0.05 * k, -0.1 * k, 0.32 * k]; p.pupil = 1 + 0.35 * k; p.tail = [0.15, t * 1.2]; return p; } },
    think: { dur: 2.8, loop: false, f: function (t) {
      var p = withExpr('think'); var k = ease(Math.min(1, t / 0.5)); p.armR = [0.14 * k, 0.66 * k, 0.36 * k]; p.headRot[2] = -0.12 * k + 0.03 * Math.sin(t * 2); p.tail = [0.2, t * 1.5]; return p; } },
    point: { dur: 2.4, loop: false, f: function (t) {
      var p = withExpr('remind'); var k = ease(Math.min(1, t / 0.4)) * (t > 2 ? 1 - ease((t - 2) / 0.4) : 1); p.armR = [-0.55 * k, 0.55 * k + 0.03 * Math.sin(t * 9) * k, 0.15 * k]; p.yaw = 0.25 * k; return p; } },
    sleep: { dur: 5, loop: true, f: function (t) {
      var p = withExpr('sleep'); p.squash = 0.12 + 0.02 * Math.sin(t * 1.25); p.tail = [0.08, t * 0.5]; return p; } },
    yawn: { dur: 2.2, loop: false, f: function (t) {
      var k = Math.sin(Math.min(1, t / 2.2) * Math.PI); var p = withExpr('sleep'); p.eye = k > 0.3 ? 2 : 0; p.lid = 0.6 + 0.4 * k; p.mouth = k > 0.3 ? 3 : 0; p.headRot = [0.2 * k, 0, 0.1 * k]; p.squash = 0.05; p.bob = 0; return p; } },
    welcome: { dur: 2.4, loop: false, f: function (t) { var p = ACTIONS.wave.f(t); p.eye = t > 0.8 && t < 1.6 ? 1 : 0; return p; } },
    goodbye: { dur: 2.4, loop: false, f: function (t) {
      var p = withExpr('goodbye'); var up = ease(Math.min(1, t / 0.35)) * (t > 2 ? 1 - ease((t - 2) / 0.4) : 1);
      p.armL = [0.60 * up + 0.09 * Math.sin(t * 11) * up, 1.20 * up, 0.15 * up]; p.tail = [0.4, t * 2.5]; return p; } },
    confused: { dur: 2.4, loop: false, f: function (t) {
      var p = withExpr('confused'); var k = ease(Math.min(1, t / 0.4)); p.headRot[2] = -0.28 * k + 0.05 * Math.sin(t * 3); p.earDroop = 0.6 * k; return p; } }
  };

  function create(canvas, opts) {
    opts = opts || {};
    var gl = canvas.getContext('webgl2', { premultipliedAlpha: false, alpha: true, antialias: false, preserveDrawingBuffer: !!opts.preserve });
    if (!gl) return null;
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var al = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uRes', 'uYaw', 'uCamPitch', 'uZoom', 'uShadow', 'uOffset', 'uHeadRot', 'uBob', 'uSquash', 'uWalk', 'uWalkAmt', 'uArmL', 'uArmR', 'uTail', 'uEye', 'uMouth', 'uBrow', 'uLid', 'uBlush', 'uEarDroop', 'uPupil', 'uLook'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });

    var scale = opts.scale || Math.min(window.devicePixelRatio || 1, 1.5);
    var pose = clone(BASE), raf = 0, cur = null, t0 = 0, from = null, blendT = 0, onEnd = null, frames = 0, fpsT = 0, fps = 0;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      var w = Math.max(1, Math.round(canvas.clientWidth * scale)), h = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    function upload(p) {
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uYaw, p.yaw); gl.uniform1f(U.uCamPitch, p.camPitch); gl.uniform1f(U.uZoom, p.zoom); gl.uniform1f(U.uShadow, p.shadow);
      gl.uniform3fv(U.uOffset, p.offset); gl.uniform3fv(U.uHeadRot, p.headRot); gl.uniform1f(U.uBob, p.bob); gl.uniform1f(U.uSquash, p.squash);
      gl.uniform1f(U.uWalk, p.walk); gl.uniform1f(U.uWalkAmt, p.walkAmt); gl.uniform3fv(U.uArmL, p.armL); gl.uniform3fv(U.uArmR, p.armR); gl.uniform2fv(U.uTail, p.tail);
      gl.uniform1f(U.uEye, p.eye); gl.uniform1f(U.uMouth, p.mouth); gl.uniform1f(U.uBrow, p.brow); gl.uniform1f(U.uLid, p.lid); gl.uniform1f(U.uBlush, p.blush);
      gl.uniform1f(U.uEarDroop, p.earDroop); gl.uniform1f(U.uPupil, p.pupil); gl.uniform2fv(U.uLook, p.look);
    }
    function render(p) {
      resize(); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); upload(p || pose); gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    var lastDraw = 0;
    function frame(now) {
      raf = 0;
      if (!cur) return;
      var mf = cur === 'sleep' ? 8 : (opts.maxFps || 60);
      if (now - lastDraw < 1000 / mf - 2) { if (!document.hidden) raf = requestAnimationFrame(frame); return; }
      lastDraw = now;
      var t = (now - t0) / 1000, a = ACTIONS[cur];
      var tt = a.loop ? t % a.dur : Math.min(t, a.dur);
      var p = a.f(tt);
      if (opts.overrides) for (var k in opts.overrides) p[k] = opts.overrides[k];
      if (from && blendT < 1) { blendT = Math.min(1, t / 0.25); p = mixPose(from, p, ease(blendT)); }
      pose = p; render(p);
      frames++; if (now - fpsT > 1000) { fps = frames * 1000 / (now - fpsT); frames = 0; fpsT = now; }
      if (!a.loop && t >= a.dur) { var cb = onEnd; onEnd = null; if (cb) cb(); else play('idle'); return; }
      if (!document.hidden) raf = requestAnimationFrame(frame);
    }
    function play(name, cb) {
      if (!ACTIONS[name]) return;
      from = clone(pose); blendT = 0; cur = name; t0 = performance.now(); onEnd = cb || null;
      if (reduce) { var a = ACTIONS[name]; pose = a.f(a.loop ? 0 : Math.min(a.dur * 0.5, 1)); render(pose); if (!a.loop && cb) setTimeout(cb, 600); return; }
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function stop() { cur = null; if (raf) cancelAnimationFrame(raf); raf = 0; }
    document.addEventListener('visibilitychange', function () { if (!document.hidden && cur && !raf && !reduce) raf = requestAnimationFrame(frame); });
    return {
      gl: gl, play: play, stop: stop,
      setPose: function (p) { stop(); pose = p; render(p); },
      render: render, get fps() { return fps; }, get state() { return cur; },
      setScale: function (s) { scale = s; },
      setWalkDir: function (d) { WALK_DIR = d < 0 ? -1 : 1; }
    };
  }

  root.Gaga = { create: create, EXPR: EXPR, ACTIONS: ACTIONS, withExpr: withExpr, BASE: BASE };
})(window);
