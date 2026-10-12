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
        nextEl.innerHTML=tm?'Next: <b>Fajr</b> '+tm[3]+' tomorrow':'';
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
      var url=rf.getAttribute('data-endpoint');
      if(!url){ err.textContent='This form is not connected yet. Please call '+'(778) 895-0886'+' for your receipt.'; return; }
      var data=new URLSearchParams(new FormData(rf)); data.delete('website'); data.append('submitted_from',location.hostname||'site');
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

  // Dua-e-Maghfirah form: up to 3 names, this Thursday or next (max 2 weeks ahead)
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
    addBtn.addEventListener('click',function(){
      var next=rows.filter(function(r){return r.hidden;})[0];
      if(next){ next.hidden=false; next.querySelector('input').focus(); }
      if(!rows.some(function(r){return r.hidden;})){ addBtn.hidden=true; }
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
      trs.forEach(function(r){r.classList.remove('active');});
    }
    function showToday(){ setTab('today'); render(today,now.y,now.m,MONTHS[now.m-1]+' '+now.y); if(mk===monthKey&&trs[now.d-1]) trs[now.d-1].classList.add('active'); }
    function showTomorrow(){ if(tabN.disabled) return; setTab('tomorrow'); render(tmrRow,tmr.y,tmr.m,''); if(key(tmr.y,tmr.m)===mk&&trs[tmr.d-1]) trs[tmr.d-1].classList.add('active'); }
    tabT.addEventListener('click',showToday); tabN.addEventListener('click',showTomorrow);
    function pick(i){
      setTab('none'); trs[i].classList.add('active'); render(data[i],y,m,'');
      document.querySelector('.daycard').scrollIntoView({behavior:'smooth',block:'start'});
    }
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
})();
