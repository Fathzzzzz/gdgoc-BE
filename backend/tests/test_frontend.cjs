// Run with Node; exercises actual frontend renderers using a minimal DOM.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const nodes = new Map();
const context = vm.createContext({
  URL, console, setTimeout: () => {},
  localStorage: {getItem: () => null},
  lucide: {createIcons() {}},
  document: {
    addEventListener() {},
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, {innerHTML:'',classList:{add(){},remove(){}}}); return nodes.get(id); }
  }
});
vm.runInContext(fs.readFileSync('../frontend/app.js','utf8'), context);
vm.runInContext(`
  if (safeImageUrl('javascript:alert(1)') !== '') throw Error('Unsafe image URL');
  if (escapeHtml('<script>') !== '&lt;script&gt;') throw Error('Unsafe text');
  state.watchedList = [{movie_id:1,rating:5,review:'<img src=x onerror=alert(1)>',movie:{title:'<script>x</script>',year:2000,poster_url:'https://example.com/x.jpg'}}];
  renderWatchedList();
`, context);
const html = nodes.get('watched-list').innerHTML;
assert(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
assert(!html.includes('<script>'));
vm.runInContext(`
  state.allMovies=[{id:1,title:'<script>x</script>',year:2000,poster_url:'https://example.com/x.jpg'}];
  renderAiRecommendation({movie_id:1,reasoning:'<svg onload=alert(1)>'});
`, context);
assert(nodes.get('ai-result-container').innerHTML.includes('&lt;svg onload=alert(1)&gt;'));
console.log('Frontend text/URL rendering checks passed.');
