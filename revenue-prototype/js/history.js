document.addEventListener('DOMContentLoaded', ()=>{
  const list = document.getElementById('history-list');
  const clearBtn = document.getElementById('clear-history');

  function render(){
    const stored = localStorage.getItem('request_history');
    const arr = stored ? JSON.parse(stored) : [];
    list.innerHTML = '';
    if(!arr.length){
      list.innerHTML = '<div class="muted">История пуста</div>';
      return;
    }
    const ul = document.createElement('ul');
    ul.className = 'history-list';
    arr.forEach((e, idx)=>{
      const li = document.createElement('li');
      li.className = 'history-item';
      const ts = new Date(e.timestamp).toLocaleString();
      const p = e.payload || {};
      const name = (p.last_name || p.first_name) ? ((p.last_name||'') + ' ' + (p.first_name||'')).trim() : 'Клиент';
      const req = p.request_amount ? (' — ' + p.request_amount + '₽') : '';
      const meta = document.createElement('div'); meta.className = 'history-meta';
      meta.innerHTML = `<div><strong>${ts}</strong></div><div class="muted small">${name}${req}</div>`;
      const controls = document.createElement('div');
      controls.className = 'history-controls';
      const openBtn = document.createElement('button'); openBtn.className='btn'; openBtn.textContent='Открыть';
      openBtn.dataset.id = e.id || '';
      const viewBtn = document.createElement('button'); viewBtn.className='btn ghost'; viewBtn.textContent='Показать';
      viewBtn.dataset.idx = idx;
      controls.appendChild(openBtn); controls.appendChild(viewBtn);
      li.appendChild(meta);
      li.appendChild(controls);
      ul.appendChild(li);
    });
    list.appendChild(ul);

    // wire actions
    Array.from(list.querySelectorAll('button')).forEach(b=>{
      if(b.textContent === 'Открыть'){
        b.addEventListener('click', ()=>{
          const id = b.dataset.id;
          if(!id) return alert('Нет task_id для этого запроса.');
          location.href = 'model.html?task_id=' + encodeURIComponent(id);
        });
      }
      if(b.textContent === 'Показать'){
        b.addEventListener('click', ()=>{
          const idx = Number(b.dataset.idx);
          const stored = JSON.parse(localStorage.getItem('request_history')||'[]');
          const e = stored[idx];
          if(!e) return alert('Элемент не найден');
          alert(JSON.stringify(e, null, 2));
        });
      }
    });
  }

  clearBtn && clearBtn.addEventListener('click', ()=>{
    if(confirm('Очистить историю запросов?')){
      localStorage.removeItem('request_history');
      render();
    }
  });

  render();
});
