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
      [isFri?'Jummah':'Zuhr',r[5],isFri?JUMMAH.join(' & '):r[6],isFri?toMins(JUMMAH[0]||r[6]):null],
      ['Asr',r[7],r[8]],
      ['Maghrib',r[9],null],
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

  // Prayer times page
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
    var labels=["Fajr","Fajr Jama'at","Sunrise","Zuhr","Zuhr Jama'at","Asr","Asr Jama'at","Maghrib","Isha","Isha Jama'at"];
    var sd=document.getElementById('selectedDate'), tw=document.getElementById('times');
    function select(i,scroll){
      trs.forEach(function(r){r.classList.remove('active');});
      var r=trs[i]; if(!r) return; r.classList.add('active');
      var d=data[i];
      sd.textContent=DAYS[d[1]]+', '+(+d[0])+' '+MONTHS[m-1]+' '+y;
      tw.innerHTML=d.slice(2).map(function(v,j){
        var lab=labels[j]; if(d[1]==='Fri'&&j===4){lab='Jummah';v=JUMMAH.join(' & ');}
        return '<div class="time"><b>'+lab+'</b><span>'+v+'</span></div>';
      }).join('');
      if(scroll) r.scrollIntoView({behavior:'smooth',block:'nearest'});
    }
    trs.forEach(function(r,i){
      r.addEventListener('click',function(){select(i,false);});
      r.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();select(i,false);}});
    });
    var todayIdx=(mk===monthKey)?now.d-1:0;
    document.getElementById('todayBtn').addEventListener('click',function(){select(todayIdx,true);});
    document.getElementById('shareBtn').addEventListener('click',function(){
      var sh={title:'Faizan e Madina Vancouver prayer times',url:location.href};
      if(navigator.share){navigator.share(sh).catch(function(){});}
      else if(navigator.clipboard){navigator.clipboard.writeText(location.href).then(function(){alert('Link copied');});}
    });
    select(todayIdx,false);
  }
})();
