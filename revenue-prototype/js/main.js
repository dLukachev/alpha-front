// --- Form Submission Logic ---
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('client-form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Prepare payload for model
    const payload = {
      last_name: data.last_name,
      first_name: data.first_name,
      middle_name: data.middle_name,
      age: Number(data.age),
      income: Number(data.income),
      has_children: data.has_children === 'yes',
      marital_status: data.marital_status,
      credit_history: data.credit_history,
      request_amount: Number(data.request_amount),
      employment_years: Number(data.employment_years),
      existing_loans: data.existing_loans === 'yes'
    };

    try {
      const resp = await fetch(window.BACKEND_URL + '/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error('Ошибка отправки данных');
      const result = await resp.json();
      if (result.task_id) {
        window.location.href = 'model.html?task_id=' + encodeURIComponent(result.task_id);
      } else {
        alert('Ошибка: task_id не получен');
      }
    } catch (err) {
      alert('Ошибка отправки: ' + err.message);
    }
  });
});
(function(){
  // small utility
  const $ = id => document.getElementById(id);

  // Backend base URL: leave empty string for same-origin, or override
  // Example overrides:
  //   - in browser console: window.BACKEND_URL = 'http://localhost:8000'
  //   - before loading this script add: <script>window.BACKEND_URL='http://localhost:8000'</script>
  const BACKEND_URL = (typeof window !== 'undefined' && window.BACKEND_URL) ? window.BACKEND_URL : '';

  function formatMoney(x){
    if (typeof x !== 'number') return String(x);
    return x.toLocaleString('ru-RU',{maximumFractionDigits:0});
  }

  // ---------- Generic charting (bar) ----------
  function roundRect(ctx, x, y, width, height, radius, fill, stroke, fillStyle){
    if (typeof stroke === 'undefined') stroke = true;
    if (typeof radius === 'undefined') radius = 5;
    ctx.beginPath();
    ctx.moveTo(x+radius, y);
    ctx.arcTo(x+width, y, x+width, y+height, radius);
    ctx.arcTo(x+width, y+height, x, y+height, radius);
    ctx.arcTo(x, y+height, x, y, radius);
    ctx.arcTo(x, y, x+width, y, radius);
    ctx.closePath();
    if(fill){
      ctx.fillStyle = fillStyle || 'rgba(214,0,28,0.6)';
      ctx.fill();
    }
    if(stroke){
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.stroke();
    }
  }

  function drawBarChart(canvas, data, opts={}){
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);

    const pad = 40;
    const innerW = w - pad*2;
    const innerH = h - pad*2;
    const values = data.map(d => (typeof d === 'number' ? d : d.value));
    const labels = data.map((d,i) => d.label || (i+1));
    const maxVal = Math.max(...values, 1);

    // axes
    ctx.strokeStyle = 'rgba(15,23,32,0.06)';
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, h-pad);
    ctx.lineTo(w-pad, h-pad);
    ctx.stroke();

    const barW = innerW / data.length * 0.6;
    data.forEach((d,i)=>{
      const x = pad + (i + 0.2) * (innerW / data.length);
      const ratio = maxVal ? values[i] / maxVal : 0;
      const barH = ratio * innerH;
      const grad = ctx.createLinearGradient(0,h-pad,0,pad);
      grad.addColorStop(0,'rgba(214,0,28,0.12)');
      grad.addColorStop(1,'rgba(214,0,28,0.28)');
      roundRect(ctx, x, h-pad - barH, barW, barH, 6, true, false, grad);
      ctx.fillStyle = 'rgba(15,23,32,0.9)';
      ctx.font = '12px Inter, system-ui, -apple-system';
      ctx.fillText(labels[i], x, h-pad + 16);
      ctx.fillStyle = 'rgba(15,23,32,0.6)';
      ctx.fillText(formatMoney(values[i]), x, h-pad - barH - 8);
    });
  }

  // ---------- Form submission logic (index.html) ----------
  const form = document.querySelector('#client-form');
  if(form){
    const fillBtn = document.getElementById('fill-sample');
    fillBtn && fillBtn.addEventListener('click', ()=>{
      form.last_name.value = 'Иванов';
      form.first_name.value = 'Иван';
      form.middle_name.value = 'Иванович';
      form.age.value = 36;
      form.income.value = 90000;
      form.has_children.value = 'no';
      form.credit_history.value = 'average';
      form.request_amount.value = 300000;
      form.employment_years.value = 4;
      form.existing_loans.value = 'no';
    });

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const data = {};
      new FormData(form).forEach((v,k)=>data[k]=v);
      // add optional fields
      data.submitted_at = new Date().toISOString();

      try{
        const res = await fetch(`${BACKEND_URL}/finance`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
        if(!res.ok) throw new Error('network');
        const json = await res.json();
        const taskId = json.task_id || json.taskId || json.id;
        if(!taskId) throw new Error('no-task-id');
        // store for later retrieval
        localStorage.setItem('last_task_id', taskId);
        // navigate to result page with id
        location.href = 'model.html?task_id=' + encodeURIComponent(taskId);
      }catch(err){
        // fallback: simulate the server response (mock) and navigate with example id
        console.warn('POST /finance failed, using mock response', err);
        const mockId = 'd6c6402e-7423-46ed-ada0-44bb923613ee';
        localStorage.setItem('last_task_id', mockId);
        // also store a mock result to be returned by GET for local testing
        const mockResult = {
          status: 'done',
          result: {
            score: 0.73,
            decision: 'approve',
            probability_default: 0.15,
            monthly_payment: 12500,
            timeline: [0,1,2,3,4],
            revenue_series: [100000,120000,140000,160000,180000]
          }
        };
        localStorage.setItem('mock_result_' + mockId, JSON.stringify(mockResult));
        location.href = 'model.html?task_id=' + encodeURIComponent(mockId);
      }
    });
  }

  // ---------- Polling & rendering (model.html) ----------
  const pollBtn = $('poll-now');
  const cancelBtn = $('cancel-poll');
  const statusBox = $('task-status');
  const spinner = $('spinner');
  const resultWrap = $('result-wrap');
  const resultContent = $('result-content');
  const table = document.querySelector('#table');
  const chartCanvas = $('chart');

  function getQueryParam(name){
    const params = new URLSearchParams(location.search);
    return params.get(name);
  }

  let pollToken = null;
  async function fetchTask(taskId){
    try{
      const res = await fetch(`${BACKEND_URL}/task/${encodeURIComponent(taskId)}`);
      if(!res.ok) throw new Error('network');
      const json = await res.json();
      return json;
    }catch(err){
      // fallback to local mock
      const stored = localStorage.getItem('mock_result_' + taskId);
      if(stored) return JSON.parse(stored);
      return {status:'processing'};
    }
  }

  async function pollTask(taskId, opts={interval:10000,timeout:60_000}){
    const start = Date.now();
    statusBox && (statusBox.innerHTML = `<p>Ожидание результата задачи <b>${taskId}</b></p>`);
    spinner && (spinner.style.display = 'block');
    resultContent && (resultContent.style.display = 'none');

    return new Promise((resolve,reject)=>{
      async function tick(){
        try{
          const data = await fetchTask(taskId);
          // allow both styles: {status:'done', result:{...}} or a direct dict
          const status = data.status || (data.result ? 'done' : 'done');
          if(status === 'done' || status === 'success'){
            spinner && (spinner.style.display = 'none');
            renderResult(data.result || data);
            resolve(data);
            return;
          }
        }catch(e){console.warn(e)}
        if(Date.now() - start > opts.timeout){
          spinner && (spinner.style.display = 'none');
          statusBox && (statusBox.innerHTML += '<div class="muted small">Таймаут ожидания результата.</div>');
          reject(new Error('timeout'));
          return;
        }
        pollToken = setTimeout(tick, opts.interval);
      }
      tick();
    });
  }

  function renderResult(obj){
    resultContent && (resultContent.style.display = 'block');
    // populate table: key/value pairs
    const tbody = table.querySelector('tbody');
    const thead = table.querySelector('thead');
    thead.innerHTML = '<tr><th>Ключ</th><th>Значение</th></tr>';
    if(!tbody) return;
    tbody.innerHTML = '';
    Object.entries(obj).forEach(([k,v])=>{
      // if array of numbers we show chart
      if(Array.isArray(v) && v.length>0 && v.every(x=>typeof x==='number')){
        // render chart using this array
        const data = v.map((val,i)=>({label: (i+1), value: val}));
        drawBarChart(chartCanvas, data);
      }
      const tr = document.createElement('tr');
      const keyTd = document.createElement('td'); keyTd.textContent = k;
      const valTd = document.createElement('td');
      if(typeof v === 'number') valTd.textContent = formatMoney(v);
      else if(Array.isArray(v)) valTd.textContent = JSON.stringify(v);
      else valTd.textContent = String(v);
      tr.appendChild(keyTd); tr.appendChild(valTd);
      tbody.appendChild(tr);
    });
    // render recommendations (use server-provided or generated mock)
    try{ renderRecommendations(obj); }catch(e){ console.warn('renderRecommendations failed',e) }
  }

  function renderRecommendations(obj){
    const container = document.getElementById('recommendations-content');
    if(!container) return;
    // allow server-provided recommendations array
    let recs = obj && obj.recommendations;
    if(!Array.isArray(recs)){
      // build mock suggestions based on available fields
      const decision = obj && (obj.decision || (obj.result && obj.result.decision));
      const prob = obj && (obj.probability_default ?? (obj.result && obj.result.probability_default));
      const monthly = obj && (obj.monthly_payment ?? (obj.result && obj.result.monthly_payment));
      const requestAmt = obj && (obj.request_amount ?? (obj.result && obj.result.request_amount));
      recs = [];
      if(typeof requestAmt === 'number'){
        if(requestAmt > 500000) recs.push('Большой кредит — рекомендуется снизить сумму запроса для уменьшения риска.');
        else recs.push('Сумма запроса находится в приемлемом диапазоне.');
      } else {
        recs.push('Проверьте сумму запроса и кредитную историю клиента.');
      }
      if(typeof monthly === 'number') recs.push(`Примерный ежемесячный платёж — ${formatMoney(monthly)}; проверить платёжеспособность.`);
      if(typeof prob === 'number'){
        if(prob > 0.3) recs.push('Высокая вероятность дефолта — требуется дополнительная проверка документов.');
        else recs.push('Низкая вероятность дефолта — можно рассмотреть выдачу при нормальной истории.');
      }
      if(decision === 'approve') recs.push('Решение модели: одобрено — подготовить документы для выдачи.');
      else if(decision === 'decline') recs.push('Решение модели: отказ — подготовить уведомление клиенту и предложить альтернативы.');
      // add some generic rules
      recs.push('Максимальный рекомендуемый срок: 60 месяцев.');
      recs.push('Проверять: паспорта, источники дохода и кредитную историю.');
    }
    // render as a list
    container.innerHTML = '';
    const ul = document.createElement('ul');
    ul.style.margin = 0; ul.style.paddingLeft = '18px';
    recs.forEach(r=>{
      const li = document.createElement('li'); li.textContent = r; li.style.marginBottom = '6px';
      ul.appendChild(li);
    });
    container.classList.remove('muted');
    container.appendChild(ul);
  }

  // wire up polling on model page if task_id present
  const taskId = getQueryParam('task_id') || localStorage.getItem('last_task_id');
  if(taskId){
    // show id immediately
    statusBox && (statusBox.innerHTML = `<p>Ид задачи: <b>${taskId}</b></p>`);
    // start polling
    pollTask(taskId).catch(()=>{});
  }

  pollBtn && pollBtn.addEventListener('click', ()=>{
    const id = getQueryParam('task_id') || localStorage.getItem('last_task_id');
    if(!id) return alert('task_id не указан');
    if(pollToken) clearTimeout(pollToken);
    pollTask(id).catch(()=>{});
  });

  cancelBtn && cancelBtn.addEventListener('click', ()=>{
    if(pollToken) clearTimeout(pollToken);
    spinner && (spinner.style.display = 'none');
    statusBox && (statusBox.innerHTML += '<div class="muted small">Опрос отменён.</div>');
  });

  // re-render chart on resize
  window.addEventListener('resize', ()=>{
    if(chartCanvas && chartCanvas.style.display !== 'none'){
      // try to redraw based on table values
      const tbody = table.querySelector('tbody');
      if(!tbody) return;
      const arr = [];
      Array.from(tbody.rows).forEach((r)=>{
        const val = r.cells[1] ? Number(String(r.cells[1].textContent).replace(/\s/g,'')) : NaN;
        if(!Number.isNaN(val)) arr.push(val);
      });
      if(arr.length) drawBarChart(chartCanvas, arr.map((v,i)=>({label:i+1, value:v})));
    }
  });

})();