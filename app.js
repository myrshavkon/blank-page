(function(){
  "use strict";

  var STORAGE_KEY = "blankpage.notes.v1";
  var SETTINGS_KEY = "settings";
  var MAX_NOTES = Infinity; // unlimited

  var TYPEFACES = {
    sans:  { fontFamily:'"IBM Plex Sans", system-ui, sans-serif', lineHeight:"1.65", letterSpacing:"0.005em", wordSpacing:"0", contentHalfWidth:"34ch" },
    serif: { fontFamily:'"Lora", serif',                            lineHeight:"1.7",  letterSpacing:"0",     wordSpacing:"0", contentHalfWidth:"33ch" },
    mono:  { fontFamily:"Cousine, monospace",                        lineHeight:"1.8",  letterSpacing:"0",     wordSpacing:"0", contentHalfWidth:"35ch" }
  };
  var SCALES = [0.9167, 1, 1.0833]; // 16.5/18, 18/18, 19.5/18

  // ---------- State ----------
  var state = loadState();
  var activeId = state.activeId || (state.notes.length ? state.notes[0].id : null);

  function loadState(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { notes: [] };
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.notes)) return { notes: [] };
      return parsed;
    } catch(e){ return { notes: [] }; }
  }
  function persist(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes: state.notes, activeId: activeId }));
    } catch(e){ console.warn("Save failed", e); }
  }

  function loadSettings(){
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {}; }
    catch(e){ return {}; }
  }
  function saveSettings(s){
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }

  function uid(){
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  function titleFrom(text){
    var t = (text || "").trim();
    if (!t) return "Untitled";
    var firstLine = t.split(/\r?\n/)[0];
    return firstLine.length > 48 ? firstLine.slice(0,48) + "…" : firstLine;
  }
  // Display title: a user-set custom title wins; otherwise fall back to the
  // first line of the note body (auto-title).
  function noteTitle(n){
    var custom = (n.title || "").trim();
    return custom || titleFrom(n.text);
  }
  function renameNote(id, rawTitle){
    var n = state.notes.find(function(x){ return x.id === id; });
    if (!n) return;
    var t = (rawTitle || "").trim();
    if (t) { n.title = t; } else { delete n.title; } // blank → auto-title
    n.updatedAt = Date.now();
    persist();
    renderList();
  }

  function relativeTime(ts){
    var diff = Date.now() - ts;
    var m = Math.floor(diff/60000);
    if (m < 1) return "just now";
    if (m < 60) return m + "m ago";
    var h = Math.floor(m/60);
    if (h < 24) return h + "h ago";
    var d = Math.floor(h/24);
    if (d < 7) return d + "d ago";
    var w = Math.floor(d/7);
    if (w < 5) return w + "w ago";
    return new Date(ts).toLocaleDateString();
  }

  // ---------- Notes ops ----------
  function createNote(){
    var n = { id: uid(), text: "", createdAt: Date.now(), updatedAt: Date.now() };
    state.notes.unshift(n);
    activeId = n.id;
    persist();
    renderList();
    selectNote(n.id);
    return n;
  }
  function deleteNote(id){
    var idx = state.notes.findIndex(function(n){ return n.id === id; });
    if (idx === -1) return;
    state.notes.splice(idx, 1);
    if (activeId === id){
      activeId = state.notes.length ? state.notes[0].id : null;
    }
    persist();
    renderList();
    if (activeId) selectNote(activeId); else { editor.value = ""; updateWordCount(); }
  }
  function getActive(){
    return state.notes.find(function(n){ return n.id === activeId; }) || null;
  }
  function selectNote(id){
    activeId = id;
    persist();
    var n = getActive();
    if (!n){ editor.value = ""; updateWordCount(); return; }
    editor.value = n.text;
    updateWordCount();
    renderList();
    editor.focus();
    closeSidebar();
  }

  // ---------- Render ----------
  var listEl = document.getElementById("noteList");
  function renderList(){
    listEl.innerHTML = "";
    if (state.notes.length === 0){
      var empty = document.createElement("div");
      empty.className = "menu-hint";
      empty.style.padding = ".75rem .5rem";
      empty.textContent = "No notes yet. Create one to begin.";
      listEl.appendChild(empty);
      return;
    }
    state.notes.forEach(function(n){
      var item = document.createElement("div");
      item.className = "note-item" + (n.id === activeId ? " active" : "");
      item.setAttribute("role", "listitem");
      item.dataset.id = n.id;

      var main = document.createElement("div");
      main.className = "note-item-main";
      var title = document.createElement("div");
      title.className = "note-title";
      title.textContent = noteTitle(n);
      title.title = "Double-click to rename";
      var meta = document.createElement("div");
      meta.className = "note-meta";
      var wc = (n.text || "").trim() ? (n.text.trim().split(/\s+/).filter(Boolean).length + " words") : "Empty";
      meta.textContent = wc + " · " + relativeTime(n.updatedAt);
      main.appendChild(title); main.appendChild(meta);

      var rename = document.createElement("button");
      rename.className = "note-rename";
      rename.type = "button";
      rename.setAttribute("aria-label", "Rename note");
      rename.title = "Rename";
      rename.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
      rename.addEventListener("click", function(e){
        e.stopPropagation();
        startRename(item, n);
      });
      title.addEventListener("dblclick", function(e){
        e.stopPropagation();
        startRename(item, n);
      });

      var del = document.createElement("button");
      del.className = "note-delete";
      del.type = "button";
      del.setAttribute("aria-label", "Delete note");
      del.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
      del.addEventListener("click", function(e){
        e.stopPropagation();
        if (confirm("Delete this note? This cannot be undone.")) deleteNote(n.id);
      });

      item.appendChild(main);
      item.appendChild(rename);
      item.appendChild(del);
      item.addEventListener("click", function(){ selectNote(n.id); });
      listEl.appendChild(item);
    });
  }

  // ---------- Inline rename ----------
  // Swaps the title text for an <input>. Enter or blur saves; Esc cancels.
  function startRename(item, n){
    if (!item || !n) return;
    if (item.classList.contains("renaming")) return;
    item.classList.add("renaming");

    var titleEl = item.querySelector(".note-title");
    var current = noteTitle(n);
    var input = document.createElement("input");
    input.className = "rename-input";
    input.type = "text";
    input.value = (n.title || "").trim(); // start from raw custom title if any
    input.setAttribute("aria-label", "Note name");
    input.setAttribute("placeholder", titleFrom(n.text) || "Untitled");
    input.maxLength = 120;

    titleEl.replaceWith(input);
    input.focus();
    input.select();

    var done = false;
    function commit(save){
      if (done) return;
      done = true;
      if (save) renameNote(n.id, input.value);
      else renderList(); // cancel → restore previous title
    }
    input.addEventListener("blur", function(){ commit(true); });
    input.addEventListener("keydown", function(e){
      if (e.key === "Enter"){ e.preventDefault(); commit(true); }
      else if (e.key === "Escape"){ e.preventDefault(); commit(false); input.blur(); }
    });
    // stop a click on the input from selecting the note / closing the drawer
    input.addEventListener("click", function(e){ e.stopPropagation(); });
    input.addEventListener("mousedown", function(e){ e.stopPropagation(); });
  }

  // ---------- Editor ----------
  var editor = document.getElementById("editor");
  var saveTimer = null;
  editor.addEventListener("input", function(){
    var n = getActive();
    if (!n) return;
    n.text = editor.value;
    n.updatedAt = Date.now();
    updateWordCount();
    var savedBadge = document.getElementById("savedBadge");
    savedBadge.textContent = "Saving…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){
      persist();
      savedBadge.textContent = "Saved locally";
      renderList();
    }, 350);
  });

  function updateWordCount(){
    var text = editor.value.trim();
    var words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    document.getElementById("wordCount").textContent = words + (words === 1 ? " word" : " words");
  }

  // ---------- New note ----------
  document.getElementById("newNoteBtn").addEventListener("click", createNote);

  // ---------- Sidebar drawer ----------
  var sidebar = document.getElementById("sidebar");
  var scrim = document.getElementById("scrim");
  var sidebarToggle = document.getElementById("sidebarToggle");
  var sidebarClose = document.getElementById("sidebarClose");

  function openSidebar(){
    sidebar.classList.add("open");
    sidebar.setAttribute("aria-hidden", "false");
    sidebarToggle.setAttribute("aria-expanded", "true");
    scrim.hidden = false;
    // force reflow so the opacity transition runs
    void scrim.offsetWidth;
    scrim.classList.add("show");
  }
  function closeSidebar(){
    sidebar.classList.remove("open");
    sidebar.setAttribute("aria-hidden", "true");
    sidebarToggle.setAttribute("aria-expanded", "false");
    scrim.classList.remove("show");
    // hide scrim after the transition so it never blocks clicks
    setTimeout(function(){ if (!sidebar.classList.contains("open")) scrim.hidden = true; }, 280);
  }
  sidebarToggle.addEventListener("click", function(){
    if (sidebar.classList.contains("open")) closeSidebar(); else openSidebar();
  });
  sidebarClose.addEventListener("click", closeSidebar);
  scrim.addEventListener("click", closeSidebar);

  // ---------- Settings menu ----------
  var settingsBtn = document.getElementById("settingsBtn");
  var settingsMenu = document.getElementById("settingsMenu");
  settingsBtn.addEventListener("click", function(e){
    e.stopPropagation();
    var open = settingsMenu.classList.toggle("open");
    settingsBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) syncSettingsUI();
  });
  document.addEventListener("click", function(e){
    if (!settingsMenu.contains(e.target) && e.target !== settingsBtn && !settingsBtn.contains(e.target)){
      settingsMenu.classList.remove("open");
      settingsBtn.setAttribute("aria-expanded","false");
    }
  });

  function applyTheme(theme){
    var root = document.documentElement;
    var resolved = theme;
    if (theme === "system"){
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    root.classList.toggle("dark", resolved === "dark");
  }
  function applyTypeface(tf){
    var t = TYPEFACES[tf] || TYPEFACES.sans;
    var el = document.documentElement;
    el.style.setProperty("--font-editor", t.fontFamily);
    el.style.setProperty("--content-half-width", t.contentHalfWidth);
    el.style.setProperty("--font-editor-lh", t.lineHeight);
    el.style.setProperty("--font-editor-ls", t.letterSpacing);
    el.style.setProperty("--font-editor-ws", t.wordSpacing);
  }
  function applyScale(scale){
    document.documentElement.style.setProperty("--font-editor-scale", String(scale));
    var base = window.matchMedia("(max-width: 720px)").matches ? "16px" : "18px";
    document.documentElement.style.setProperty("--font-editor-size", base);
  }

  function syncSettingsUI(){
    var s = loadSettings();
    var theme = s.theme || "system";
    var typeface = TYPEFACES[s.typeface] ? s.typeface : "sans";
    var scale = (typeof s.textScale === "number") ? nearestScale(s.textScale) : 1;

    document.querySelectorAll("#themeSeg button").forEach(function(b){ b.classList.toggle("on", b.dataset.theme === theme); });
    document.querySelectorAll("#typefaceSeg button").forEach(function(b){ b.classList.toggle("on", b.dataset.typeface === typeface); });
    document.querySelectorAll("#scaleSeg button").forEach(function(b){ b.classList.toggle("on", parseFloat(b.dataset.scale) === scale); });
  }
  function nearestScale(v){
    var best = SCALES[1], bd = Infinity;
    SCALES.forEach(function(s){ var d = Math.abs(s - v); if (d < bd){ bd = d; best = s; } });
    return best;
  }

  document.getElementById("themeSeg").addEventListener("click", function(e){
    var btn = e.target.closest("button[data-theme]");
    if (!btn) return;
    var theme = btn.dataset.theme;
    var s = loadSettings(); s.theme = theme; saveSettings(s);
    applyTheme(theme); syncSettingsUI();
  });
  document.getElementById("typefaceSeg").addEventListener("click", function(e){
    var btn = e.target.closest("button[data-typeface]");
    if (!btn) return;
    var tf = btn.dataset.typeface;
    var s = loadSettings(); s.typeface = tf; saveSettings(s);
    applyTypeface(tf); syncSettingsUI();
  });
  document.getElementById("scaleSeg").addEventListener("click", function(e){
    var btn = e.target.closest("button[data-scale]");
    if (!btn) return;
    var scale = parseFloat(btn.dataset.scale);
    var s = loadSettings(); s.textScale = scale; saveSettings(s);
    applyScale(scale); syncSettingsUI();
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function(){
    var s = loadSettings();
    if ((s.theme || "system") === "system") applyTheme("system");
  });
  window.addEventListener("resize", function(){ applyScale(loadSettings().textScale || 1); });

  // ---------- Export / print ----------
  document.getElementById("exportBtn").addEventListener("click", function(){
    var n = getActive();
    if (!n){ alert("Nothing to download."); return; }
    var blob = new Blob([n.text || ""], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = (titleFrom(n.text) || "note") + ".txt";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    settingsMenu.classList.remove("open");
  });
  document.getElementById("printBtn").addEventListener("click", function(){
    window.print();
    settingsMenu.classList.remove("open");
  });

  // ---------- Keyboard ----------
  document.addEventListener("keydown", function(e){
    // Ctrl/Cmd+Alt+N -> new note (avoids clashing with browser "new window")
    if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === "n" || e.key === "N")){
      e.preventDefault(); createNote(); openSidebar();
    }
    // Ctrl/Cmd+B -> toggle sidebar
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === "b" || e.key === "B")){
      e.preventDefault();
      if (sidebar.classList.contains("open")) closeSidebar(); else openSidebar();
    }
    // Escape closes drawer / settings menu
    if (e.key === "Escape"){
      settingsMenu.classList.remove("open");
      settingsBtn.setAttribute("aria-expanded","false");
      closeSidebar();
    }
  });

  // ---------- Init ----------
  function init(){
    var s = loadSettings();
    applyTheme(s.theme || "system");
    applyTypeface(TYPEFACES[s.typeface] ? s.typeface : "sans");
    applyScale(typeof s.textScale === "number" ? nearestScale(s.textScale) : 1);

    // Start exactly like blank.page: a truly blank writing surface.
    // If there are no notes yet, create a single empty note so the editor
    // has somewhere to write — no welcome text, no onboarding hero.
    if (state.notes.length === 0){
      var n = { id: uid(), text: "", createdAt: Date.now(), updatedAt: Date.now() };
      state.notes.push(n);
      activeId = n.id;
      persist();
    }

    renderList();
    if (activeId){
      var cur = getActive();
      if (cur){ editor.value = cur.text; updateWordCount(); }
      else { activeId = state.notes[0] ? state.notes[0].id : null; if (activeId) selectNote(activeId); }
    }
    editor.focus();
  }

  init();
})();
