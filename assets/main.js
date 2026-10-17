(function(){
  // Mobile menu
  var toggle=document.querySelector('.menu-toggle'), nav=document.querySelector('.nav');
  if(toggle&&nav){
    toggle.addEventListener('click',function(){
      var open=nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded',open);
    });
    nav.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');});});
  }
  var yr=document.getElementById('year'); if(yr) yr.textContent=new Date().getFullYear();

  // Ribbon: say "tonight" on Thursdays, before the Ijtima ends
  var ij=document.getElementById('ijtimaWhen');
  if(ij){
    var wd=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Vancouver',weekday:'short'}).format(new Date());
    var hr=+new Intl.DateTimeFormat('en-CA',{timeZone:'America/Vancouver',hour:'2-digit',hour12:false}).format(new Date())%24;
    if(wd.indexOf('Thu')===0&&hr<21) ij.textContent='tonight at 7:00 PM';
  }

  var TIMES=window.FEM_TIMES||{}, JUMMAH=window.FEM_JUMMAH||[];
  var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DAYS={Sun:'Sunday',Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday',Sat:'Saturday'};

  // Current date/time in Surrey (Pacific time), whatever the visitor's device zone
  function surreyNow(){
    var parts={};
    new Intl.DateTimeFormat('en-CA',{timeZone:'America/Vancouver',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})
      .formatToParts(new Date()).forEach(function(p){parts[p.type]=p.value;});
    var h=parseInt(parts.hour,10)%24;
    return {y:+parts.year,m:+parts.month,d:+parts.day,mins:h*60+(+parts.minute)};
  }
  function toMins(t){
    var m=/(\d+):(\d+)\s*(AM|PM)/i.exec(t); if(!m) return null;
    var h=+m[1]%12; if(m[3].toUpperCase()==='PM') h+=12;
    return h*60+(+m[2]);
  }
  function key(y,m){return y+'-'+String(m).padStart(2,'0');}

  var now=surreyNow();
  var monthKey=key(now.y,now.m);
  var rows=TIMES[monthKey];
  var today=rows?rows[now.d-1]:null;

  // Prayer list for a day row: [name, adhan/start, jama'at]
  function prayers(r){
    var isFri=r[1]==='Fri';
    return [
      ['Fajr',r[2],r[3]],
      ['Sunrise',r[4],null],
      [isFri?'Jummah':'Dhuhr',r[5],isFri?JUMMAH.join(' & '):r[6],isFri?toMins(JUMMAH[0]||r[6]):null],
      ['Asr',r[7],r[8]],
      ['Maghrib',r[9],r[9]],
      ['Isha',r[10],r[11]]
    ];
  }
  function findNext(list){
    for(var i=0;i<list.length;i++){
      var p=list[i]; if(p[0]==='Sunrise') continue;
      var t=p[3]!=null?p[3]:toMins(p[2]);
      if(t!=null&&t>=now.mins) return i;
    }
    return -1;
  }

  // Home: today's card
  var list=document.getElementById('todayList');
  if(list){
    var dateEl=document.getElementById('todayDate');
    if(today){
      var ps=prayers(today), nx=findNext(ps);
      dateEl.textContent=DAYS[today[1]]+', '+now.d+' '+MONTHS[now.m-1];
      list.innerHTML=ps.map(function(p,i){
        return '<li'+(i===nx?' class="is-next"':'')+'><span class="p">'+p[0]+'</span><span class="a">'+p[1]+'</span><span class="j">'+(p[2]||'—')+'</span></li>';
      }).join('');
    }else{
      dateEl.textContent=MONTHS[now.m-1]+' '+now.y;
      list.innerHTML='<li><span class="p">This month\'s timetable is being prepared.</span></li>';
    }
  }

  // Phones: hide the bottom quick-action bar while typing in a form
  document.addEventListener('focusin',function(e){ if(e.target.matches&&e.target.matches('input:not([type=checkbox]):not([type=radio]),textarea,select')) document.body.classList.add('typing'); });
  document.addEventListener('focusout',function(){ document.body.classList.remove('typing'); });

  // Prayer Times app icon: if Apple's image can't load, show our own icon instead
  document.querySelectorAll('.app-icon-img').forEach(function (im) {
    function fail() { im.closest('.app-icon').classList.add('no-img'); }
    if (im.complete && !im.naturalWidth) fail(); else im.addEventListener('error', fail);
  });
  // Prayer Times app: show the store for this phone first
  (function () {
    var btns = document.querySelector('.app-btns'); if (!btns) return;
    var ua = navigator.userAgent || '';
    if (/android/i.test(ua)) btns.insertBefore(btns.querySelector('.store-and'), btns.firstChild);
  })();

  // Top bar: Islamic (Hijri) date / Gregorian date, Vancouver time.
  // HIJRI_ADJUST: if the Islamic date shown is a day off from the local moon-sighting
  // calendar, set this to 1 or -1 (days).
  var HIJRI_ADJUST=0;
  var tbDate=document.getElementById('tbDate');
  if(tbDate){
    var HM=['Muharram','Safar','Rabi-ul-Awwal','Rabi-ul-Aakhir','Jumada-al-Ula','Jumada-al-Ukhra','Rajab','Sha\'ban','Ramadan','Shawwal','Dhul-Qa\'dah','Dhul-Hijjah'];
    var tz='America/Vancouver', nowD=new Date();
    var greg=new Intl.DateTimeFormat('en-CA',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:tz}).format(nowD);
    var hij='';
    try{
      var parts=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{day:'numeric',month:'numeric',year:'numeric',timeZone:tz})
        .formatToParts(new Date(nowD.getTime()+HIJRI_ADJUST*864e5));
      var g={}; parts.forEach(function(x){g[x.type]=x.value;});
      var hy=parseInt(g.year,10), hm=parseInt(g.month,10), hd=parseInt(g.day,10);
      if(hy>1400&&hm>=1&&hm<=12&&hd) hij=hd+' '+HM[hm-1]+' '+hy+' AH';
    }catch(x){}
    tbDate.innerHTML=(hij?'<span class="tb-hijri">'+hij+'</span><span class="tb-sep" aria-hidden="true"> / </span>':'')+'<span class="tb-greg">'+greg+'</span>';
  }

  // Top bar: next jama'at
  var nextEl=document.getElementById('nextPrayer');
  if(nextEl){
    if(today){
      var ps2=prayers(today), n2=findNext(ps2);
      if(n2>-1){
        var p=ps2[n2];
        nextEl.innerHTML='Next: <b>'+p[0]+'</b> '+(p[2]&&p[0]!=='Jummah'?p[2]:(p[0]==='Jummah'?JUMMAH[0]:p[1]));
      }else{
        var tm=rows[now.d];
        nextEl.innerHTML=tm?'Next: <b>Fajr</b> '+tm[3]+'<span class="tmrw"> tomorrow</span>':'';
      }
    }else nextEl.textContent='';
  }


  // Copy buttons for e-Transfer emails
  document.querySelectorAll('.copy[data-copy]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var v=btn.getAttribute('data-copy');
      var orig=btn.textContent; function done(){btn.textContent='Copied';setTimeout(function(){btn.textContent=orig;},1800);}
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(v).then(done,function(){});}
    });
  });

  // Tax receipt request form
  var rf=document.getElementById('receiptForm');
  if(rf){
    var err=document.getElementById('r_err'), btn=document.getElementById('r_submit');
    var nameLab=document.getElementById('r_name_label');
    rf.querySelectorAll('input[name=donor_type]').forEach(function(r){
      r.addEventListener('change',function(){
        nameLab.firstChild.nodeValue=(r.value==='Business'?'Business name ':'Full name ');
        document.getElementById('r_name').setAttribute('autocomplete',r.value==='Business'?'organization':'name');
      });
    });
    var today=new Date().toISOString().slice(0,10); document.getElementById('r_date').max=today;
    rf.addEventListener('change',clear); rf.addEventListener('input',clear);
    function clear(e){ var el=e.target; if(el.classList) el.classList.remove('bad'); var fs=el.closest&&el.closest('fieldset'); if(fs) fs.classList.remove('bad'); err.textContent=''; }
    rf.addEventListener('submit',function(e){
      e.preventDefault(); err.textContent='';
      var bad=null;
      [].slice.call(rf.querySelectorAll('[required]')).forEach(function(el){
        var ok=el.type==='radio'?!!rf.querySelector('input[name='+el.name+']:checked'):(el.type==='checkbox'?el.checked:el.checkValidity()&&el.value.trim()!=='');
        if(!ok){ (el.type==='radio'?el.closest('fieldset'):el).classList.add('bad'); if(!bad) bad=el; }
      });
      if(bad){ err.textContent='Please fill in the highlighted fields.'; bad.focus(); return; }
      var phone=document.getElementById('r_phone').value.replace(/\D/g,'');
      if(phone.length<10){ document.getElementById('r_phone').classList.add('bad'); err.textContent='Please enter a phone number with area code.'; return; }
      if(rf.website.value){ return; }
      var cfg={}; try{ cfg=JSON.parse(rf.getAttribute('data-gform')||'{}'); }catch(x){}
      var f=cfg.f||{}, t=cfg.t||{}, url=f.action;
      var keys=['email','donor_type','name','address','phone','amount','date','donation_type','consent'];
      if(!url||keys.some(function(k){return !f[k];})){ err.textContent='This form is not connected yet. Please call '+'(778) 895-0886'+' for your receipt.'; return; }
      function key(k){ return f[k]==='emailAddress'?'emailAddress':'entry.'+String(f[k]).replace(/^entry\./,''); }
      var v=function(id){ return document.getElementById(id).value.trim(); };
      var dt=rf.querySelector('input[name=donor_type]:checked').value;
      var data=new URLSearchParams();
      data.append(key('email'),v('r_email'));
      data.append(key('donor_type'),t[dt]||dt);
      data.append(key('name'),v('r_name'));
      data.append(key('address'),v('r_address').replace(/\s*\n\s*/g,', '));
      data.append(key('phone'),v('r_phone'));
      data.append(key('amount'),v('r_amount'));
      var d=v('r_date').split('-'), dk=key('date');
      data.append(dk,d.join('-'));
      data.append(key('donation_type'),v('r_type'));
      var notes=v('r_notes'), how=v('r_method');
      if(how) notes=(notes?notes+' | ':'')+'Donated by: '+how;
      if(f.notes&&notes) data.append(key('notes'),notes);
      data.append(key('consent'),t.consent);
      btn.disabled=true; btn.textContent='Sending…';
      fetch(url,{method:'POST',mode:'no-cors',body:data}).then(function(){
        rf.querySelectorAll('.field,.consent,#r_submit,fieldset').forEach(function(el){el.hidden=true;});
        document.getElementById('r_done').hidden=false;
      }).catch(function(){
        btn.disabled=false; btn.textContent='Send receipt request';
        err.textContent='Could not send. Check your internet connection and try again.';
      });
    });
  }

  // Dua-e-Maghfirah form: 3 names in total per Thursday (first come, first served), this Thursday or next
  var mf=document.getElementById('maghForm');
  if(mf){
    var merr=document.getElementById('m_err'), mbtn=document.getElementById('m_submit');
    var wk=document.getElementById('m_week');
    function vanParts(d){var o={};new Intl.DateTimeFormat('en-CA',{timeZone:'America/Vancouver',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hour12:false,weekday:'short'}).formatToParts(d).forEach(function(p){o[p.type]=p.value;});return o;}
    var vp=vanParts(new Date());
    var base=new Date(Date.UTC(+vp.year,+vp.month-1,+vp.day));
    var dow=base.getUTCDay(), hr=+vp.hour%24;
    var add=(4-dow+7)%7; if(add===0&&hr>=17) add=7;
    for(var k=0;k<2;k++){
      var d=new Date(base.getTime()+(add+7*k)*864e5);
      var iso=d.toISOString().slice(0,10);
      var lab=(k===0&&add===0?'Tonight, ':(k===0?'This ':'Next '))+'Thursday, '+d.getUTCDate()+' '+MONTHS[d.getUTCMonth()];
      var o=document.createElement('option'); o.value=iso; o.textContent=lab; o.setAttribute('data-day','Thursday, '+d.getUTCDate()+' '+MONTHS[d.getUTCMonth()]); wk.appendChild(o);
    }
    var rows=[].slice.call(mf.querySelectorAll('.nrow')), addBtn=document.getElementById('m_add');
    // Show how many of the 3 places are left for each Thursday (all families together)
    var mleft=null, murl0=mf.getAttribute('data-endpoint');
    function fitRows(){
      if(!mleft) return;
      var n=mleft[wk.value]; if(n==null) n=3;
      rows.forEach(function(r,i){ if(i>0&&i>=n){ r.hidden=true; r.querySelectorAll('input').forEach(function(x){x.value='';}); } });
      addBtn.hidden=!rows.some(function(r,i){return r.hidden&&i<n;});
    }
    if(murl0){
      fetch(murl0+'?action=maghfirah').then(function(r){return r.json();}).then(function(res){
        mleft=res.left||{};
        [].forEach.call(wk.options,function(o){
          var n=mleft[o.value]; if(n==null) return;
          var pre=o.textContent.split(' ')[0], dd=o.getAttribute('data-day').replace('Thursday, ','').split(' ');
          o.textContent=pre+' Thu, '+dd[0]+' '+dd[1].slice(0,3)+' · '+(n<=0?'Full':n+' left');
          o.disabled=n<=0;
        });
        if(wk.options[wk.selectedIndex]&&wk.options[wk.selectedIndex].disabled){ var free=[].filter.call(wk.options,function(o){return !o.disabled;})[0]; if(free) wk.value=free.value; }
        if(![].some.call(wk.options,function(o){return !o.disabled;})){ merr.textContent='Both Thursdays are full. Please check back next week.'; mbtn.disabled=true; }
        fitRows();
      }).catch(function(){});
    }
    wk.addEventListener('change',fitRows);
    addBtn.addEventListener('click',function(){
      var next=rows.filter(function(r){return r.hidden;})[0];
      if(next){ next.hidden=false; next.querySelector('input').focus(); }
      if(!rows.some(function(r){return r.hidden;})){ addBtn.hidden=true; }
      fitRows();
    });
    function mclear(e){var el=e.target; if(el.classList) el.classList.remove('bad'); merr.textContent='';}
    mf.addEventListener('input',mclear); mf.addEventListener('change',mclear);
    mf.addEventListener('submit',function(e){
      e.preventDefault(); merr.textContent='';
      var bad=null;
      ['m_week','m_d1','m_name','m_phone'].forEach(function(id){var el=document.getElementById(id); if(!el.value.trim()){el.classList.add('bad'); if(!bad) bad=el;}});
      var em=document.getElementById('m_email'); if(em.value&&!em.checkValidity()){em.classList.add('bad'); if(!bad) bad=em;}
      if(bad){ merr.textContent='Please fill in the highlighted fields.'; bad.focus(); return; }
      if(document.getElementById('m_phone').value.replace(/\D/g,'').length<10){document.getElementById('m_phone').classList.add('bad'); merr.textContent='Please enter a phone number with area code.'; return;}
      if(mf.website.value) return;
      var url=mf.getAttribute('data-endpoint');
      if(!url){ merr.textContent='This form is not connected yet. Please call (778) 895-0886 to submit names.'; return; }
      var data=new URLSearchParams(new FormData(mf)); data.delete('website');
      mbtn.disabled=true; mbtn.textContent='Sending…';
      function fail(msg){ mbtn.disabled=false; mbtn.textContent='Submit names'; merr.textContent=msg; }
      fetch(url,{method:'POST',body:data}).then(function(r){return r.json();}).then(function(res){
        if(!res||!res.ok){ fail((res&&res.error)||'Could not submit. Please try again.'); return; }
        mf.querySelectorAll('.field,.rules,#m_submit').forEach(function(el){el.hidden=true;});
        var mt=document.getElementById('m_done_txt'); mt.textContent='They will be included in the collective dua at the Weekly Ijtima on '+wk.options[wk.selectedIndex].getAttribute('data-day')+', '; var ia=document.createElement('span'); ia.className='ar-inline'; ia.lang='ar'; ia.dir='rtl'; ia.textContent='ان شاءالله عزوجل'; mt.appendChild(ia);
        document.getElementById('m_done').hidden=false;
      }).catch(function(){ fail('Could not submit. Check your internet connection and try again, or call (778) 895-0886.'); });
    });
  }

  // Donate page: mortgage progress and Qarz-e-Hasna calculator
  var MG=window.FEM_MORTGAGE;
  if(MG&&document.getElementById('mgBar')){
    var money=function(n){return '$'+Math.round(n).toLocaleString('en-CA');};
    var owed=Math.max(0,MG.original-MG.paid), pct=MG.original?Math.min(100,MG.paid/MG.original*100):0, rate=(+MG.rate||0)/100;
    function set(id,v){var el=document.getElementById(id); if(el) el.textContent=v;}
    set('mgPct',Math.round(pct)+'%'); set('mgPaid',money(MG.paid)); set('mgOwed',money(owed)); set('mgTotal',money(MG.original));
    set('mgRate',(+MG.rate).toFixed(2).replace(/\.?0+$/,'')+'% a year');
    set('mgYearly',money(owed*rate)); set('mgMonthly',money(owed*rate/12));
    document.getElementById('mgBarPaid').style.width=pct.toFixed(1)+'%';
    document.getElementById('mgBar').setAttribute('aria-label',Math.round(pct)+'% of the mortgage paid off: '+money(MG.paid)+' paid, '+money(owed)+' still owed');
    if(MG.asOf){var p=MG.asOf.split('-'); set('mgAsOf','Figures as of '+(+p[2])+' '+MONTHS[+p[1]-1]+' '+p[0]+'.');}
    if(MG.example) document.getElementById('mgExample').hidden=false;
    var qi=document.getElementById('qAmount');
    function calc(){
      var amt=Math.max(0,parseFloat(qi.value)||0), note='';
      if(amt>owed){note='That is more than the remaining balance, so the savings below are for the full '+money(owed)+'.'; amt=owed;}
      var yr=amt*rate;
      set('qLend',money(parseFloat(qi.value)||0)); set('qYear',money(yr)); set('qMonth',money(yr/12)); set('qFive',money(yr*5));
      set('qNote',note);
      document.querySelectorAll('.q-quick button').forEach(function(bn){bn.setAttribute('aria-pressed',String(+bn.getAttribute('data-amt')===(parseFloat(qi.value)||0)));});
    }
    qi.addEventListener('input',calc);
    document.querySelectorAll('.q-quick button').forEach(function(bn){bn.addEventListener('click',function(){qi.value=bn.getAttribute('data-amt');calc();});});
    calc();
  }

  // Free tutoring registration
  var tf=document.getElementById('tutorForm'), TU=window.FEM_TUTORING;
  if(tf&&TU){
    var terr=document.getElementById('t_err'), tbtn=document.getElementById('t_submit');
    var $=function(id){return document.getElementById(id);};
    if(!TU.open) $('tutClosed').hidden=false;
    // "Another identity" reveals a describe box
    tf.querySelectorAll('select[data-other]').forEach(function(sel){
      sel.addEventListener('change',function(){var o=$(sel.getAttribute('data-other')); o.hidden=sel.value!=='Another identity'; if(o.hidden) o.value='';});
    });
    // session list: next N days in Surrey time, filtered by in person / online
    var WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var base=new Date(Date.UTC(now.y,now.m-1,now.d));
    function buildSlots(){
      var mode=$('t_mode').value, sel=$('t_slot'), keep=sel.value; sel.innerHTML='';
      var o0=document.createElement('option'); o0.value=''; o0.textContent=mode?'Choose a session':'Choose in person or online first'; sel.appendChild(o0);
      for(var k=1;k<=TU.bookAhead;k++){
        var d=new Date(base.getTime()+k*864e5), dow=d.getUTCDay(), iso=d.toISOString().slice(0,10);
        TU.sessions.forEach(function(s){
          if(s.day!==dow) return;
          if(mode&&mode!=='either'&&s.mode!==mode) return;
          if(!mode) return;
          var o=document.createElement('option'); o.value=iso+'|'+s.id;
          o.textContent=WD[dow]+' '+d.getUTCDate()+' '+MONTHS[d.getUTCMonth()]+' · '+s.start+'–'+s.end+' · '+(s.mode==='online'?'Online':'In person');
          sel.appendChild(o);
        });
      }
      if(mode&&sel.options.length===1){o0.textContent='No sessions in the next '+TU.bookAhead+' days. Please check again soon.';}
      if(keep) sel.value=keep;
      var cam=mode==='in-person'||mode==='either'; $('t_camreq').hidden=!cam; $('t_ccam').required=cam;
    }
    $('t_mode').addEventListener('change',buildSlots); buildSlots();
    if(TU.example) $('t_slothint').textContent+=' (Session times shown are examples until the program opens.)';
    $('t_tutor').addEventListener('change',function(){$('t_femnote').hidden=this.value!=='Female tutor';});
    // photos: up to 5, resized in the browser to keep uploads small
    var photos=[], thumbs=$('t_thumbs');
    function drawThumbs(){
      thumbs.innerHTML='';
      photos.forEach(function(p,i){
        var li=document.createElement('li'); li.innerHTML='<img alt="" src="data:image/jpeg;base64,'+p.data+'"><button type="button" aria-label="Remove photo '+(i+1)+'">×</button>';
        li.querySelector('button').addEventListener('click',function(){photos.splice(i,1);drawThumbs();});
        thumbs.appendChild(li);
      });
    }
    $('t_photos').addEventListener('change',function(){
      var files=[].slice.call(this.files||[]); this.value='';
      files.slice(0,Math.max(0,5-photos.length)).forEach(function(f){
        if(!/^image\//.test(f.type)) return;
        var rd=new FileReader(); rd.onload=function(){
          var img=new Image(); img.onload=function(){
            var sc=Math.min(1,1600/Math.max(img.width,img.height)), c=document.createElement('canvas');
            c.width=Math.round(img.width*sc); c.height=Math.round(img.height*sc);
            c.getContext('2d').drawImage(img,0,0,c.width,c.height);
            photos.push({name:f.name.replace(/[^\w.\- ]/g,'').slice(0,60)||'photo.jpg',data:c.toDataURL('image/jpeg',0.82).split(',')[1]}); drawThumbs();
          }; img.src=rd.result;
        }; rd.readAsDataURL(f);
      });
      if(files.length+photos.length>5){terr.textContent='You can send up to 5 photos.';}
    });
    function tclear(e){var el=e.target; if(el.classList) el.classList.remove('bad'); var fs=el.closest&&el.closest('.checks'); if(fs) fs.classList.remove('bad'); terr.textContent='';}
    tf.addEventListener('input',tclear); tf.addEventListener('change',tclear);
    function norm(s){return String(s||'').trim().replace(/\s+/g,' ').toLowerCase();}
    tf.addEventListener('submit',function(e){
      e.preventDefault(); terr.textContent='';
      var bad=null;
      tf.querySelectorAll('[required]').forEach(function(el){
        var ok=el.type==='checkbox'?el.checked:(el.value.trim()!==''&&el.checkValidity());
        if(!ok){(el.type==='checkbox'?el.closest('label'):el).classList.add('bad'); if(!bad) bad=el;}
      });
      if(!tf.querySelector('input[name=subjects]:checked')){$('t_subjects').classList.add('bad'); if(!bad) bad=$('t_subjects').querySelector('input');}
      if(bad){terr.textContent='Please fill in the highlighted fields.'; bad.focus(); return;}
      var ph=['t_pphone','t_e1p','t_e2p'].filter(function(id){return $(id).value.replace(/\D/g,'').length<10;});
      if(ph.length){ph.forEach(function(id){$(id).classList.add('bad');}); terr.textContent='Please enter phone numbers with the area code.'; $(ph[0]).focus(); return;}
      var dob=new Date($('t_cdob').value+'T12:00:00'), age=(Date.now()-dob)/31557600000;
      if(!(age>=5&&age<=16)){$('t_cdob').classList.add('bad'); terr.textContent='Please check the date of birth. The program is for Grades 2 to 8.'; return;}
      if(norm($('t_sig').value)!==norm($('t_pname').value)){$('t_sig').classList.add('bad'); terr.textContent='Your signature must match the parent or guardian name exactly.'; $('t_sig').focus(); return;}
      if(tf.website.value) return;
      if(!TU.open){terr.textContent='Registrations are not open yet. Please check back soon, or call (778) 895-0886.'; return;}
      var url=tf.getAttribute('data-endpoint');
      if(!url){terr.textContent='This form is not connected yet. Please call (778) 895-0886.'; return;}
      var fd=new FormData(tf), data=new URLSearchParams();
      fd.forEach(function(v,k){ if(k==='subjects'||k==='website') return; data.append(k,v); });
      data.append('subjects',[].slice.call(tf.querySelectorAll('input[name=subjects]:checked')).map(function(c){return c.value;}).join(', '));
      photos.forEach(function(p,i){data.append('photo_'+(i+1),p.data); data.append('photo_'+(i+1)+'_name',p.name);});
      data.append('photo_count',String(photos.length));
      tbtn.disabled=true; tbtn.textContent='Sending…';
      function fail(msg){tbtn.disabled=false; tbtn.textContent='Send registration and hold my date'; terr.textContent=msg;}
      fetch(url,{method:'POST',body:data}).then(function(r){return r.json();}).then(function(res){
        if(!res||!res.ok){fail((res&&res.error)||'Could not send. Please try again.'); return;}
        tf.querySelectorAll('fieldset,#t_submit').forEach(function(el){el.hidden=true;});
        var opt=$('t_slot').options[$('t_slot').selectedIndex];
        $('t_done_txt').textContent='Reference '+(res.ref||'')+'. Your request for '+(opt?opt.textContent:'your session')+' is on hold. Your session is not booked until you receive our confirmation email.';
        $('t_done').hidden=false; $('t_done').scrollIntoView({behavior:'smooth',block:'center'});
      }).catch(function(){fail('Could not send. Check your internet connection and try again, or call (778) 895-0886.');});
    });
  }

  // Canada map (computer version and phone version): filters and selected-location panel
  (function () {
    var maps = document.querySelectorAll('.canadamap');
    if (!maps.length) return;
    var pins = document.querySelectorAll('.canadamap .cm-pin[data-name]');
    var nameEl = document.getElementById('wmName'), placeEl = document.getElementById('wmPlace'),
        infoEl = document.getElementById('wmInfo'), srcEl = document.getElementById('wmSrc'),
        srcLink = document.getElementById('wmSrcLink');
    var listBtns = document.querySelectorAll('.wm-list button, .dum-show');
    function show(el, fromMap) {
      if (!el || !nameEl) return;
      var n = el.getAttribute('data-name');
      pins.forEach(function (p) { p.classList.toggle('is-sel', p.getAttribute('data-name') === n); });
      listBtns.forEach(function (b) { b.classList.toggle('is-sel', (b.getAttribute('data-pick') || b.getAttribute('data-name')) === n); });
      nameEl.textContent = n;
      placeEl.textContent = el.getAttribute('data-place') || '';
      infoEl.textContent = el.getAttribute('data-info') || '';
      var src = el.getAttribute('data-src');
      srcEl.hidden = !src;
      if (src) srcLink.href = src;
      // On phones, bring the details box into view after tapping a pin
      if (fromMap && window.innerWidth <= 760) {
        var box = document.getElementById('wmDetail'), r = box.getBoundingClientRect();
        if (r.top > window.innerHeight - 120 || r.bottom < 0) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    function filt(f) {
      document.querySelectorAll('.canadamap .cm-pin,.canadamap .cm-arc,.canadamap .cm-tag,.canadamap .cm-comet').forEach(function (el) {
        var home = el.classList.contains('cm-home') || el.classList.contains('cm-tag-home');
        el.classList.toggle('is-off', f !== 'all' && !home && el.getAttribute('data-type') !== f);
      });
      document.querySelectorAll('.wm-filters [data-filter]').forEach(function (b) {
        var on = b.getAttribute('data-filter') === f;
        b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    pins.forEach(function (g) {
      g.addEventListener('click', function () { show(g, true); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(g, true); } });
    });
    document.querySelectorAll('.wm-filters [data-filter]').forEach(function (b) {
      b.addEventListener('click', function () { filt(b.getAttribute('data-filter')); });
    });
    listBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var n = b.getAttribute('data-pick');
        if (!n) { var wt = document.getElementById('tab-wd'); if (wt) openTab(wt); show(b); return; }
        var ct = document.getElementById('tab-ca'); if (ct && ct.getAttribute('aria-selected') !== 'true' && document.getElementById('tab-wd').getAttribute('aria-selected') === 'true') openTab(ct);
        filt('all');
        var vis = document.querySelector('.cm-frame:not([hidden])');
        if (vis && !vis.querySelector('.cm-pin[data-name="' + n.replace(/"/g, '') + '"]')) { var nt = document.getElementById('tab-na'); if (nt) { openTab(nt); vis = document.getElementById('map-na'); } }
        var g = null; (vis || document).querySelectorAll('.cm-pin[data-name]').forEach(function (p) { if (!g && p.getAttribute('data-name') === n) g = p; });
        if (!g) pins.forEach(function (p) { if (!g && p.getAttribute('data-name') === n) g = p; });
        show(g);
      });
    });
    // Respect "reduce motion": stop the travelling dots
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      maps.forEach(function (m) { if (m.pauseAnimations) m.pauseAnimations(); });
    }
    // Start the animation when the map scrolls into view, not on page load
    if ('IntersectionObserver' in window) {
      maps.forEach(function (m) {
        m.classList.add('cm-wait');
        if (m.pauseAnimations) m.pauseAnimations();
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) { m.classList.remove('cm-wait'); if (m.setCurrentTime) m.setCurrentTime(0); if (m.unpauseAnimations && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) m.unpauseAnimations(); io.disconnect(); }
          });
        }, { threshold: 0.25 });
        io.observe(m);
      });
    }
    // Map tabs: Canada / North America / World
    var tabs = document.querySelectorAll('.cm-tabs [role=tab]');
    var heading = document.getElementById('cmHeading'), filters = document.querySelector('.wm-filters');
    function openTab(btn, focus) {
      tabs.forEach(function (b) {
        var on = b === btn, panel = document.getElementById(b.getAttribute('aria-controls'));
        b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
        panel.hidden = !on;
        if (on) panel.querySelectorAll('.canadamap').forEach(function (m) { if (m.setCurrentTime && !m.classList.contains('cm-wait')) m.setCurrentTime(0); });
      });
      if (heading) heading.textContent = btn.getAttribute('data-title');
      var world = btn.getAttribute('data-map') === 'wd';
      if (filters) filters.hidden = world;
      filt('all');
      if (world) show(document.querySelector('#map-wd .cm-hq'));
      if (focus) btn.focus();
    }
    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () { openTab(b); });
      b.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (k) { e.preventDefault(); openTab(tabs[(i + k + tabs.length) % tabs.length], true); }
      });
    });
    show(document.querySelector('.canadamap .cm-home'));
  })();

  // Past events archive: newest first, filter by year, audience and place
  (function () {
    var list = document.getElementById('pastList');
    if (!list) return;
    var all = (window.FEM_PAST_EVENTS || []).filter(function (e) { return e && /^\d{4}-\d{2}-\d{2}$/.test(e.date); })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    document.getElementById('pastExample').hidden = !window.FEM_PAST_EVENTS_EXAMPLE;
    var M = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var AUD = { family: 'Family', brothers: 'Brothers', sisters: 'Sisters' };
    var f = { year: 'all', aud: 'all', place: 'all' };
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    var years = []; all.forEach(function (e) { var y = e.date.slice(0, 4); if (years.indexOf(y) < 0) years.push(y); });
    var yb = document.getElementById('pastYears');
    yb.innerHTML = '<button type="button" class="is-on" data-year="all" aria-pressed="true">All years</button>' +
      years.map(function (y) { return '<button type="button" data-year="' + y + '" aria-pressed="false">' + y + '</button>'; }).join('');
    function stats(items) {
      var c = { family: 0, brothers: 0, sisters: 0 }, ys = {};
      items.forEach(function (e) { c[e.audience] = (c[e.audience] || 0) + 1; ys[e.date.slice(0, 4)] = 1; });
      document.getElementById('pastStats').innerHTML =
        '<li class="big"><b>' + items.length + '</b><span>' + (items.length === 1 ? 'event' : 'events') + '</span></li>' +
        '<li class="big"><b>' + Object.keys(ys).length + '</b><span>' + (Object.keys(ys).length === 1 ? 'year' : 'years') + '</span></li>' +
        '<li><b>' + c.family + '</b><span>family</span></li><li><b>' + c.brothers + '</b><span>brothers</span></li>' +
        '<li class="pink"><b>' + c.sisters + '</b><span>sisters</span></li>';
    }
    function render() {
      var items = all.filter(function (e) {
        return (f.year === 'all' || e.date.slice(0, 4) === f.year) && (f.aud === 'all' || e.audience === f.aud) &&
          (f.place === 'all' || (f.place === 'fem' ? e.place === 'fem' : e.place !== 'fem'));
      });
      stats(items);
      if (!items.length) { list.innerHTML = '<div class="past-empty"><b>No events match these filters.</b><p>Try another year or filter.</p></div>'; return; }
      var html = '', lastY = '', lastM = '';
      items.forEach(function (e) {
        var y = e.date.slice(0, 4), m = +e.date.slice(5, 7) - 1, d = +e.date.slice(8, 10);
        if (y !== lastY) { if (lastY) html += '</ol></section>'; html += '<section class="past-year"><h2>' + y + '</h2><ol class="past-tl">'; lastY = y; lastM = ''; }
        if (M[m] !== lastM) { html += '<li class="past-month">' + M[m] + '</li>'; lastM = M[m]; }
        var fem = e.place === 'fem', aud = AUD[e.audience] ? e.audience : 'family';
        html += '<li class="past-ev past-' + aud + '"><div class="past-date"><b>' + d + '</b><span>' + M[m].slice(0, 3) + '</span></div><div class="past-body">' +
          '<h3>' + esc(e.title) + '</h3><p class="past-tags"><span class="past-aud">' + AUD[aud] + (aud === 'family' ? '' : ' only') + '</span>' +
          '<span class="past-place">' + (fem ? 'Faizan e Madina Vancouver' : esc(e.place) + (e.address ? ', ' + esc(e.address) : '')) + '</span>' +
          (e.attended ? '<span class="past-count">' + esc(e.attended) + ' attended</span>' : '') + '</p>' +
          (e.details ? '<p class="past-details">' + esc(e.details) + '</p>' : '') +
          (e.photo && aud !== 'sisters' ? '<img src="assets/past-events/' + esc(e.photo) + '" alt="' + esc(e.title) + '" loading="lazy">' : '') +
          '</div></li>';
      });
      list.innerHTML = html + '</ol></section>';
    }
    document.querySelector('.past-filters').addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      var key = b.hasAttribute('data-year') ? 'year' : b.hasAttribute('data-aud') ? 'aud' : 'place';
      f[key] = b.getAttribute('data-' + key);
      b.parentNode.querySelectorAll('button').forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      render();
    });
    render();
  })();

  // Events: flyers from assets/events.js, upcoming only, soonest first
  var grid=document.getElementById('eventsGrid');
  if(grid){
    var today0=key(now.y,now.m)+'-'+String(now.d).padStart(2,'0');
    var all=(window.FEM_EVENTS||[]).filter(function(e){return e;});
    var dated=all.filter(function(e){return !e.ongoing&&e.date&&e.date>=today0;})
      .sort(function(a,b){return a.date<b.date?-1:1;});
    var evs=dated.concat(all.filter(function(e){return e.ongoing;}));
    var lim=+grid.getAttribute('data-limit')||0; if(lim) evs=evs.slice(0,lim);
    function esc(x){return String(x||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
    function nice(d){var p=d.split('-');var dt=new Date(+p[0],+p[1]-1,+p[2]);
      return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dt.getDay()]+', '+(+p[2])+' '+MONTHS[+p[1]-1];}
    if(evs.length){
      grid.innerHTML=evs.map(function(e){
        var src='assets/events/'+encodeURIComponent(e.image||'');
        return '<article class="event"><a class="flyer" href="'+src+'" target="_blank" rel="noopener"><img src="'+src+'" alt="Flyer: '+esc(e.title)+'" loading="lazy"></a>'+
          '<div class="event-body"><p class="event-date">'+(e.ongoing?esc(e.when||'Ongoing'):nice(e.date))+(e.time?' · '+esc(e.time):'')+'</p><h3>'+esc(e.title)+'</h3>'+(e.details?'<p>'+esc(e.details)+'</p>':'')+'</div></article>';
      }).join('');
    }else{
      grid.innerHTML='<div class="events-empty"><p><b>No upcoming events posted right now.</b></p><p>Join us every Thursday at 7:00 PM for the Weekly Ijtima.</p></div>';
      grid.classList.add('is-empty');
    }
  }
  // Prayer times page: Today/Tomorrow day table, countdown, monthly table
  var tbody=document.getElementById('rows');
  if(tbody){
    var months=Object.keys(TIMES).sort();
    var mk=TIMES[monthKey]?monthKey:months[months.length-1];
    var data=TIMES[mk], y=+mk.slice(0,4), m=+mk.slice(5,7);
    document.querySelectorAll('[data-month]').forEach(function(el){el.textContent=MONTHS[m-1]+' '+y;});
    tbody.innerHTML=data.map(function(r,i){
      return '<tr data-i="'+i+'" tabindex="0"'+(r[1]==='Fri'?' class="is-fri"':'')+'><td>'+r[0]+' '+MONTHS[m-1].slice(0,3)+'</td><td>'+r[1]+'</td>'+r.slice(2).map(function(v){return '<td>'+v+'</td>';}).join('')+'</tr>';
    }).join('');
    var trs=[].slice.call(tbody.querySelectorAll('tr'));
    // Phone version: fits the screen (no sideways scrolling), adhan small + iqamah bold in one cell
    var tbodyM=document.getElementById('rowsM'), trsM=[];
    if(tbodyM){
      var hm=function(v){var m=/^(.*?)\s?([AP]M)$/i.exec(String(v||''));return m?m[1]+'<small>'+m[2].toUpperCase()+'</small>':String(v||'');};
      var cell=function(a,q){return '<td><span class="a">'+hm(a)+'</span><b>'+hm(q)+'</b></td>';};
      tbodyM.innerHTML=data.map(function(r,i){
        return '<tr data-i="'+i+'" tabindex="0"'+(r[1]==='Fri'?' class="is-fri"':'')+'><th scope="row"><b>'+(+r[0])+'</b><span>'+r[1]+'</span></th>'
          +cell(r[2],r[3])+cell(r[5],r[6])+cell(r[7],r[8])+cell(r[9],r[9])+cell(r[10],r[11])+'</tr>';
      }).join('');
      trsM=[].slice.call(tbodyM.querySelectorAll('tr'));
    }
    function mark(i,on){ if(trs[i]) trs[i].classList.toggle('active',on); if(trsM[i]) trsM[i].classList.toggle('active',on); }
    var dayRows=document.getElementById('dayRows'), dayTitle=document.getElementById('dayTitle');
    var tabT=document.getElementById('tabToday'), tabN=document.getElementById('tabTomorrow');

    // a day's row, by key "YYYY-MM" and day number, or null
    function rowFor(y2,m2,d2){var r=TIMES[key(y2,m2)]; return r?r[d2-1]||null:null;}
    function addDays(y2,m2,d2,n){var dt=new Date(Date.UTC(y2,m2-1,d2)+n*864e5);return {y:dt.getUTCFullYear(),m:dt.getUTCMonth()+1,d:dt.getUTCDate()};}
    var tmr=addDays(now.y,now.m,now.d,1), tmrRow=rowFor(tmr.y,tmr.m,tmr.d);
    if(!tmrRow){tabN.disabled=true; tabN.title='Next month\'s timetable is not published yet';}

    function render(r,yy,mm,label){
      if(!r){dayTitle.textContent=label; dayRows.innerHTML='<tr><td colspan="3">This timetable is being prepared.</td></tr>'; return;}
      dayTitle.textContent=DAYS[r[1]]+', '+(+r[0])+' '+MONTHS[mm-1]+' '+yy;
      var isFri=r[1]==='Fri';
      var list=[['Fajr',r[2],r[3]],['Sunrise',r[4],null],['Dhuhr',r[5],r[6]],['Asr',r[7],r[8]],['Maghrib',r[9],r[9]],['Isha',r[10],r[11]]];
      var html=list.map(function(p){
        if(p[0]==='Sunrise') return '<tr class="sun"><th scope="row">Sunrise</th><td colspan="2">'+p[1]+'</td></tr>';
        return '<tr><th scope="row">'+p[0]+'</th><td>'+p[1]+'</td><td class="iq">'+p[2]+'</td></tr>';
      }).join('');
      html+='<tr class="jumrow'+(isFri?' is-today':'')+'"><th scope="row">Jummah</th><td colspan="2"><span class="jl">Jummah 1:</span> <b>'+(JUMMAH[0]||'')+'</b><br><span class="jl">Jummah 2:</span> <b>'+(JUMMAH[1]||'')+'</b></td></tr>';
      dayRows.innerHTML=html;
    }
    function setTab(which){
      tabT.setAttribute('aria-selected',which==='today'); tabN.setAttribute('aria-selected',which==='tomorrow');
      trs.forEach(function(r,i){mark(i,false);});
    }
    function showToday(){ setTab('today'); render(today,now.y,now.m,MONTHS[now.m-1]+' '+now.y); if(mk===monthKey&&trs[now.d-1]) mark(now.d-1,true); }
    function showTomorrow(){ if(tabN.disabled) return; setTab('tomorrow'); render(tmrRow,tmr.y,tmr.m,''); if(key(tmr.y,tmr.m)===mk&&trs[tmr.d-1]) mark(tmr.d-1,true); }
    tabT.addEventListener('click',showToday); tabN.addEventListener('click',showTomorrow);
    function pick(i){
      setTab('none'); mark(i,true); render(data[i],y,m,'');
      document.querySelector('.daycard').scrollIntoView({behavior:'smooth',block:'start'});
    }
    // Monthly table: highlight today's row
    (function(){
      var wrap=tbody.closest('.table-wrap'); if(!wrap||mk!==monthKey||!trs[now.d-1]) return;
      var row=trs[now.d-1], head=wrap.querySelector('thead');
      row.classList.add('is-today-row');   // past days are hidden below, so today is already near the top
    })();
    // Only show the last 2 days, today and the rest of the month (earlier days are hidden behind a button)
    (function(){
      var hdr=document.querySelector('.site-header');
      function setStick(){ document.documentElement.style.setProperty('--pt-stick',(hdr?hdr.getBoundingClientRect().height:0)+'px'); }
      setStick(); window.addEventListener('resize',setStick);
      if(mk!==monthKey) return;
      if(trsM[now.d-1]) trsM[now.d-1].classList.add('is-today-row');
      var cut=now.d-3, eb=document.getElementById('ptEarlier');   // rows before this index are hidden
      if(cut<1||!eb) return;
      function hide(on){
        for(var i=0;i<cut;i++){ if(trs[i]) trs[i].hidden=on; if(trsM[i]) trsM[i].hidden=on; }
        eb.setAttribute('aria-expanded',on?'false':'true');
        eb.querySelector('span').textContent=on?'Show earlier days (1–'+cut+' '+MONTHS[m-1].slice(0,3)+')':'Hide earlier days';
        eb.classList.toggle('open',!on);
      }
      hide(true); eb.hidden=false;
      eb.addEventListener('click',function(){ hide(eb.getAttribute('aria-expanded')==='true'); });
    })();
    trsM.forEach(function(r,i){
      r.addEventListener('click',function(){pick(i);});
      r.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(i);}});
    });
    trs.forEach(function(r,i){
      r.addEventListener('click',function(){pick(i);});
      r.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(i);}});
    });

    // countdown to the next adhan (Surrey time)
    var cd=document.getElementById('countdown');
    function tick(){
      var n2=surreyNow(), secs=new Date().getSeconds();
      var r0=rowFor(n2.y,n2.m,n2.d), target=null, name='';
      if(r0){
        var adh=[['Fajr',r0[2]],[r0[1]==='Fri'?'Jummah':'Dhuhr',r0[5]],['Asr',r0[7]],['Maghrib',r0[9]],['Isha',r0[10]]];
        for(var k=0;k<adh.length;k++){var mins=toMins(adh[k][1]); if(mins!=null&&mins>n2.mins){target=mins;name=adh[k][0];var at=adh[k][1];break;}}
      }
      if(target==null){
        var t2=addDays(n2.y,n2.m,n2.d,1), r1=rowFor(t2.y,t2.m,t2.d);
        if(r1){target=toMins(r1[2])+1440; name='Fajr'; var at=r1[2];}
      }
      if(target==null){cd.hidden=true; return;}
      var left=(target-n2.mins)*60-secs; if(left<0) left=0;
      var h=Math.floor(left/3600), mi=Math.floor(left%3600/60), s=left%60;
      function pad(x){return String(x).padStart(2,'0');}
      cd.innerHTML='<span>'+name+' Adhan in</span><b>'+pad(h)+'h '+pad(mi)+'m '+pad(s)+'s</b><span class="at">'+at+'</span>';
      cd.hidden=false;
    }
    tick(); setInterval(tick,1000);

    document.getElementById('shareBtn').addEventListener('click',function(){
      var sh={title:'Faizan e Madina Vancouver prayer times',url:location.href};
      if(navigator.share){navigator.share(sh).catch(function(){});}
      else if(navigator.clipboard){navigator.clipboard.writeText(location.href).catch(function(){});}
    });
    showToday();
  }
  // ===== Home page slideshow (content lives in assets/slides.js) =====
  function initPromo(root){
    if(!root||!window.FEM_SLIDES) return;
    var track=root.querySelector('.promo-track'), dotsEl=root.querySelector('.promo-dots');
    function esc(x){return String(x==null?'':x).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
    function nb(x){return esc(x).replace(/(\w)-(?=\w)/g,'$1\u2011');}
    var tz='America/Vancouver';
    var today=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:tz}).format(new Date());

    function hijri(){
      try{
        var p=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{month:'numeric',year:'numeric',timeZone:tz})
          .formatToParts(new Date(Date.now()+HIJRI_ADJUST*864e5)), g={};
        p.forEach(function(x){g[x.type]=x.value;});
        var m=parseInt(g.month,10), y=parseInt(g.year,10);
        if(m>=1&&m<=12&&y>1400) return {m:m,y:y};
      }catch(e){}
      return null;
    }

    var LEAF='M201 232l-13.3 4.4 61.4 54c4.7 13.7-1.6 17.8-5.6 25l66.6-8.4-1.6 67 13.9-.3-3.1-66.6 66.7 8c-4.1-8.7-7.8-13.3-4-27.2l61.3-51-10.7-4c-8.8-6.8 3.8-32.6 5.6-48.9 0 0-35.7 12.3-38 5.8l-9.2-17.5-32.6 35.8c-3.5.9-5-.5-5.9-3.5l15-74.8-23.8 13.4c-2 .9-4 .1-5.2-2.2l-23-46-23.6 47.8c-1.8 1.7-3.6 1.9-5 .7L264 130.8l13.7 74.1c-1.1 3-3.7 3.8-6.7 2.2l-31.2-35.3c-4 6.5-6.8 17.1-12.2 19.5-5.4 2.3-23.5-4.5-35.6-7 4.2 14.8 17 39.6 9 47.7';
    function stars(n,seed){var s='',r=seed;for(var i=0;i<n;i++){r=(r*9301+49297)%233280;var x=r/233280*400;r=(r*9301+49297)%233280;var y=r/233280*300;r=(r*9301+49297)%233280;s+='<circle class="tw" style="animation-delay:'+(r/233280*4).toFixed(2)+'s" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(i%4?1.1:1.8)+'"/>';}return s;}
    function mosques(){
      var d='';
      [[70,70,40],[250,110,54],[420,80,44],[600,120,58],[760,70,38]].forEach(function(m){
        var x=m[0],w=m[1],h=m[2],wt=60-h*.42;
        d+='M'+(x-w/2)+' 60V'+wt+'C'+(x-w/2)+' '+(wt-h*.32)+' '+(x-w*.1)+' '+(60-h*.82)+' '+x+' '+(60-h)+'C'+(x+w*.1)+' '+(60-h*.82)+' '+(x+w/2)+' '+(wt-h*.32)+' '+(x+w/2)+' '+wt+'V60Z';
        var mx=x+w/2+10; d+='M'+mx+' 60V'+(60-h*1.15)+'l4-7 4 7V60Z';
      });
      return '<svg class="ps-domes" viewBox="0 0 800 60" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path d="'+d+'"/></svg>';
    }
    var WAVE1='M70 60C130 46 190 74 250 60C290 51 320 56 350 62L350 202C320 196 290 191 250 200C190 214 130 186 70 200Z';
    var WAVE2='M70 60C130 72 190 48 250 62C290 71 320 66 350 58L350 198C320 206 290 211 250 202C190 188 130 212 70 200Z';
    var ART={
      canada:function(){return '<svg class="ps-flagsvg" viewBox="0 0 400 300" aria-hidden="true"><defs><clipPath id="psFlagClip"><path d="'+WAVE1+'"><animate attributeName="d" dur="4s" repeatCount="indefinite" values="'+WAVE1+';'+WAVE2+';'+WAVE1+'" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/></path></clipPath>'
        +'<linearGradient id="psFlagShade" x1="0" x2="1" y1="0" y2="0" spreadMethod="repeat"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity=".16"/><animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="-1 0" dur="4s" repeatCount="indefinite"/></linearGradient></defs>'
        +'<rect class="ps-pole" x="60" y="44" width="8" height="250" rx="4"/><circle class="ps-finial" cx="64" cy="40" r="8"/>'
        +'<g clip-path="url(#psFlagClip)"><rect x="60" y="30" width="300" height="190" fill="#fff"/><rect x="60" y="30" width="80" height="190" fill="#d52b1e"/><rect x="280" y="30" width="80" height="190" fill="#d52b1e"/>'
        +'<path fill="#d52b1e" transform="translate(76.6 30.4) scale(.415)" d="'+LEAF+'"/><rect x="60" y="30" width="300" height="190" fill="url(#psFlagShade)" transform="scale(1 1)"/></g></svg>';},
      month:function(s){return '<svg class="ps-sky" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="#f3e6b0">'+stars(34,7)+'</g></svg>'
        +'<svg class="ps-moon" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="#f3d27a"/><circle cx="66" cy="38" r="36" fill="#0b2f3a"/></svg>'
        +(s._arabic?'<p class="ps-arabic" lang="ar" dir="rtl">'+esc(s._arabic)+'</p>':'')+mosques();},
      guest:function(s,i){
        var v=s.variant||'flag', img=(s.cutout?'<img class="ps-cutout" src="assets/slides/'+esc(s.cutout)+'" alt="'+esc(s.cutoutAlt||'')+'"'+(i?' loading="lazy"':'')+'>':'');
        var leafSvg=function(c){return '<svg class="'+c+'" viewBox="180 100 280 290" aria-hidden="true"><path d="'+LEAF+'"/></svg>';};
        if(v==='arch') return '<div class="pv-pattern"></div><svg class="pv-arch" viewBox="0 0 300 400" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs><linearGradient id="pvArchG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d27a"/><stop offset="1" stop-color="#9a7a12"/></linearGradient><radialGradient id="pvArchF" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#16594a"/><stop offset="1" stop-color="#062b25"/></radialGradient></defs>'
          +'<path d="M20 400V170C20 90 90 40 150 10C210 40 280 90 280 170V400z" fill="url(#pvArchF)" stroke="url(#pvArchG)" stroke-width="5"/><path d="M38 400V176C38 104 98 60 150 34C202 60 262 104 262 176V400" fill="none" stroke="rgba(243,210,122,.35)" stroke-width="1.5"/></svg>'
          +'<div class="pv-archglow"></div>'+leafSvg('pv-key')+img;
        if(v==='red') return '<div class="pv-redband"></div>'+leafSvg('pv-bigleaf')+'<div class="pv-redglow"></div>'+img;
        if(v==='light') return '<div class="pv-disc"><span class="pv-ring"></span><span class="pv-flagribbon"><i></i><i></i><i></i></span></div>'+img;
        var leaves='';
        [[12,0,1],[38,3.5,.7],[64,1.6,.9],[86,5.2,.6],[24,7,.8],[74,8.4,.65]].forEach(function(l){
          leaves+='<svg class="ps-leaf" style="left:'+l[0]+'%;animation-delay:-'+l[1]+'s;--s:'+l[2]+'" viewBox="180 100 280 290" aria-hidden="true"><path d="'+LEAF+'"/></svg>';});
        return '<div class="ps-bigflag"><svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><filter id="psCloth" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.0025 0.009" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="22"/></filter></defs>'
          +'<g><rect x="-60" y="-60" width="720" height="520" fill="#fff"/><rect x="-60" y="-60" width="210" height="520" fill="#d52b1e"/><rect x="450" y="-60" width="210" height="520" fill="#d52b1e"/>'
          +'<path fill="#d52b1e" transform="translate(300 200) scale(.78) translate(-320 -240)" d="'+LEAF+'"/></g></svg><span class="ps-folds"></span></div>'
          +'<div class="ps-leaves">'+leaves+'</div><div class="ps-glow"></div>'
          +(s.cutout?'<img class="ps-cutout" src="assets/slides/'+esc(s.cutout)+'" alt="'+esc(s.cutoutAlt||'')+'"'+(i?' loading="lazy"':'')+'>':'');},
      relief:function(){return '<svg class="ps-icon" viewBox="0 0 200 200" aria-hidden="true"><circle class="ps-ring r1" cx="100" cy="100" r="92"/><circle class="ps-ring r2" cx="100" cy="100" r="70"/><g class="ps-spark"><circle cx="64" cy="70" r="2.5"/><circle cx="140" cy="60" r="2"/><circle cx="150" cy="96" r="2.5"/><circle cx="52" cy="104" r="2"/></g><path class="ps-heart" d="M100 116s-30-18-30-39a16 16 0 0 1 30-8 16 16 0 0 1 30 8c0 21-30 39-30 39z"/><path class="ps-hands" d="M40 112c8 0 14 6 20 14 8 10 18 16 30 18h20c12-2 22-8 30-18 6-8 12-14 20-14-2 22-14 40-34 48-8 3-14 4-16 4s-8-1-16-4c-20-8-32-26-34-48z"/><path class="ps-handline" d="M100 146v18"/></svg>';},
      academy:function(){return '<svg class="ps-icon" viewBox="0 0 200 200" aria-hidden="true"><rect class="ps-screen" x="34" y="40" width="132" height="88" rx="8"/><path class="ps-base" d="M22 140h156l-10 14H32z"/><path class="ps-book" d="M100 66c-12-8-26-8-38-4v44c12-4 26-4 38 4 12-8 26-8 38-4V62c-12-4-26-4-38 4zm0 0v44"/><circle class="ps-live" cx="152" cy="52" r="5"/></svg>';},
      green:function(){return '<svg class="ps-icon" viewBox="0 0 200 200" aria-hidden="true"><circle class="ps-ring r1" cx="100" cy="100" r="80"/><path class="ps-star" d="M100 40l14 32 32 14-32 14-14 32-14-32-32-14 32-14z"/></svg>';}
    };

    var list=window.FEM_SLIDES.filter(function(s){
      return s && (!s.from||today>=s.from) && (!s.until||today<=s.until);
    }).map(function(s){
      var o={}; for(var k in s) o[k]=s[k];
      if(o.style==='month'){
        var h=hijri(), M=h&&window.FEM_MONTHS&&window.FEM_MONTHS[h.m];
        if(!M&&!o.title) return null;
        if(M){
          o.kicker=o.kicker||('This Islamic month · '+h.y+' AH');
          o.title=o.title||('The blessings of '+M.name.replace(/-/g,'\u2011'));
          o.text=o.text||M.text;
          o._arabic=M.arabic;
        }
      }
      return o;
    }).filter(Boolean);
    if(root.dataset.variant){
      list=window.FEM_SLIDES.filter(function(s){return s&&s.style==='guest';}).map(function(s){var o={};for(var k in s)o[k]=s[k];o.variant=root.dataset.variant;return o;});
    }
    if(!list.length){root.hidden=true;return;}

    var n=list.length;
    track.innerHTML=list.map(function(s,i){
      var ext=/^https?:/i.test(s.link||''), style=ART[s.style]?s.style:'green';
      var photo=s.photo?'<span class="ps-photo"><img src="assets/slides/'+esc(s.photo)+'" alt="'+esc(s.photoAlt||'')+'"'+(i?' loading="lazy"':'')+'></span>':'';
      if(s.banner){   // an official banner: whole banner on computers, banner + words on phones
        var bsrc='assets/slides/'+esc(s.banner), lazy=i?' loading="lazy"':'';
        var bin='<div class="pb-img"><img class="pb-blur" src="'+bsrc+'" alt=""'+lazy+'><img class="pb-main" src="'+bsrc+'" alt="'+esc(s.bannerAlt||s.title||'')+'"'+lazy+'></div><div class="ps-body">'
          +(s.kicker?'<p class="ps-kicker">'+nb(s.kicker)+'</p>':'')+'<h2 class="ps-title">'+nb(s.title)+'</h2>'+(s.text?'<p class="ps-text">'+esc(s.text)+'</p>':'')
          +(s.button&&s.link?'<span class="ps-btn">'+esc(s.button)+(ext?' <span aria-hidden="true">↗</span><span class="sr-only"> (opens a new tab)</span>':' <span aria-hidden="true">→</span>')+'</span>':'')+'</div>';
        var btag=s.link?'<a class="ps-link" href="'+esc(s.link)+'"'+(ext?' target="_blank" rel="noopener"':'')+'>'+bin+'</a>':'<div class="ps-link">'+bin+'</div>';
        return '<div class="pslide ps-banner ps-'+style+'" role="group" aria-roledescription="slide" aria-label="'+(i+1)+' of '+n+'">'+btag+'</div>';
      }
      var art=s.image?'<img class="ps-img" src="assets/slides/'+esc(s.image)+'" alt="'+esc(s.imageAlt||'')+'"'+(i?' loading="lazy"':'')+'>':ART[style](s,i);
      var meta=(s.date||s.place)?'<p class="ps-meta">'+(s.date?'<span class="ps-date"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>'+esc(s.date)+'</span>':'')+(s.place?'<span class="ps-place">'+esc(s.place)+'</span>':'')+'</p>':'';
      if(s.poster){   // a finished design made outside the website: the whole slide is the picture
        var pimg='<picture>'+(s.posterPhone?'<source media="(max-width:640px)" srcset="assets/slides/'+esc(s.posterPhone)+'">':'')
          +'<img class="ps-poster" src="assets/slides/'+esc(s.poster)+'" alt="'+esc(s.posterAlt||s.title||'')+'"'+(i?' loading="lazy"':'')+'></picture>';
        var ptag=s.link?'<a class="ps-link" href="'+esc(s.link)+'"'+(ext?' target="_blank" rel="noopener"':'')+'>'+pimg+'</a>':'<div class="ps-link">'+pimg+'</div>';
        return '<div class="pslide ps-posteronly" role="group" aria-roledescription="slide" aria-label="'+(i+1)+' of '+n+': '+esc(s.posterAlt||s.title||'')+'">'+ptag+'</div>';
      }
      if(style==='guest'){
        var dm=/(\w+),?\s+(\d{1,2})\s+(\w+)/.exec(s.date||'');
        var words=String(s.title||'').split(' '), last=words.pop();
        var ticket=s.date?'<div class="pg-ticket">'+(dm?'<div class="pg-day"><b>'+esc(dm[2])+'</b><span>'+esc(dm[3].slice(0,3))+'</span></div>':'')
          +'<div class="pg-info"><b>'+esc(dm?dm[1]:s.date)+(s.event?' · '+esc(s.event):'')+'</b>'+(s.place?'<span>'+esc(s.place)+'</span>':'')+'</div></div>':'';
        var gin='<div class="ps-art">'+art+'</div><div class="ps-body">'
          +(s.kicker?'<p class="ps-kicker pg-kicker"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 13.5l7-1.5 5-8h2.5l-2 8 5-1 1.5-2H23l-1.5 4.5 1.5 4.5h-1.5l-1.5-2-5-1 2 8h-2.5l-5-8-7-1.5z"/></svg>'+nb(s.kicker)+'</p>':'')
          +(s.honorific?'<p class="pg-hon">'+nb(s.honorific)+'</p>':'')
          +'<h2 class="ps-title pg-name">'+nb(words.join(' '))+(words.length?' ':'')+'<span>'+nb(last)+'</span></h2>'
          +(s.text?'<p class="pg-role">'+nb(s.text)+'</p>':'')
          +'<div class="pg-row">'+ticket
          +(s.button&&s.link?'<span class="ps-btn">'+esc(s.button)+(ext?' <span aria-hidden="true">↗</span><span class="sr-only"> (opens a new tab)</span>':' <span aria-hidden="true">→</span>')+'</span>':'')
          +'</div></div>';
        var gtag=s.link?'<a class="ps-link" href="'+esc(s.link)+'"'+(ext?' target="_blank" rel="noopener"':'')+'>'+gin+'</a>':'<div class="ps-link">'+gin+'</div>';
        return '<div class="pslide ps-guest v-'+esc(s.variant||'flag')+'" role="group" aria-roledescription="slide" aria-label="'+(i+1)+' of '+n+'">'+gtag+'</div>';
      }
      var inner='<div class="ps-art'+(photo?' has-photo':'')+'">'+art+photo+'</div><div class="ps-body">'
        +(s.kicker?'<p class="ps-kicker">'+nb(s.kicker)+'</p>':'')
        +'<h2 class="ps-title">'+nb(s.title)+'</h2>'
        +(s.text?'<p class="ps-text">'+esc(s.text)+'</p>':'')+meta
        +(s.button&&s.link?'<span class="ps-btn">'+esc(s.button)+(ext?' <span aria-hidden="true">↗</span><span class="sr-only"> (opens a new tab)</span>':' <span aria-hidden="true">→</span>')+'</span>':'')
        +'</div>';
      var tag=s.link?'<a class="ps-link" href="'+esc(s.link)+'"'+(ext?' target="_blank" rel="noopener"':'')+'>'+inner+'</a>':'<div class="ps-link">'+inner+'</div>';
      return '<div class="pslide ps-'+style+'" role="group" aria-roledescription="slide" aria-label="'+(i+1)+' of '+n+'">'+tag+'</div>';
    }).join('');
    var slides=[].slice.call(track.children);
    if(n<2) root.classList.add('single');

    dotsEl.innerHTML=list.map(function(s,i){return '<button type="button" class="promo-dot" aria-label="Show slide '+(i+1)+' of '+n+': '+esc(s.title)+'"><span></span></button>';}).join('');
    var dots=[].slice.call(dotsEl.children);
    var playBtn=root.querySelector('.promo-play');
    var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cur=-1, userPaused=reduce, holds=0;

    function setActive(i){
      if(i===cur) return; cur=i;
      root.classList.toggle('on-light',slides[i].classList.contains('ps-academy'));
      slides.forEach(function(el,k){var on=k===i; el.classList.toggle('is-active',on); if(on) el.removeAttribute('inert'); else el.setAttribute('inert','');});
      dots.forEach(function(d,k){d.classList.toggle('on',k===i); d.classList.toggle('done',k<i); if(k===i) d.setAttribute('aria-current','true'); else d.removeAttribute('aria-current');
        var bar=d.firstChild; bar.style.animation='none'; void bar.offsetWidth; bar.style.animation='';});
    }
    function go(i,instant){
      i=(i+n)%n;
      track.scrollTo({left:i*track.clientWidth,behavior:(instant||reduce)?'auto':'smooth'});
      setActive(i);
    }
    function sync(){root.classList.toggle('paused',userPaused||holds>0);
      track.setAttribute('aria-live',(userPaused||holds>0)?'polite':'off');
      playBtn.setAttribute('aria-label',userPaused?'Play slideshow':'Pause slideshow');
      playBtn.classList.toggle('is-paused',userPaused);}
    // The gold bar under the current slide fills up; when it is full, move to the next slide.
    dotsEl.addEventListener('animationend',function(e){ if(e.target.parentNode===dots[cur]&&!userPaused) go(cur+1); });
    dots.forEach(function(d,k){d.addEventListener('click',function(){go(k);});});
    root.querySelector('.promo-prev').addEventListener('click',function(){go(cur-1);});
    root.querySelector('.promo-next').addEventListener('click',function(){go(cur+1);});
    playBtn.addEventListener('click',function(){userPaused=!userPaused; sync();});
    function hold(on){holds=Math.max(0,holds+(on?1:-1)); sync();}
    root.addEventListener('mouseenter',function(){hold(true);});
    root.addEventListener('mouseleave',function(){hold(false);});
    root.addEventListener('focusin',function(){hold(true);});
    root.addEventListener('focusout',function(){hold(false);});
    root.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){go(cur+1);}else if(e.key==='ArrowLeft'){go(cur-1);}});
    // Swiping on a phone: work out which slide is showing once the swipe settles.
    var st;
    track.addEventListener('scroll',function(){clearTimeout(st); st=setTimeout(function(){
      var i=Math.round(track.scrollLeft/track.clientWidth); if(i!==cur) setActive(Math.max(0,Math.min(n-1,i)));
    },90);},{passive:true});
    window.addEventListener('resize',function(){go(cur,true);});
    document.addEventListener('visibilitychange',function(){hold(document.hidden);});
    if(reduce) root.classList.add('reduce');
    setActive(0); sync();
  }
  document.querySelectorAll('.promo').forEach(initPromo);
})();
