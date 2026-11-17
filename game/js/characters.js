// =====================================================================
//  角色工廠：makeFigure(設定) → 一個可以擺姿勢的 3D 小人偶
//  風格：圓頭、圓角身體、圓手的「軟膠玩具」小人（原創造型，不是複製樂高）
//  人偶面向 +z，腳底在 y=0，總高度約 1.8
//  場景和角色頁都可以用：<script src="js/characters.js"></script>
// =====================================================================
(function(){
const MC={};
function M(c,o={}){if(c&&c.isMaterial)return c;const k=c+JSON.stringify(o);return MC[k]||(MC[k]=new THREE.MeshStandardMaterial({color:c,roughness:.55,metalness:0,...o}))}
function add(m,p){m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
function grp(p,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g}
function rb(w,h,d,r,c,p,x=0,y=0,z=0){r=Math.min(r,Math.min(w,h,d)/2-.002);const m=add(new THREE.Mesh(new THREE.RoundedBoxGeometry(w,h,d,4,r),M(c)),p);m.position.set(x,y,z);return m}
function sp(r,c,p,x=0,y=0,z=0,sx=1,sy=1,sz=1){const m=add(new THREE.Mesh(new THREE.SphereGeometry(r,28,18),M(c)),p);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m}
function cap(r,len,c,p,x=0,y=0,z=0){const m=add(new THREE.Mesh(new THREE.CapsuleGeometry(r,len,6,18),M(c)),p);m.position.set(x,y,z);return m}
function cyl(r1,r2,h,c,p,x=0,y=0,z=0,s=24){const m=add(new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,s),M(c)),p);m.position.set(x,y,z);return m}
function canvasTex(w,h,draw){const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");draw(x,w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t}
const css=c=>"#"+new THREE.Color(c).getHexString();

// ---------- 臉（畫在一張透明的圖上，貼在頭的正面） ----------
function faceTex(f){return canvasTex(512,512,(x,w,h)=>{x.lineCap="round";x.lineJoin="round";
  const cx=256,ey=f.tired?250:236,ex=82,ink="#2A2024";
  // 腮紅
  if(f.blush){x.fillStyle="rgba(240,120,120,.28)";[-1,1].forEach(s=>{x.beginPath();x.ellipse(cx+s*128,ey+66,40,24,0,0,7);x.fill()})}
  // 皺紋（Amy）
  if(f.wrinkles){x.strokeStyle="rgba(170,95,60,.55)";x.lineWidth=4;
    [[-60,130,60,124],[-40,150,40,146]].forEach(([a,y1,b,y2])=>{x.beginPath();x.moveTo(cx+a,y1);x.quadraticCurveTo(cx,y1-10,cx+b,y2);x.stroke()});
    [-1,1].forEach(s=>{for(let k=0;k<2;k++){x.beginPath();x.moveTo(cx+s*118,ey-6+k*14);x.lineTo(cx+s*142,ey-12+k*20);x.stroke()}
      x.beginPath();x.moveTo(cx+s*70,ey+70);x.quadraticCurveTo(cx+s*86,ey+100,cx+s*70,ey+126);x.stroke()})}
  // 黑眼圈（累壞的 Linda）
  if(f.tired){x.strokeStyle="rgba(120,80,140,.45)";x.lineWidth=7;[-1,1].forEach(s=>{x.beginPath();x.arc(cx+s*ex,ey+12,28,.25*Math.PI,.75*Math.PI);x.stroke()})}
  // 眉毛
  x.strokeStyle=f.browColor||ink;x.lineWidth=f.thickBrow?11:8;
  [-1,1].forEach(s=>{x.beginPath();
    if(f.tired){x.moveTo(cx+s*120,ey-38);x.quadraticCurveTo(cx+s*86,ey-60,cx+s*40,ey-62)}// 內側往上：很累、很無奈
    else{x.moveTo(cx+s*112,ey-46);x.quadraticCurveTo(cx+s*84,ey-66,cx+s*54,ey-56)}x.stroke()});
  // 眼睛
  [-1,1].forEach(s=>{const X=cx+s*ex;
    if(f.tired){x.fillStyle=ink;x.beginPath();x.ellipse(X,ey+2,17,13,0,0,7);x.fill();
      x.fillStyle=css(f.skin);x.fillRect(X-26,ey-30,52,26);       // 眼皮垂下來
      x.strokeStyle=ink;x.lineWidth=6;x.beginPath();x.moveTo(X-24,ey-4);x.lineTo(X+24,ey-4);x.stroke()}
    else{x.fillStyle=ink;x.beginPath();x.ellipse(X,ey,18,23,0,0,7);x.fill();
      x.fillStyle="#fff";x.beginPath();x.arc(X+6,ey-8,6.5,0,7);x.fill();
      if(f.lashes){x.strokeStyle=ink;x.lineWidth=5;x.beginPath();x.moveTo(X+s*14,ey-16);x.lineTo(X+s*28,ey-26);x.stroke()}}});
  // 鼻子
  x.strokeStyle="rgba(150,80,50,.5)";x.lineWidth=5;x.beginPath();x.moveTo(cx-6,ey+50);x.quadraticCurveTo(cx,ey+56,cx+6,ey+50);x.stroke();
  // 嘴巴
  const my=ey+98;
  if(f.mouth==="smile"){x.fillStyle=f.lip||"#3A2428";x.beginPath();x.moveTo(cx-44,my-6);x.quadraticCurveTo(cx,my+40,cx+44,my-6);x.quadraticCurveTo(cx,my+10,cx-44,my-6);x.fill()}
  if(f.mouth==="grin"){x.fillStyle="#3A2428";x.beginPath();x.moveTo(cx-50,my-10);x.quadraticCurveTo(cx,my+44,cx+50,my-10);x.closePath();x.fill();
    x.fillStyle="#E7808A";x.beginPath();x.ellipse(cx,my+12,22,9,0,0,7);x.fill()}
  if(f.mouth==="pout"){x.fillStyle=f.lip||"#B4473A";x.beginPath();x.moveTo(cx-40,my+8);x.quadraticCurveTo(cx-18,my-14,cx,my-4);x.quadraticCurveTo(cx+18,my-14,cx+40,my+8);
    x.quadraticCurveTo(cx,my+22,cx-40,my+8);x.fill();x.strokeStyle="#7E2E26";x.lineWidth=4;x.beginPath();x.moveTo(cx-36,my+6);x.quadraticCurveTo(cx,my-2,cx+36,my+6);x.stroke()}
})}

// ---------- 衣服正面的圖案（貼在身體正面） ----------
function shirtTex(o){return canvasTex(512,512,(x,w,h)=>{x.lineCap="round";const base=css(o.color);x.fillStyle=base;x.fillRect(0,0,w,h);
  const knit=()=>{for(let j=0;j<h;j+=10)for(let i=0;i<w;i+=10){x.fillStyle=`rgba(255,255,255,${.05+Math.random()*.07})`;x.beginPath();x.ellipse(i+5,j+5,3.5,4.5,0,0,7);x.fill()}};
  if(o.type==="vest"){// 酒紅背心＋格紋襯衫領子＋金項鍊
    x.fillStyle=css(o.skin);x.beginPath();x.moveTo(190,0);x.lineTo(322,0);x.lineTo(256,150);x.fill();
    x.fillStyle="#F2D2E6";[[-1],[1]].forEach(([s])=>{x.beginPath();x.moveTo(256+s*70,0);x.lineTo(256+s*160,0);x.lineTo(256+s*150,40);x.lineTo(256+s*60,140);x.lineTo(256,236);x.lineTo(256+s*8,150);x.closePath();x.fill()});
    x.save();x.beginPath();[[-1],[1]].forEach(([s])=>{x.moveTo(256+s*70,0);x.lineTo(256+s*160,0);x.lineTo(256+s*150,40);x.lineTo(256+s*60,140);x.lineTo(256,236);x.lineTo(256+s*8,150);x.closePath()});x.clip();
    x.strokeStyle="#8C2A3E";x.lineWidth=5;for(let k=-500;k<500;k+=26){x.beginPath();x.moveTo(k,0);x.lineTo(k+260,260);x.stroke();x.beginPath();x.moveTo(k+260,0);x.lineTo(k,260);x.stroke()}x.restore();
    x.strokeStyle="#D9AE3A";x.lineWidth=6;x.beginPath();x.moveTo(200,10);x.quadraticCurveTo(256,170,312,10);x.stroke();
    x.strokeStyle="#3A1218";x.lineWidth=6;x.beginPath();x.moveTo(256,236);x.lineTo(256,512);x.stroke();
    [-1,1].forEach(s=>{x.beginPath();x.moveTo(256+s*120,330);x.lineTo(256+s*190,360);x.stroke()})}
  if(o.type==="cardigan"){// 紫色開襟針織衫＋淺紫內搭
    knit();x.fillStyle="#DCC9EE";x.beginPath();x.moveTo(170,0);x.lineTo(342,0);x.lineTo(320,440);x.lineTo(192,440);x.fill();
    x.strokeStyle="rgba(90,50,120,.5)";x.lineWidth=6;[-1,1].forEach(s=>{x.beginPath();x.moveTo(256+s*86,0);x.lineTo(256+s*120,120);x.lineTo(256+s*70,200);x.lineTo(256+s*66,512);x.stroke()});
    x.fillStyle="rgba(80,40,110,.25)";for(let i=0;i<w;i+=12)x.fillRect(i,452,6,60)}
  if(o.type==="tank"){// 米色背心＋星星項鍊、露出一點腰
    x.strokeStyle="#1E1E1E";x.lineWidth=8;x.beginPath();x.arc(256,-40,120,.2*Math.PI,.8*Math.PI);x.stroke();x.lineWidth=6;x.beginPath();x.arc(256,-40,150,.25*Math.PI,.75*Math.PI);x.stroke();
    const star=(cx,cy,R,r)=>{x.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,rr=k%2?r:R;x.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}x.closePath()};
    star(256,210,92,40);x.fillStyle="#1E1E1E";x.fill();star(256,214,70,30);x.fillStyle="#9DB24E";x.fill();
    x.strokeStyle="rgba(170,130,80,.35)";x.lineWidth=5;[-1,1].forEach(s=>{x.beginPath();x.moveTo(256+s*60,330);x.quadraticCurveTo(256+s*120,350,256+s*180,330);x.stroke()});
    x.fillStyle=css(o.skin);x.fillRect(0,440,w,72);x.fillStyle="rgba(150,90,50,.35)";x.fillRect(0,436,w,8)}
  if(o.type==="shirt"){// 粉紅開襟襯衫＋米白 T 恤
    for(let i=0;i<w;i+=9){x.fillStyle="rgba(255,255,255,.08)";x.fillRect(i,0,3,h)}
    x.fillStyle="#F3EDE0";x.beginPath();x.moveTo(176,0);x.lineTo(336,0);x.lineTo(318,512);x.lineTo(194,512);x.fill();
    x.fillStyle=base;[-1,1].forEach(s=>{x.beginPath();x.moveTo(256+s*56,0);x.lineTo(256+s*150,0);x.lineTo(256+s*110,90);x.closePath();x.fill()});
    x.strokeStyle="rgba(150,70,70,.45)";x.lineWidth=5;[-1,1].forEach(s=>{x.beginPath();x.moveTo(256+s*80,40);x.lineTo(256+s*68,512);x.stroke()});
    x.fillStyle="#D98B86";[120,220,320,420].forEach(y=>{x.beginPath();x.arc(256-58,y,8,0,7);x.fill()})}
})}

// ---------- 頭髮 ----------
function hair(style,c,head){const m=M(c,{roughness:.42});
  const blob=(r,x,y,z,sx=1,sy=1,sz=1)=>{const s=add(new THREE.Mesh(new THREE.SphereGeometry(r,22,16),m),head);s.position.set(x,y,z);s.scale.set(sx,sy,sz);return s};
  // 頭頂的「髮帽」：開口的半球，往後傾，前面的髮際線停在額頭
  const dome=(tilt=.55,len=1.72,sc=1.06)=>{const d=add(new THREE.Mesh(new THREE.SphereGeometry(.3,36,20,0,Math.PI*2,0,len),M(m.color.getHex(),{roughness:.42,side:THREE.DoubleSide})),head);d.rotation.x=-tilt;d.scale.set(sc,1,1.03);d.position.y=.0;return d};
  if(style==="bob"){// 銀灰色蓬鬆短捲髮
    dome(.6,1.75,1.08);
    for(let i=0;i<16;i++){const a=i/16*Math.PI*2,r=.27;const y=.12+Math.sin(i*1.7)*.05;if(Math.sin(a)>.35)continue;
      blob(.1+(i%3)*.012,Math.cos(a)*r,y,Math.sin(a)*r*.95-.03)}
    [-1,1].forEach(s=>{blob(.13,s*.27,-.04,-.02,.9,1.1,1);blob(.11,s*.25,-.16,-.06);blob(.11,s*.22,.2,.1,1,.8,1)});
    blob(.14,-.06,.25,.13,1.6,.55,.9);blob(.1,.12,.27,.12,1.2,.5,.9);blob(.15,0,-.08,-.2,1.6,1.1,.8)}
  if(style==="curly"){// 深棕色長捲髮，頭頂綁一點
    dome(.6,1.75,1.06);blob(.15,0,.3,-.1,1.1,.9,1);blob(.12,0,.38,-.2);
    for(let row=0;row<6;row++)for(let k=-3;k<=3;k++){const y=-.02-row*.11,x=k*.085*(1+row*.06),z=-.18-Math.abs(k)*.0;if(Math.abs(k)===3&&row<1)continue;
      blob(.075+((row+k)&1)*.012,x,y,z-.02*(row%2),1,1.1,1)}
    [-1,1].forEach(s=>{for(let row=0;row<5;row++)blob(.075,s*(.27+row*.012),-.02-row*.1,.0+(row%2)*.03-row*.02)})}
  if(style==="long"||style==="longPart"){// 長直髮
    dome(.58,1.75,1.05);
    const back=add(new THREE.Mesh(new THREE.RoundedBoxGeometry(.62,.78,.2,4,.09),m),head);back.position.set(0,-.27,-.15);
    [-1,1].forEach(s=>{const side=add(new THREE.Mesh(new THREE.RoundedBoxGeometry(.13,.66,.22,4,.06),m),head);side.position.set(s*.27,-.2,.02);side.rotation.z=s*.05;
});
  }
}

// ---------- 組合成一個人偶 ----------
window.makeFigure=function(o){
  const root=new THREE.Group();root.userData.kind="figure";
  const body=grp(root);                 // 整個身體（走路時會上下晃）
  const skin=o.skin,S=M(skin,{roughness:.5});
  // 腳：褲管＋鞋子（短褲的話露出小腿）
  const legs=[-1,1].map(s=>{const hip=grp(body,s*.12,.56,0);
    if(o.shorts){rb(.22,.22,.25,.08,o.pants,hip,0,-.1,0);rb(.235,.07,.265,.03,o.cuff||o.pants,hip,0,-.22,0);cap(.075,.18,skin,hip,0,-.36,0)}
    else{rb(.22,.46,.25,.08,o.pants,hip,0,-.22,0);if(o.cuff)rb(.235,.08,.265,.035,o.cuff,hip,0,-.42,0)}
    rb(.23,.11,.31,.05,o.shoes,hip,0,-.5,.03);return hip});
  rb(.48,.16,.27,.07,o.pants,body,0,.58,0);           // 腰
  if(o.belt)rb(.49,.035,.275,.015,o.belt,body,0,.645,0);
  // 身體：圓角方塊＋正面的衣服圖案
  const torso=rb(.54,.56,.32,.12,o.top,body,0,.92,0);
  const front=new THREE.Mesh(new THREE.PlaneGeometry(.44,.5),new THREE.MeshStandardMaterial({map:shirtTex({type:o.shirt,color:o.top,skin}),roughness:.6}));front.position.set(0,.93,.161);body.add(front);
  if(o.collar)[-1,1].forEach(s=>{const c=rb(.16,.06,.1,.025,o.collar,body,s*.1,1.18,.1);c.rotation.z=s*.35;c.rotation.x=-.4});
  cyl(.075,.085,.08,skin,body,0,1.22,0);               // 脖子
  // 頭：圓圓的，臉是貼上去的
  const neck=grp(body,0,1.24,0),head=grp(neck,0,.27,0);
  sp(.285,skin,head,0,0,0,1,.94,.92);
  // 表情：可以準備好幾張臉，之後用 setFace() 換
  const faceTexs={};const faces=o.faces||{base:o.face};for(const k in faces)faceTexs[k]=faceTex({...faces[k],skin});
  const firstFace=o.startFace||Object.keys(faces)[0];
  const faceMat=new THREE.MeshStandardMaterial({map:faceTexs[firstFace],transparent:true,roughness:.5,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
  const face=new THREE.Mesh(new THREE.SphereGeometry(.288,40,30,Math.PI/2-.85,1.7,Math.PI/2-.8,1.6),faceMat);
  face.scale.set(1,.94,.92);head.add(face);
  [-1,1].forEach(s=>sp(.05,skin,head,s*.28,-.01,0,.6,1,.8));  // 耳朵
  hair(o.hair,o.hairColor,head);
  // 手：袖子長短可以設定，手是圓的
  const arms=[-1,1].map(s=>{const sh=grp(body,s*.33,1.12,0);sh.rotation.z=s*.12;
    const sleeve=o.sleeve,upC=sleeve==="none"?skin:o.sleeveColor||o.top;
    cap(.078,.18,upC,sh,0,-.13,0);if(sleeve!=="none")sp(.09,upC,sh,0,-.02,0);else sp(.08,skin,sh,0,-.02,0);
    if(sleeve==="mid")rb(.18,.06,.18,.03,o.cuff2||upC,sh,0,-.26,0);
    const el=grp(sh,0,-.27,0);
    const loC=sleeve==="long"?upC:skin;cap(.07,.15,loC,el,0,-.11,0);if(sleeve==="long")rb(.16,.05,.16,.025,o.cuff2||upC,el,0,-.21,0);
    const hand=grp(el,0,-.25,0);sp(.078,skin,hand,0,0,0,1,1.05,.95);sp(.035,skin,hand,0,.01,.06,1,1.2,1);   // 圓圓的手＋大拇指
    return{sh,el,hand}});
  // 道具：手機
  if(o.phone){const hd=arms[o.phone.hand==="L"?1:0].hand;const ph=rb(.06,.17,.018,.01,o.phone.color,hd,0,.03,.08);ph.rotation.x=o.phone.up?-.1:-1.2;
    if(o.phone.up){ph.position.set(0,.1,.06);sp(.012,0x111111,hd,-.012,.16,.07)}}
  const F={root,body,head,neck,legs,arms,o,mode:o.pose||"idle",t:Math.random()*10,tiredBody:0,face:firstFace};
  // 換表情（累的時候身體也會駝背、動作變慢）
  F.setFace=k=>{if(!faceTexs[k])return;faceMat.map=faceTexs[k];faceMat.needsUpdate=true;F.face=k;F.tiredBody=faces[k].tired?1:0;
    if(o.facePose&&o.facePose[k])F.home=F.mode=o.facePose[k]};
  F.update=(dt)=>{F.t+=dt;const t=F.t,m=F.mode;const [R,L]=arms;   // R＝角色的右手（畫面左邊）
    const tired=F.tiredBody;
    // 先回到基本姿勢
    legs.forEach(l=>l.rotation.set(0,0,0));arms.forEach((a,i)=>{a.sh.rotation.set(0,0,(i?1:-1)*.12);a.el.rotation.set(0,0,0)});
    body.position.y=0;body.rotation.set(tired*.08,0,0);neck.rotation.set(tired*.18,0,0);
    if(m==="walk"||m==="carryWalk"){const w=t*7;legs[0].rotation.x=Math.sin(w)*.55;legs[1].rotation.x=-Math.sin(w)*.55;
      R.sh.rotation.x=-Math.sin(w)*.5;L.sh.rotation.x=Math.sin(w)*.5;R.el.rotation.x=-.3;L.el.rotation.x=-.3;body.position.y=Math.abs(Math.sin(w))*.04;neck.rotation.y=Math.sin(w*.5)*.05;
      if(m==="carryWalk"){R.sh.rotation.set(-.9,0,.2);L.sh.rotation.set(-.9,0,-.2);R.el.rotation.x=-.9;L.el.rotation.x=-.9}}
    else{body.position.y=Math.sin(t*2)*.008;neck.rotation.z=Math.sin(t*.9)*.05;
      if(m==="wave"||m==="tiredWave"){const sp=m==="tiredWave"?2.2:6;R.sh.rotation.z=-2.55;R.sh.rotation.x=-.15;R.el.rotation.z=Math.sin(t*sp)*.35-.2;neck.rotation.z=.06}
      if(m==="tiredWave"){L.sh.rotation.x=-.35;L.el.rotation.x=-.9;neck.rotation.z=-.1+Math.sin(t*.8)*.04}
      if(m==="selfie"){R.sh.rotation.x=-1.35;R.sh.rotation.z=-.35;R.el.rotation.x=-1.1;R.el.rotation.z=-.2;neck.rotation.z=.16;neck.rotation.x=-.08;body.rotation.y=.1;L.sh.rotation.z=.22}
      if(m==="sit"){legs[0].rotation.x=-1.5;legs[1].rotation.x=-1.5;body.position.y=-.12;R.el.rotation.x=-.6;L.el.rotation.x=-.6;R.sh.rotation.x=-.2;L.sh.rotation.x=-.2}
      if(m==="carry"){R.sh.rotation.x=-.9;L.sh.rotation.x=-.9;R.el.rotation.x=-.9;L.el.rotation.x=-.9;R.sh.rotation.z=.2;L.sh.rotation.z=-.2}
      if(m==="idle"&&o.handsFront){R.el.rotation.x=-.35;L.el.rotation.x=-.35}}};
  F.setFace(firstFace);F.update(0);return F};

// ---------- 四位角色 ----------
window.FIGURES={
  nanny:{name:"保母 Amy",skin:0xF6CDAA,hair:"bob",hairColor:0xC3C4C7,top:0x7E1F2C,shirt:"vest",sleeve:"long",sleeveColor:0xEDA9CF,cuff2:0xF2B9D8,
    pants:0x6E7176,shoes:0x5E6166,collar:0xF2D2E6,handsFront:1,
    face:{wrinkles:1,lashes:1,blush:0,browColor:"#8A8A8A",mouth:"smile",lip:"#3A2428"}},
  friend:{name:"Linda 的朋友",skin:0xD9A070,hair:"curly",hairColor:0x3A2620,top:0xA785D2,shirt:"cardigan",sleeve:"long",cuff2:0x9877C4,
    pants:0x6F8DBC,cuff:0x86A3CC,shoes:0xF4F2EE,belt:0x5E7CAA,
    face:{lashes:1,blush:1,mouth:"smile",lip:"#7A3A32"}},
  linda:{name:"Linda",skin:0xF0C69C,hair:"longPart",hairColor:0x4A3226,top:0xE9A9A3,shirt:"shirt",sleeve:"mid",cuff2:0xF0BAB4,
    pants:0xA9BACB,cuff:0xBCCADA,shorts:1,shoes:0xEFE6D3,belt:0x93A6BA,phone:{hand:"L",color:0x2A2626},
    startFace:"tired",facePose:{tired:"tiredWave",happy:"wave"},
    faces:{tired:{tired:1,mouth:"pout",lip:"#B4473A",thickBrow:1},          // 累壞了：故事開頭求救
           happy:{lashes:1,blush:1,mouth:"grin",thickBrow:1}}},            // 精神飽滿：三天過關回來道謝
};
})();
