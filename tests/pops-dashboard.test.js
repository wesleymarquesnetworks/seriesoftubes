const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./harness');

function base(ev) {
  ev("ACT.start({});S.cash=1e8;for(const g of GOALS)S.done[g.id]=0;ACT.launchBB({city:'fra'})");
}

test('NOC dashboard POPs view lists all points of presence with status, diversity and generator info', () => {
  const { ev, dom, errors } = load();
  base(ev);
  const doc = dom.window.document;

  // Add more POPs with diverse configurations
  // Amsterdam: Dual-site (A + B), backup generator, 2 routers
  ev("ACT.buildPop({city:'ams'});ACT.addSite({city:'ams'});ACT.addGen({city:'ams'});S.pops.ams.routers=2;compute();renderAll()");
  // Paris: Site A only, no generator, 1 router
  ev("ACT.buildPop({city:'par'});compute();renderAll()");
  // London: Site A only, generator installed, down outage
  ev("ACT.buildPop({city:'lon'});ACT.addGen({city:'lon'});S.pops.lon.down=S.day+2;compute();renderAll()");

  // Open NOC dashboard POPs tab
  ev("ACT.popOpen()");
  assert.equal(ev("$('dash').hidden"), false);
  assert.equal(ev("UI.dtab"), 'pops');

  // Check summary statistics in tiles
  const tiles = [...doc.querySelectorAll('#popsSec .dgrid .tile')].map(t => t.textContent);
  assert.match(tiles[0], /4/, 'Total 4 POPs (fra, ams, par, lon)');
  assert.match(tiles[1], /1/, '1 dual-site metro (ams)');
  assert.match(tiles[2], /2/, '2 generators (ams, lon)');
  assert.match(tiles[3], /1/, '1 attention (lon down)');

  // Check desktop table rows
  const getCityNames = () => [...doc.querySelectorAll('#popsSec table tbody tr td:first-child b')].map(b => b.textContent);
  assert.equal(getCityNames().length, 4);

  // Filter by attention: only London is down
  ev("ACT.popF({v:'attn'})");
  assert.deepEqual(getCityNames(), ['London']);

  // Filter by dual-site: only Amsterdam
  ev("ACT.popF({v:'site2'})");
  assert.deepEqual(getCityNames(), ['Amsterdam']);
  assert.match(doc.querySelector('#popsSec table tbody tr').textContent, /Sites A \+ B/);

  // Filter by no generator: Paris and Frankfurt (start city without gen)
  ev("ACT.popF({v:'nogen'})");
  assert.deepEqual(getCityNames().sort(), ['Frankfurt', 'Paris']);

  // Clear filters
  ev("ACT.popF({v:''})");
  assert.equal(getCityNames().length, 4);

  // Sort by city name ascending
  ev("ACT.popSort({k:'city'})");
  assert.deepEqual(getCityNames(), ['Amsterdam', 'Frankfurt', 'London', 'Paris']);

  // Sort by routers descending
  ev("ACT.popSort({k:'routers'})");
  assert.equal(getCityNames()[0], 'Amsterdam', 'Amsterdam has 2 routers');

  // Test popGo action: jumping to a POP closes dash and focuses the city
  ev("ACT.popGo({city:'ams'})");
  assert.equal(ev("$('dash').hidden"), true);
  assert.equal(ev("UI.sel.id"), 'ams');
  assert.equal(ev("UI.tab"), 'links');

  assert.deepEqual(errors, []);
});
