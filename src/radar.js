const { parseLimit } = require('./http');
const { hydrateSignals } = require('./signals');

const ORDERS = new Set(['input', 'newest', 'oldest', 'priority', 'id-asc', 'id-desc']);

function normalizeOrder(value) {
  const order = value || 'priority';
  if (!ORDERS.has(order)) throw new Error('order no soportado');
  return order;
}

async function listPublishedSignals(client, options = {}) {
  const limit = parseLimit(options.limit);
  const order = normalizeOrder(options.order);
  const date = options.date || null;
  const variant = options.variant || 'primary';
  const category = options.category || null;
  const offset = Number.isInteger(options.offset) && options.offset >= 0 ? options.offset : 0;

  let query = client
    .from('signals')
    .select('id, title, category, impact, status, snapshot_id, priority, priority_rank, latest_source_date, snapshots!inner(snapshot_date, variant, published_at)', { count: 'exact' })
    .eq('is_published', true)
    .eq('snapshots.variant', variant)
    .not('snapshots.published_at', 'is', null);

  if (category) query = query.eq('category', category);
  if (date) query = query.eq('snapshots.snapshot_date', date);
  if (order === 'priority') query = query.order('priority_rank', { ascending: true }).order('id', { ascending: true });
  if (order === 'newest') query = query.order('latest_source_date', { ascending: false }).order('id', { ascending: true });
  if (order === 'oldest') query = query.order('latest_source_date', { ascending: true }).order('id', { ascending: true });
  if (order === 'id-asc' || order === 'input') query = query.order('id', { ascending: true });
  if (order === 'id-desc') query = query.order('id', { ascending: false });

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) throw error;

  const hydrated = await hydrateSignals(client, data || []);
  return {
    snapshot_date: hydrated[0]?.row.snapshots?.snapshot_date || date,
    count: hydrated.length,
    total: count || 0,
    order,
    signals: hydrated.map((item) => item.signal),
  };
}

async function getPublishedSignal(client, id) {
  const { data, error } = await client
    .from('signals')
    .select('id, title, category, impact, status, snapshot_id, priority, priority_rank, latest_source_date, snapshots!inner(snapshot_date, variant, published_at)')
    .eq('id', id)
    .eq('is_published', true)
    .not('snapshots.published_at', 'is', null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [hydrated] = await hydrateSignals(client, [data]);
  return hydrated.signal;
}

module.exports = { getPublishedSignal, listPublishedSignals };
