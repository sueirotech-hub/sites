'use strict';
/* Solicitação de horário: sem reserva fictícia nem armazenamento de dados pessoais. */
(() => {
  const SERVICES = {
    corte:{name:'Corte de cabelo',minutes:30},barba:{name:'Barba',minutes:30},
    'corte-barba':{name:'Corte + barba',minutes:60},barboterapia:{name:'Barboterapia',minutes:45},
    estilizacao:{name:'Estilização',minutes:30},tratamento:{name:'Tratamento capilar',minutes:45}
  };
  const ZONE='America/Sao_Paulo';
  function parts(now=new Date()) {
    const map={}; new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).forEach(p=>map[p.type]=p.value);
    return {date:`${map.year}-${map.month}-${map.day}`,minute:Number(map.hour)*60+Number(map.minute)};
  }
  function parseDate(value) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
    const [year,month,day]=value.split('-').map(Number);const date=new Date(Date.UTC(year,month-1,day));
    return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day?date:null;
  }
  function dateLimit(today) {const date=parseDate(today);date.setUTCDate(date.getUTCDate()+60);return date.toISOString().slice(0,10);}
  function hours(date) {const value=parseDate(date);if(!value)return null;const day=value.getUTCDay();return day===0?[600,1020]:day===6?[540,1140]:[540,1200];}
  function timesFor(date,id,now=new Date()) {
    const service=SERVICES[id];const day=hours(date);const current=parts(now);
    if(!service||!day||date<current.date||date>dateLimit(current.date))return [];
    const result=[];const earliest=date===current.date?Math.ceil((current.minute+15)/30)*30:0;
    for(let minute=day[0];minute+service.minutes<=day[1];minute+=30)if(minute>=earliest)result.push({value:String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0'),minute,period:minute<720?'manha':minute<1080?'tarde':'noite'});
    return result;
  }
  function formatDay(value) {const date=parseDate(value);return date?new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC',weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(date):'';}
  function phoneValid(value) {let digits=value.replace(/\D/g,'');if(digits.startsWith('55')&&digits.length>11)digits=digits.slice(2);return digits.length===10||digits.length===11;}
  function makeDraft(data) {
    return ['Olá! Gostaria de solicitar um horário.','',`Serviço: ${SERVICES[data.service].name}`,`Dia: ${formatDay(data.date)}`,`Horário preferido: ${data.time}`,`Duração prevista: ${SERVICES[data.service].minutes} minutos`,'',`Nome: ${data.name.trim()}`,`Telefone: ${data.phone.trim()}`,data.notes.trim()?`Observação: ${data.notes.trim()}`:'','', 'Aguardo a confirmação da disponibilidade pela barbearia.'].filter((line,index,lines)=>line!==''||lines[index-1]!=='').join('\n');
  }
  const api={SERVICES,parts,parseDate,dateLimit,hours,timesFor,formatDay,phoneValid,makeDraft};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(typeof document==='undefined')return;
  const form=document.querySelector('#booking-form');if(!form)return;
  const section=document.querySelector('#agendar');const service=form.querySelector('#booking-service');const date=form.querySelector('#booking-date');
  const name=form.querySelector('#booking-name');const phone=form.querySelector('#booking-phone');const notes=form.querySelector('#booking-notes');
  const grid=form.querySelector('#booking-times');const empty=form.querySelector('#booking-empty');const error=form.querySelector('#booking-error');
  const result=form.querySelector('#booking-result');const draft=form.querySelector('#booking-draft');const status=form.querySelector('#booking-copy-status');
  const whatsapp=form.querySelector('#booking-whatsapp');const number=(section.dataset.whatsapp||'').replace(/\D/g,'');
  const connected=/^55\d{10,11}$/.test(number)&&number!=='5511999999999';
  let selected='';
  function fail(message,target) {error.textContent=message;error.hidden=false;if(target)target.focus();}
  function renderTimes(choosePeriod=false) {
    const today=parts().date;date.min=today;date.max=dateLimit(today);
    const available=timesFor(date.value,service.value);let period=form.querySelector('[name="periodo"]:checked').value;
    if(choosePeriod&&available.length&&!available.some(item=>item.period===period)){period=available[0].period;form.querySelector(`[name="periodo"][value="${period}"]`).checked=true;}
    const visible=available.filter(item=>item.period===period);grid.replaceChildren();
    if(!visible.some(item=>item.value===selected))selected='';
    visible.forEach(item=>{
      const label=document.createElement('label');label.className='booking-time';const input=document.createElement('input');input.type='radio';input.name='horario';input.value=item.value;input.required=true;input.checked=selected===item.value;
      const text=document.createElement('span');text.textContent=item.value;input.addEventListener('change',()=>{selected=item.value;error.hidden=true;result.hidden=true;});label.append(input,text);grid.append(label);
    });
    empty.hidden=visible.length>0;
    empty.textContent=!date.value?'Escolha uma data para consultar os horários.':available.length?'Não há horários para esse período. Tente outro período.':'Não há horários para solicitar nesse dia. Escolha outra data.';
  }
  date.value=parts().date;
  service.addEventListener('change',()=>{selected='';renderTimes(true);});date.addEventListener('change',()=>{selected='';renderTimes(true);});
  form.querySelectorAll('[name="periodo"]').forEach(radio=>radio.addEventListener('change',()=>renderTimes()));
  form.addEventListener('input',()=>{result.hidden=true;error.hidden=true;phone.setCustomValidity('');});
  form.addEventListener('submit',event=>{
    event.preventDefault();error.hidden=true;
    if(!phoneValid(phone.value)){phone.setCustomValidity('Informe um telefone com DDD, com 10 ou 11 dígitos.');phone.reportValidity();return;}
    if(!form.reportValidity())return;
    if(!timesFor(date.value,service.value).some(item=>item.value===selected)){fail('Escolha um horário válido para o serviço e a data selecionados.',date);renderTimes(true);return;}
    draft.value=makeDraft({service:service.value,date:date.value,time:selected,name:name.value,phone:phone.value,notes:notes.value});status.textContent='';
    whatsapp.hidden=!connected;
    if(connected){whatsapp.href='https://wa.me/'+number+'?text='+encodeURIComponent(draft.value);form.querySelector('#booking-result-help').textContent='Revise o pedido e envie pelo WhatsApp. O horário só estará reservado depois da confirmação da barbearia.';}
    result.hidden=false;form.querySelector('#booking-result-title').focus({preventScroll:true});result.scrollIntoView({behavior:document.documentElement.getAttribute('data-motion')==='reduced'?'auto':'smooth',block:'nearest'});
  });
  form.querySelector('#booking-copy').addEventListener('click',async()=>{
    try {if(!navigator.clipboard||!navigator.clipboard.writeText)throw new Error('clipboard unavailable');await navigator.clipboard.writeText(draft.value);status.textContent='Pedido copiado. Envie à barbearia e aguarde a confirmação.';}
    catch(_){draft.focus();draft.select();status.textContent='Texto selecionado. Use Copiar para enviar o pedido à barbearia.';}
  });
  document.querySelectorAll('[data-booking-cut]').forEach(link=>link.addEventListener('click',()=>{service.value='corte';notes.value='Referência: '+link.dataset.bookingCut+'.';selected='';result.hidden=true;renderTimes(true);}));
  renderTimes(true);
})();
