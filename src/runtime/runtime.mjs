// Inlined client runtime: theme, progress, TOC scrollspy, search, per-block copy,
// collapse, tabs, command palette, exports, and the review/action-item state loop.
// Written without backticks so it embeds cleanly inside a template literal.

export const RUNTIME = `
(function(){
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var model={},mdSrc="",digestSrc="",slug="dossier";
  try{model=JSON.parse($("#dossier-model").textContent);}catch(e){}
  mdSrc=(($("#dossier-markdown")||{}).textContent||"");
  digestSrc=(($("#dossier-digest")||{}).textContent||"");
  slug=(model.meta&&model.meta.slug)||"dossier";
  var store="ds:"+slug;

  function toast(msg){var t=$("[data-toast]");if(!t)return;t.textContent=msg;t.classList.add("show");setTimeout(function(){t.classList.remove("show")},1600);}
  function copy(text,msg){if(navigator.clipboard){navigator.clipboard.writeText(text).then(function(){toast(msg||"Copied")});}else{var ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand("copy")}catch(e){}ta.remove();toast(msg||"Copied");}}
  function download(name,text,type){var b=new Blob([text],{type:type||"text/plain"});var u=URL.createObjectURL(b);var a=document.createElement("a");a.href=u;a.download=name;a.click();URL.revokeObjectURL(u);}

  var savedTheme=localStorage.getItem("ds:theme");
  if(savedTheme)document.documentElement.setAttribute("data-theme",savedTheme);
  var tt=$("[data-theme-toggle]");
  function themeGlyph(){return document.documentElement.getAttribute("data-theme")==="dark"?"☀":"☾";}
  function toggleTheme(){var cur=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",cur);localStorage.setItem("ds:theme",cur);if(tt)tt.textContent=themeGlyph();}
  if(tt){tt.textContent=themeGlyph();tt.addEventListener("click",toggleTheme);}

  var bar=$(".ds-progress-bar");
  function prog(){if(!bar)return;var h=document.documentElement.scrollHeight-window.innerHeight;bar.style.width=(h>0?(window.scrollY/h*100):0)+"%";}
  window.addEventListener("scroll",prog,{passive:true});prog();

  var links={};$$(".ds-toc-link").forEach(function(l){links[l.getAttribute("data-toc")]=l;});
  if(window.IntersectionObserver){
    var io=new IntersectionObserver(function(ents){ents.forEach(function(en){if(en.isIntersecting){var id=en.target.id;if(links[id]){Object.keys(links).forEach(function(k){links[k].classList.toggle("active",k===id);});}}});},{rootMargin:"-8% 0px -82% 0px"});
    Object.keys(links).forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el);});
  }

  $$("[data-copy]").forEach(function(btn){btn.addEventListener("click",function(e){e.stopPropagation();var blk=btn.closest(".ds-block");var txt=blk?blk.innerText.replace(/^Copy\\s*/,""):"";copy(txt,"Block copied");});});

  $$("[data-toggle]").forEach(function(btn){btn.addEventListener("click",function(){var sec=btn.closest(".ds-section");var c=sec.getAttribute("data-collapsed")==="1";sec.setAttribute("data-collapsed",c?"0":"1");});});

  $$(".ds-tabs").forEach(function(w){var tabs=$$(".ds-tab",w),panes=$$(".ds-pane",w);tabs.forEach(function(tb){tb.addEventListener("click",function(){var i=tb.getAttribute("data-tab");tabs.forEach(function(x){x.classList.toggle("active",x===tb)});panes.forEach(function(p){p.classList.toggle("active",p.getAttribute("data-pane")===i)});});});});

  var search=$("[data-search]");
  if(search){search.addEventListener("input",function(){var q=search.value.trim().toLowerCase();$$(".ds-content > .ds-block").forEach(function(blk){var hit=!q||blk.innerText.toLowerCase().indexOf(q)>=0;blk.style.display=hit?"":"none";});});}

  function viewSource(){var m=$("[data-source-modal]");if(!m)return;$("[data-source-text]").value=mdSrc;m.hidden=false;}
  $$("[data-action]").forEach(function(b){b.addEventListener("click",function(){var a=b.getAttribute("data-action");if(a==="copy-md")copy(mdSrc,"Markdown copied");else if(a==="copy-digest")copy(digestSrc,"Agent digest copied");else if(a==="download-md")download(slug+".md",mdSrc,"text/markdown");else if(a==="download-json")download(slug+".json",JSON.stringify(model,null,2),"application/json");else if(a==="view-source")viewSource();});});
  var sc=$("[data-source-close]");if(sc)sc.addEventListener("click",function(){$("[data-source-modal]").hidden=true;});

  var pal=$("[data-palette]"),palIn=$("[data-palette-input]"),palList=$("[data-palette-list]");
  var cmds=[];
  $$(".ds-toc-link").forEach(function(l){cmds.push({label:l.textContent,hint:"Section",act:function(){location.hash="#"+l.getAttribute("data-toc");}});});
  cmds.push({label:"Toggle theme",hint:"Action",act:toggleTheme});
  cmds.push({label:"Copy Markdown",hint:"Action",act:function(){copy(mdSrc,"Markdown copied");}});
  cmds.push({label:"Download JSON",hint:"Action",act:function(){download(slug+".json",JSON.stringify(model,null,2),"application/json");}});
  cmds.push({label:"View Markdown source",hint:"Action",act:viewSource});
  var palIdx=0,palFiltered=cmds;
  function renderPal(){if(!palList)return;palList.innerHTML="";palFiltered.forEach(function(c,i){var d=document.createElement("div");d.className="ds-palette-item"+(i===palIdx?" active":"");var s1=document.createElement("span");s1.textContent=c.label;var s2=document.createElement("small");s2.textContent=c.hint;d.appendChild(s1);d.appendChild(s2);d.addEventListener("click",function(){c.act();closePal();});palList.appendChild(d);});}
  function openPal(){if(!pal)return;pal.hidden=false;palIn.value="";palFiltered=cmds;palIdx=0;renderPal();palIn.focus();}
  function closePal(){if(pal)pal.hidden=true;}
  function filterPal(){var q=palIn.value.toLowerCase();palFiltered=cmds.filter(function(c){return c.label.toLowerCase().indexOf(q)>=0;});palIdx=0;renderPal();}
  var po=$("[data-palette-open]");if(po)po.addEventListener("click",openPal);
  if(palIn){palIn.addEventListener("input",filterPal);palIn.addEventListener("keydown",function(e){if(e.key==="ArrowDown"){palIdx=Math.min(palIdx+1,palFiltered.length-1);renderPal();e.preventDefault();}else if(e.key==="ArrowUp"){palIdx=Math.max(palIdx-1,0);renderPal();e.preventDefault();}else if(e.key==="Enter"){if(palFiltered[palIdx]){palFiltered[palIdx].act();closePal();}}else if(e.key==="Escape"){closePal();}});}
  document.addEventListener("keydown",function(e){if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openPal();}});
  if(pal)pal.addEventListener("click",function(e){if(e.target===pal)closePal();});

  var state={};try{state=JSON.parse(localStorage.getItem(store)||"{}");}catch(e){}
  function save(){localStorage.setItem(store,JSON.stringify(state));}
  function byAttr(sel,attr,val,root){var s=String(val);var nodes=$$(sel,root);for(var i=0;i<nodes.length;i++){if(nodes[i].getAttribute(attr)===s)return nodes[i];}return null;}
  function packetMap(packet,primary,alternate){var src=(packet&&packet[primary])||(packet&&alternate&&packet[alternate])||packet||{};if(Array.isArray(src)){var out={};src.forEach(function(entry,i){if(entry&&typeof entry==="object")out[entry.id||String(i)]=entry;});return out;}return src&&typeof src==="object"?src:{};}

  state.actions=state.actions||{};
  $$(".ds-action").forEach(function(li){var key=li.getAttribute("data-action");var cb=$("[data-action-check]",li);if(!cb)return;if(state.actions[key])cb.checked=true;function sync(){li.classList.toggle("done",cb.checked);state.actions[key]=cb.checked;save();}cb.addEventListener("change",sync);li.classList.toggle("done",cb.checked);});

  function reviewCount(){$$("[data-review-count]").forEach(function(c){var root=c.closest('[data-block="review-board"]')||document;var n=$$("[data-select]:checked",root).length;c.textContent=n+" selected";});}
  state.decisions=state.decisions||{};
  $$("[data-select]").forEach(function(cb){var id=cb.getAttribute("data-select");if(state.decisions[id]&&state.decisions[id].selected){cb.checked=true;cb.closest(".ds-ritem").classList.add("selected");}cb.addEventListener("change",function(){cb.closest(".ds-ritem").classList.toggle("selected",cb.checked);state.decisions[id]=state.decisions[id]||{};state.decisions[id].selected=cb.checked;save();reviewCount();});});
  $$("[data-notes]").forEach(function(ta){var id=ta.getAttribute("data-notes");if(state.decisions[id]&&state.decisions[id].notes)ta.value=state.decisions[id].notes;ta.addEventListener("input",function(){state.decisions[id]=state.decisions[id]||{};state.decisions[id].notes=ta.value;save();});});
  reviewCount();
  var ed=$("[data-export-decisions]");if(ed)ed.addEventListener("click",function(){download(slug+".decisions.json",JSON.stringify({slug:slug,decisions:state.decisions},null,2),"application/json");});
  var im=$("[data-import-decisions]");if(im)im.addEventListener("click",function(){var inp=document.createElement("input");inp.type="file";inp.accept="application/json";inp.onchange=function(){var f=inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result);var dec=packetMap(d,"decisions");Object.keys(dec).forEach(function(id){state.decisions[id]=dec[id];var cb=byAttr("[data-select]","data-select",id);if(cb){cb.checked=!!dec[id].selected;cb.closest(".ds-ritem").classList.toggle("selected",cb.checked);}var ta=byAttr("[data-notes]","data-notes",id);if(ta&&dec[id].notes!=null)ta.value=dec[id].notes;});save();reviewCount();toast("Imported decisions");}catch(e){toast("Import failed");}};r.readAsText(f);};inp.click();});

  // expandable triage rows: header toggles open, checkbox does not
  $$(".ds-ritem").forEach(function(item){var head=item.querySelector("[data-rtoggle]");if(head)head.addEventListener("click",function(e){if(e.target.closest("[data-stop]"))return;item.classList.toggle("open");});var stop=item.querySelector("[data-stop]");if(stop)stop.addEventListener("click",function(e){e.stopPropagation();});});
  function reviewFilter(){$$('[data-block="review-board"]').forEach(function(root){var rsearch=$("[data-review-search]",root),ronly=$("[data-review-only]",root);var q=((rsearch&&rsearch.value)||"").trim().toLowerCase();var only=ronly&&ronly.checked;$$(".ds-ritem",root).forEach(function(i){var txt=i.getAttribute("data-text")||"";var cb=i.querySelector("[data-select]");var sel=cb&&cb.checked;i.style.display=((!q||txt.indexOf(q)>=0)&&(!only||sel))?"":"none";});});}
  $$('[data-block="review-board"]').forEach(function(root){var rsearch=$("[data-review-search]",root),ronly=$("[data-review-only]",root),rexpand=$("[data-review-expand]",root);if(rsearch)rsearch.addEventListener("input",reviewFilter);if(ronly)ronly.addEventListener("change",reviewFilter);if(rexpand)rexpand.addEventListener("click",function(){var items=$$(".ds-ritem",root);var anyClosed=items.some(function(i){return !i.classList.contains("open");});items.forEach(function(i){i.classList.toggle("open",anyClosed);});rexpand.textContent=anyClosed?"Collapse all":"Expand all";});});
  $$("[data-select]").forEach(function(cb){cb.addEventListener("change",reviewFilter);});

  function processVerdictClass(item,verdict){if(!item)return;["undecided","approve","revise","skip","defer","split","retry","block"].forEach(function(v){item.classList.remove("verdict-"+v);});item.classList.add("verdict-"+(verdict||"undecided"));}
  function processCount(){$$("[data-process-count]").forEach(function(c){var root=c.closest('[data-block="process-board"]')||document;var n=$$("[data-process-verdict]",root).filter(function(s){return s.value&&s.value!=="undecided";}).length;c.textContent=n+" verdict"+(n===1?"":"s");});}
  state.process=state.process||{};
  $$("[data-process-verdict]").forEach(function(sel){var id=sel.getAttribute("data-process-verdict");if(state.process[id]&&state.process[id].verdict)sel.value=state.process[id].verdict;function sync(){state.process[id]=state.process[id]||{};state.process[id].verdict=sel.value;processVerdictClass(sel.closest(".ds-pitem"),sel.value);save();processCount();processFilter();}sel.addEventListener("change",sync);processVerdictClass(sel.closest(".ds-pitem"),sel.value);});
  $$("[data-process-notes]").forEach(function(ta){var id=ta.getAttribute("data-process-notes");if(state.process[id]&&state.process[id].notes)ta.value=state.process[id].notes;ta.addEventListener("input",function(){state.process[id]=state.process[id]||{};state.process[id].notes=ta.value;save();});});
  processCount();
  function collectProcess(){var out={};$$("[data-process-verdict]").forEach(function(sel){var id=sel.getAttribute("data-process-verdict");var ta=byAttr("[data-process-notes]","data-process-notes",id);var item=sel.closest(".ds-pitem");var title=item&&item.querySelector("h4")?item.querySelector("h4").textContent:"";out[id]={verdict:sel.value||"undecided",notes:ta?ta.value:"",title:title};});state.process=out;save();return out;}
  var ep=$("[data-export-process]");if(ep)ep.addEventListener("click",function(){download(slug+".process.json",JSON.stringify({schema:"dossier.process/v1",slug:slug,process:collectProcess()},null,2),"application/json");});
  var ip=$("[data-import-process]");if(ip)ip.addEventListener("click",function(){var inp=document.createElement("input");inp.type="file";inp.accept="application/json";inp.onchange=function(){var f=inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result);var proc=packetMap(d,"process","items");Object.keys(proc).forEach(function(id){state.process[id]=proc[id];var sel=byAttr("[data-process-verdict]","data-process-verdict",id);if(sel&&proc[id].verdict){sel.value=proc[id].verdict;processVerdictClass(sel.closest(".ds-pitem"),sel.value);}var ta=byAttr("[data-process-notes]","data-process-notes",id);if(ta&&proc[id].notes!=null)ta.value=proc[id].notes;});save();processCount();processFilter();toast("Imported process state");}catch(e){toast("Import failed");}};r.readAsText(f);};inp.click();});
  $$(".ds-pitem").forEach(function(item){var head=item.querySelector("[data-ptoggle]");if(head)head.addEventListener("click",function(e){if(e.target.closest("[data-stop]"))return;item.classList.toggle("open");});var stop=item.querySelector("[data-stop]");if(stop)stop.addEventListener("click",function(e){e.stopPropagation();});});
  function processFilter(){$$('[data-block="process-board"]').forEach(function(root){var psearch=$("[data-process-search]",root),ponly=$("[data-process-only]",root);var q=((psearch&&psearch.value)||"").trim().toLowerCase();var only=ponly&&ponly.checked;$$(".ds-pitem",root).forEach(function(i){var txt=i.getAttribute("data-text")||"";var sel=i.querySelector("[data-process-verdict]");var has=sel&&sel.value&&sel.value!=="undecided";i.style.display=((!q||txt.indexOf(q)>=0)&&(!only||has))?"":"none";});});}
  $$('[data-block="process-board"]').forEach(function(root){var psearch=$("[data-process-search]",root),ponly=$("[data-process-only]",root),pexpand=$("[data-process-expand]",root);if(psearch)psearch.addEventListener("input",processFilter);if(ponly)ponly.addEventListener("change",processFilter);if(pexpand)pexpand.addEventListener("click",function(){var items=$$(".ds-pitem",root);var anyClosed=items.some(function(i){return !i.classList.contains("open");});items.forEach(function(i){i.classList.toggle("open",anyClosed);});pexpand.textContent=anyClosed?"Collapse all":"Expand all";});});

  function editorMark(id,dirty){var shell=byAttr("[data-editor-shell]","data-editor-shell",id),label=byAttr("[data-editor-state]","data-editor-state",id);if(shell)shell.classList.toggle("dirty",!!dirty);if(label)label.textContent=dirty?"dirty":"clean";}
  state.editors=state.editors||{};
  $$("[data-code-editor]").forEach(function(ta){var id=ta.getAttribute("data-code-editor");var saved=state.editors[id];ta.__original=ta.value;if(saved&&saved.text!=null)ta.value=saved.text;function sync(){var dirty=ta.value!==ta.__original;state.editors[id]={text:ta.value,lang:ta.getAttribute("data-editor-lang")||"",filename:ta.getAttribute("data-editor-filename")||"",targetPath:ta.getAttribute("data-editor-target")||"",title:ta.getAttribute("data-editor-title")||"",dirty:dirty};editorMark(id,dirty);save();}ta.addEventListener("input",sync);editorMark(id,ta.value!==ta.__original);var reset=byAttr("[data-editor-reset]","data-editor-reset",id);if(reset)reset.addEventListener("click",function(){ta.value=ta.__original;sync();});if(typeof window.DossierEditorEnhancer==="function"){try{window.DossierEditorEnhancer({id:id,textarea:ta,language:ta.getAttribute("data-editor-lang")||"",filename:ta.getAttribute("data-editor-filename")||"",targetPath:ta.getAttribute("data-editor-target")||"",title:ta.getAttribute("data-editor-title")||""});}catch(e){}}});
  function exportEditors(){var edits={};$$("[data-code-editor]").forEach(function(ta){var id=ta.getAttribute("data-code-editor");edits[id]={text:ta.value,lang:ta.getAttribute("data-editor-lang")||"",filename:ta.getAttribute("data-editor-filename")||"",targetPath:ta.getAttribute("data-editor-target")||"",title:ta.getAttribute("data-editor-title")||"",dirty:ta.value!==ta.__original};});download(slug+".edits.json",JSON.stringify({schema:"dossier.edits/v1",slug:slug,edits:edits},null,2),"application/json");}
  function importEditors(){var inp=document.createElement("input");inp.type="file";inp.accept="application/json";inp.onchange=function(){var f=inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result);var edits=packetMap(d,"edits","items");Object.keys(edits).forEach(function(id){var entry=edits[id];if(!entry||entry.text==null)return;state.editors[id]=entry;var ta=byAttr("[data-code-editor]","data-code-editor",id);if(ta){ta.value=entry.text;editorMark(id,ta.value!==ta.__original);}});save();toast("Imported editor edits");}catch(e){toast("Import failed");}};r.readAsText(f);};inp.click();}
  $$("[data-export-editors]").forEach(function(b){b.addEventListener("click",exportEditors);});
  $$("[data-import-editors]").forEach(function(b){b.addEventListener("click",importEditors);});

  state.verdicts=state.verdicts||{};
  $$("[data-verdict-gate]").forEach(function(sel){var id=sel.getAttribute("data-verdict-gate");if(state.verdicts[id]&&state.verdicts[id].verdict)sel.value=state.verdicts[id].verdict;function sync(){state.verdicts[id]=state.verdicts[id]||{};state.verdicts[id].verdict=sel.value;save();}sel.addEventListener("change",sync);});
  $$("[data-verdict-notes]").forEach(function(ta){var id=ta.getAttribute("data-verdict-notes");if(state.verdicts[id]&&state.verdicts[id].notes)ta.value=state.verdicts[id].notes;ta.addEventListener("input",function(){state.verdicts[id]=state.verdicts[id]||{};state.verdicts[id].notes=ta.value;save();});});
  function collectVerdicts(){var out={};$$("[data-verdict-gate]").forEach(function(sel){var id=sel.getAttribute("data-verdict-gate");var ta=byAttr("[data-verdict-notes]","data-verdict-notes",id);out[id]={verdict:sel.value||"undecided",notes:ta?ta.value:"",title:sel.getAttribute("data-verdict-title")||""};});state.verdicts=out;save();return out;}
  function exportVerdicts(){download(slug+".verdicts.json",JSON.stringify({schema:"dossier.verdicts/v1",slug:slug,verdicts:collectVerdicts()},null,2),"application/json");}
  function importVerdicts(){var inp=document.createElement("input");inp.type="file";inp.accept="application/json";inp.onchange=function(){var f=inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result);var verdicts=packetMap(d,"verdicts","items");Object.keys(verdicts).forEach(function(id){state.verdicts[id]=verdicts[id];var sel=byAttr("[data-verdict-gate]","data-verdict-gate",id);if(sel&&verdicts[id].verdict)sel.value=verdicts[id].verdict;var ta=byAttr("[data-verdict-notes]","data-verdict-notes",id);if(ta&&verdicts[id].notes!=null)ta.value=verdicts[id].notes;});save();toast("Imported verdicts");}catch(e){toast("Import failed");}};r.readAsText(f);};inp.click();}
  $$("[data-export-verdicts]").forEach(function(b){b.addEventListener("click",exportVerdicts);});
  $$("[data-import-verdicts]").forEach(function(b){b.addEventListener("click",importVerdicts);});

  state.release=state.release||{};
  $$("[data-release-gate]").forEach(function(cb){var id=cb.getAttribute("data-release-gate");if(state.release[id]&&state.release[id].done!=null)cb.checked=!!state.release[id].done;function sync(){state.release[id]=state.release[id]||{};state.release[id].done=cb.checked;state.release[id].title=cb.getAttribute("data-release-title")||"";state.release[id].required=cb.getAttribute("data-release-required")==="1";save();}cb.addEventListener("change",sync);});
  $$("[data-release-notes]").forEach(function(ta){var id=ta.getAttribute("data-release-notes");if(state.release[id]&&state.release[id].notes)ta.value=state.release[id].notes;ta.addEventListener("input",function(){state.release[id]=state.release[id]||{};state.release[id].notes=ta.value;save();});});
  function collectRelease(){var out={};$$("[data-release-gate]").forEach(function(cb){var id=cb.getAttribute("data-release-gate");var ta=byAttr("[data-release-notes]","data-release-notes",id);out[id]={done:!!cb.checked,notes:ta?ta.value:"",title:cb.getAttribute("data-release-title")||"",required:cb.getAttribute("data-release-required")==="1"};});state.release=out;save();return out;}
  function exportRelease(){download(slug+".release.json",JSON.stringify({schema:"dossier.release/v1",slug:slug,release:collectRelease()},null,2),"application/json");}
  function importRelease(){var inp=document.createElement("input");inp.type="file";inp.accept="application/json";inp.onchange=function(){var f=inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result);var rel=packetMap(d,"release","gates");Object.keys(rel).forEach(function(id){state.release[id]=rel[id];var cb=byAttr("[data-release-gate]","data-release-gate",id);if(cb&&rel[id].done!=null)cb.checked=!!rel[id].done;var ta=byAttr("[data-release-notes]","data-release-notes",id);if(ta&&rel[id].notes!=null)ta.value=rel[id].notes;});save();toast("Imported release state");}catch(e){toast("Import failed");}};r.readAsText(f);};inp.click();}
  $$("[data-export-release]").forEach(function(b){b.addEventListener("click",exportRelease);});
  $$("[data-import-release]").forEach(function(b){b.addEventListener("click",importRelease);});

  // close the export menu after an action or an outside click
  $$(".ds-menu-list button").forEach(function(b){b.addEventListener("click",function(){var m=b.closest(".ds-menu");if(m)m.removeAttribute("open");});});
  document.addEventListener("click",function(e){var om=$(".ds-menu[open]");if(om&&!om.contains(e.target))om.removeAttribute("open");});

  // count-up on stats when they scroll into view
  function animateCount(el){var raw=el.textContent.trim();var m=raw.match(/^(\\d[\\d,]*)(.*)$/);if(!m)return;var target=parseInt(m[1].replace(/,/g,""),10);var suffix=m[2]||"";if(!isFinite(target)||target>1000000)return;if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;var dur=900,start=null;function step(ts){if(!start)start=ts;var p=Math.min((ts-start)/dur,1);var e=1-Math.pow(1-p,3);el.textContent=Math.round(e*target).toLocaleString()+suffix;if(p<1)requestAnimationFrame(step);else el.textContent=target.toLocaleString()+suffix;}requestAnimationFrame(step);}
  if(window.IntersectionObserver){var so=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){animateCount(en.target);so.unobserve(en.target);}});},{threshold:.6});$$(".ds-stat strong").forEach(function(s){so.observe(s);});}

  // heading anchors: hover reveals a # that copies a deep link
  $$(".ds-content h2[id], .ds-content h3[id]").forEach(function(h){var a=document.createElement("a");a.className="ds-anchor";a.href="#"+h.id;a.textContent="#";a.setAttribute("aria-label","Copy link to section");a.addEventListener("click",function(e){e.preventDefault();location.hash=h.id;copy(location.href.split("#")[0]+"#"+h.id,"Link copied");});h.appendChild(a);});

  // code copy
  $$("[data-code-copy]").forEach(function(btn){btn.addEventListener("click",function(e){e.stopPropagation();var box=btn.closest(".ds-code,.ds-diagram");var pre=box&&box.querySelector("pre");copy(pre?pre.innerText:"","Code copied");});});

  // back to top
  var totop=$("[data-totop]");
  if(totop){totop.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"});});window.addEventListener("scroll",function(){totop.classList.toggle("show",window.scrollY>640);},{passive:true});}

  // entrance reveal for below-the-fold blocks (added by JS, so no-JS stays visible; skips on-screen blocks to avoid flash)
  if(window.IntersectionObserver){var ro=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add("in");ro.unobserve(en.target);}});},{rootMargin:"0px 0px -6% 0px"});$$(".ds-content>.ds-block").forEach(function(b){if(b.getBoundingClientRect().top<window.innerHeight*0.92)return;b.classList.add("ds-reveal");ro.observe(b);});}

  // shortcuts: "/" focuses search, "t" toggles theme, Esc closes modal
  document.addEventListener("keydown",function(e){if(e.key==="Escape"){var m=$("[data-source-modal]");if(m)m.hidden=true;}var tag=((e.target&&e.target.tagName)||"").toLowerCase();if(tag==="input"||tag==="textarea"||(e.target&&e.target.isContentEditable)||e.metaKey||e.ctrlKey||e.altKey)return;if(e.key==="/"){e.preventDefault();var s=$("[data-search]");if(s)s.focus();else openPal();}else if(e.key==="t"){toggleTheme();}});

  // in-place text editing: toggle edit mode, sync edits into the model (Export -> Download JSON to save)
  var __editing=false,__hinted=false;
  function __findBlock(blocks,id){if(!blocks)return null;for(var i=0;i<blocks.length;i++){var b=blocks[i],r;if(b&&b.id===id)return b;if(b){if((r=__findBlock(b.blocks,id)))return r;if((r=__findBlock(b.left,id)))return r;if((r=__findBlock(b.right,id)))return r;if(b.tabs){for(var j=0;j<b.tabs.length;j++){if((r=__findBlock(b.tabs[j].blocks,id)))return r;}}if(b.candidates){for(var k=0;k<b.candidates.length;k++){if((r=__findBlock(b.candidates[k].blocks,id)))return r;}}if(b.items){for(var h=0;h<b.items.length;h++){if((r=__findBlock(b.items[h].blocks,id)))return r;}}}}return null;}
  var __editBtn=$("[data-edit-toggle]"),__editFields=$$("[data-edit]");
  if(__editBtn&&__editFields.length){
    __editFields.forEach(function(el){el.addEventListener("input",function(){if(!__editing)return;var p=el.getAttribute("data-edit"),i=p.indexOf(":"),b=__findBlock(model.blocks,p.slice(0,i));if(b)b[p.slice(i+1)]=el.innerText.trim();});});
    __editBtn.addEventListener("click",function(){__editing=!__editing;document.documentElement.classList.toggle("ds-editing",__editing);__editFields.forEach(function(el){el.contentEditable=__editing?"true":"false";});__editBtn.textContent=__editing?"Done":"Edit";if(__editing&&!__hinted){__hinted=true;toast("Edit text in place, then Export \\u25b8 Download JSON to save");}});
  }

  // theme studio: live token tweaks (applied as inline CSS vars) + brand-pack presets + copy
  var __studio=$("[data-studio]"),__studioBtn=$("[data-studio-open]");
  if(__studio&&__studioBtn){
    var __themes={};try{__themes=JSON.parse(($("#ds-themes")||{}).textContent||"{}");}catch(e){}
    var __ov={},__accIn=$("[data-studio-accent]");
    function __h2(c){c=String(c||"").replace("#","");if(!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c))return [0,0,0];if(c.length===3)c=c[0]+c[0]+c[1]+c[1]+c[2]+c[2];return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)];}
    function __darken(hex,amt){return "#"+__h2(hex).map(function(v){return ("0"+Math.max(0,Math.round(v*(1-amt))).toString(16)).slice(-2);}).join("");}
    function __rgba(hex,a){var r=__h2(hex);return "rgba("+r[0]+","+r[1]+","+r[2]+","+a+")";}
    function __set(name,val){document.documentElement.style.setProperty("--ds-"+name,val);__ov[name]=val;}
    function __setAccent(hex){__set("accent",hex);__set("accent-2",__darken(hex,0.16));__set("accent-tint",__rgba(hex,0.1));if(__accIn)__accIn.value=hex;}
    if(__accIn){__accIn.addEventListener("input",function(){__setAccent(__accIn.value);});var cur=getComputedStyle(document.documentElement).getPropertyValue("--ds-accent").trim();if(/^#/.test(cur))__accIn.value=cur;}
    $$("[data-studio-preset]").forEach(function(b){b.addEventListener("click",function(){var t=__themes[b.getAttribute("data-studio-preset")]||{};Object.keys(t).forEach(function(k){__set(k,t[k]);});if(t.accent&&__accIn)__accIn.value=t.accent;});});
    var __c=$("[data-studio-copy]");if(__c)__c.addEventListener("click",function(){copy(JSON.stringify(__ov,null,2),"Theme JSON copied, paste into meta.theme");});
    var __r=$("[data-studio-reset]");if(__r)__r.addEventListener("click",function(){Object.keys(__ov).forEach(function(k){document.documentElement.style.removeProperty("--ds-"+k);});__ov={};});
    __studioBtn.addEventListener("click",function(){__studio.hidden=!__studio.hidden;});
    var __sc=$("[data-studio-close]");if(__sc)__sc.addEventListener("click",function(){__studio.hidden=true;});
  }
})();
`;
