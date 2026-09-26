  // ─── STATE ───
  let currentStep = 1;
  const totalSteps = 4;
  const state = { tipo: 'depto', op: 'arriendo', fotos: [] };

  // ─── AMENIDADES ───
  const AMENIDADES = ['Amoblado','Estacionamiento','Bodega','Piscina','Quincho','Lavandería','Gimnasio','Conserje','Mascotas permitidas','Calefacción central','Vista al mar','Terraza/Balcón'];
  const selectedAmenidades = new Set();

  function renderAmenidades() {
    const container = document.getElementById('amenidades-grid');
    container.innerHTML = '';
    AMENIDADES.forEach(a => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = a;
      btn.style.cssText = `padding:7px 14px;border-radius:999px;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 150ms ease;border:1.5px solid ${selectedAmenidades.has(a)?'#F58635':'#EDE4DC'};background:${selectedAmenidades.has(a)?'rgba(245,134,53,0.08)':'white'};color:${selectedAmenidades.has(a)?'#F58635':'#655E58'};`;
      btn.onclick = () => {
        if (selectedAmenidades.has(a)) selectedAmenidades.delete(a);
        else selectedAmenidades.add(a);
        renderAmenidades();
      };
      container.appendChild(btn);
    });
  }
  renderAmenidades();

  // ─── OPT CARDS ───
  function selectOpt(group, value, el) {
    state[group] = value;
    const grid = document.getElementById(group === 'tipo' ? 'tipo-grid' : 'op-grid');
    grid.querySelectorAll('.opt-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
  }

  // ─── CHARACTER COUNTERS ───
  document.getElementById('titulo').addEventListener('input', function() {
    document.getElementById('titulo-count').textContent = this.value.length + ' / 80 caracteres';
  });
  document.getElementById('descripcion').addEventListener('input', function() {
    document.getElementById('desc-count').textContent = this.value.length + ' / 800 caracteres';
  });

  // ─── PHOTO UPLOAD ───
  function handleFiles(files) {
    const remaining = 10 - state.fotos.length;
    Array.from(files).slice(0, remaining).forEach(file => {
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) return;   // solo JPG/PNG/WebP, máx 5 MB (sin SVG)
      const reader = new FileReader();
      reader.onload = e => {
        // Se reduce a máx. 900 px (JPEG) para que quepa en el almacenamiento
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, 900 / Math.max(img.width, img.height));
          const cv = document.createElement('canvas');
          cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          state.fotos.push({ name: file.name, src: cv.toDataURL('image/jpeg', 0.75) });
          renderPhotos();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
  function renderPhotos() {
    const preview = document.getElementById('photo-preview');
    preview.innerHTML = '';
    state.fotos.forEach((f, i) => {
      const div = document.createElement('div');
      div.className = 'photo-thumb';
      div.innerHTML = `
        <img src="${f.src}" alt="Foto ${i+1}" />
        <button type="button" class="photo-remove" data-act="removePhoto" data-args='[${i}]' aria-label="Eliminar foto">×</button>
        ${i === 0 ? '<div style="position:absolute;bottom:4px;left:4px;background:rgba(245,134,53,0.9);color:white;font-size:0.6rem;font-weight:700;padding:2px 6px;border-radius:4px;">Principal</div>' : ''}
      `;
      preview.appendChild(div);
    });
  }
  function removePhoto(i) {
    state.fotos.splice(i, 1);
    renderPhotos();
  }
  function onDragOver(e) { e.preventDefault(); document.getElementById('upload-zone').classList.add('drag'); }
  function onDragLeave()  { document.getElementById('upload-zone').classList.remove('drag'); }
  function onDrop(e)      { e.preventDefault(); onDragLeave(); handleFiles(e.dataTransfer.files); }

  // ─── STEP INDICATOR ───
  function updateStepUI() {
    for (let i = 1; i <= totalSteps; i++) {
      const sc = document.getElementById('sc' + i);
      const sl = document.getElementById('sl' + i);
      let state2;
      if (i < currentStep) state2 = 'done';
      else if (i === currentStep) state2 = 'active';
      else state2 = 'pending';
      sc.className = 'step-circle ' + state2;
      sl.className = 'step-label ' + state2;
      if (state2 === 'done') sc.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
      else sc.textContent = i;
      if (i < totalSteps) document.getElementById('line' + i).className = 'step-line ' + (i < currentStep ? 'done' : '');
    }
    // Buttons
    document.getElementById('btn-back').style.display = currentStep > 1 ? 'inline-flex' : 'none';
    document.getElementById('btn-back-placeholder').style.display = currentStep > 1 ? 'none' : 'block';
    const btnNext = document.getElementById('btn-next');
    if (currentStep === totalSteps) {
      btnNext.innerHTML = 'Publicar propiedad <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    } else {
      btnNext.innerHTML = 'Siguiente <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }
  }

  // ─── VALIDATE STEP ───
  function validateStep(step) {
    let valid = true;
    const setErr = (id, show) => {
      const el = document.getElementById(id);
      const err = document.getElementById('err-' + id);
      if (el) el.classList.toggle('error', show);
      if (err) { err.style.display = show ? 'block' : 'none'; }
      if (show) valid = false;
    };
    if (step === 2) {
      setErr('titulo', !document.getElementById('titulo').value.trim());
      setErr('descripcion', !document.getElementById('descripcion').value.trim());
      setErr('precio', !document.getElementById('precio').value);
      setErr('superficie', !document.getElementById('superficie').value);
      setErr('sector', !document.getElementById('sector').value);
      const vid = document.getElementById('video').value.trim();
      setErr('video', !!vid && !videoSeguro(vid));
    }
    if (step === 3) {
      const errFotos = document.getElementById('err-fotos');
      if (state.fotos.length === 0) { errFotos.style.display = 'block'; valid = false; }
      else errFotos.style.display = 'none';
    }
    if (step === 4) {
      setErr('c-nombre', !document.getElementById('c-nombre').value.trim());
      setErr('c-apellido', !document.getElementById('c-apellido').value.trim());
      const email = document.getElementById('c-email').value.trim();
      setErr('c-email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      setErr('c-tel', !document.getElementById('c-tel').value.trim());
    }
    return valid;
  }




  // ─── BUILD RESUMEN ───
  function buildResumen() {
    const tipoLabel = { depto:'Departamento', casa:'Casa', oficina:'Oficina', terreno:'Terreno' };
    const opLabel   = { arriendo:'Arriendo', temporal:'Arriendo temporal' };
    const rows = [
      ['Tipo',      (tipoLabel[state.tipo] || '') + ' — ' + (opLabel[state.op] || '')],
      ['Título',    document.getElementById('titulo').value],
      ['Precio',    'UF ' + document.getElementById('precio').value + (state.op === 'arriendo' ? ' / mes' : '')],
      ['Superficie',document.getElementById('superficie').value + ' m²'],
      ['Sector',    document.getElementById('sector').value],
      ['Fotos',     state.fotos.length + ' foto(s)'],
    ];
    const amenArr = [...selectedAmenidades];
    if (amenArr.length) rows.push(['Amenidades', amenArr.join(', ')]);
    document.getElementById('resumen-content').innerHTML = rows.map(([k,v]) =>
      `<div style="display:flex;justify-content:space-between;gap:12px;padding:4px 0;border-bottom:1px solid #EDE4DC;">
        <span style="color:#655E58;font-size:0.82rem;">${esc(k)}</span>
        <span style="font-weight:600;font-size:0.82rem;text-align:right;">${esc(v)}</span>
      </div>`
    ).join('');
  }

  // ─── NAVIGATION ───
  function goNext() {
    clearAlert();
    if (!validateStep(currentStep)) {
      showAlert('Completa los campos requeridos antes de continuar.');
      return;
    }
    if (currentStep === totalSteps) { submitForm(); return; }
    document.getElementById('step' + currentStep).classList.remove('active');
    currentStep++;
    document.getElementById('step' + currentStep).classList.add('active');
    if (currentStep === 4) buildResumen();
    updateStepUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    document.getElementById('step' + currentStep).classList.remove('active');
    currentStep--;
    document.getElementById('step' + currentStep).classList.add('active');
    updateStepUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ─── SUBMIT ───
  function submitForm() {
    const aviso = {
      id: 'MIKSA-' + (crypto.randomUUID ? crypto.randomUUID().slice(0, 8).toUpperCase() : Date.now()),
      tipo: state.tipo,
      op: state.op,
      titulo: document.getElementById('titulo').value.trim(),
      descripcion: document.getElementById('descripcion').value.trim(),
      precio: document.getElementById('precio').value,
      superficie: document.getElementById('superficie').value,
      dormitorios: document.getElementById('dormitorios').value,
      banos: document.getElementById('banos').value,
      estacionamientos: document.getElementById('estacionamientos').value,
      sector: document.getElementById('sector').value,
      direccion: document.getElementById('direccion').value.trim(),
      lat: window.PIN ? window.PIN[0] : undefined,
      lng: window.PIN ? window.PIN[1] : undefined,
      amenidades: [...selectedAmenidades],
      fotos: state.fotos.slice(0, 4).map(f => f.src),
      owner: (getSesion() || {}).email || '',
      contacto: {
        nombre:   document.getElementById('c-nombre').value.trim(),
        apellido: document.getElementById('c-apellido').value.trim(),
        email:    document.getElementById('c-email').value.trim(),
        tel:      document.getElementById('c-tel').value.trim(),
        medio:    document.getElementById('c-tipo-contacto').value,
      },
      estado: 'disponible',
      gastosComunes: Number(document.getElementById('gastos').value) || null,
      contribuciones: Number(document.getElementById('contrib').value) || null,
      anio: Number(document.getElementById('anio').value) || null,
      orientacion: document.getElementById('orient').value,
      subsidio: document.getElementById('subsidio').checked,
      videoUrl: videoSeguro(document.getElementById('video').value) || '',
      fecha: new Date().toISOString(),
    };

    try {
      if (!guardarAviso(aviso)) throw new Error('almacenamiento lleno');
    } catch (e) {
      showAlert('No se pudo guardar el aviso (almacenamiento lleno). Prueba con menos fotos.');
      return;
    }

    // Show success
    document.querySelector('.form-card:not(#success-screen)').style.display = 'none';
    document.getElementById('step-indicator').style.display = 'none';
    document.getElementById('success-id').innerHTML =
      `<p style="font-size:0.75rem;color:#655E58;margin:0 0 4px;font-weight:600;">Código de tu aviso</p>
       <p style="font-size:1rem;font-weight:800;color:#A34D0A;margin:0;">${aviso.id}</p>`;
    const ver = document.querySelector('#success-screen a[href="index.html"]');
    if (ver) { ver.setAttribute('href', 'propiedad.html?id=' + encodeURIComponent(aviso.id)); ver.textContent = 'Ver mi aviso'; }
    document.getElementById('success-screen').classList.add('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ─── ALERT ───
  function showAlert(msg) {
    const el = document.getElementById('form-alert');
    el.textContent = msg;
    el.classList.add('show');
  }
  function clearAlert() {
    const el = document.getElementById('form-alert');
    el.textContent = '';
    el.classList.remove('show');
  }

  // ─── PRE-FILL from session ───
  window.addEventListener('DOMContentLoaded', () => {
    const session = getSesion();
    if (session) {
      const parts = (session.nombre || '').split(' ');
      if (parts[0]) document.getElementById('c-nombre').value = parts[0];
      if (parts[1]) document.getElementById('c-apellido').value = parts[1];
      document.getElementById('c-email').value = session.email || '';
    }
  });

  updateStepUI();

function openFileDialog() { document.getElementById('file-input').click(); }
document.getElementById('file-input').addEventListener('change', function () { handleFiles(this.files); });

document.getElementById('pub-form').addEventListener('submit', function (e) { e.preventDefault(); goNext(); });

// Arrastrar y soltar fotos (con listeners: los atributos ondrop inline los bloquea la CSP)
(function () {
  const z = document.getElementById('upload-zone');
  z.addEventListener('dragover', onDragOver);
  z.addEventListener('dragleave', onDragLeave);
  z.addEventListener('drop', onDrop);
})();
