import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, SlidersHorizontal, X, MapPin, Star,
  Phone, ChevronDown, Check, Package, Building2, Wrench,
  Users, Loader2, TrendingUp, Tag, ShoppingBag, Zap
} from 'lucide-react';
import api from '../../services/api';
import { useLocationContext } from '../../context/LocationContext';

// ─── helpers ───────────────────────────────────────────────────────────────

function getPrice(item) {
  return (
    item.price?.value ||
    item.pricing?.price_per_unit ||
    item.pricing?.amount ||
    null
  );
}

function getTitle(item) {
  return item.title || item.name || item.material_name || item.business_name || 'Untitled';
}

function getImage(item) {
  return (
    item.images?.[0] ||
    item.image ||
    item.profile?.profile_picture ||
    null
  );
}

function getLocation(item) {
  const d = item.address?.district || item.district || '';
  const s = item.address?.state || item.state || '';
  return [d, s].filter(Boolean).join(', ');
}

function resolveType(item) {
  if (item.listing_type === 'property' || item.property_type) return 'property';
  if (item.listing_type === 'service' || item.service_type) return 'service';
  if (item.listing_type === 'mandi' || item.material_name) return 'mandi';
  if (item.onboarding_status || item.roles) return 'supplier';
  return 'other';
}

const TYPE_META = {
  property:  { label: 'Property',  color: 'bg-violet-100 text-violet-700',   icon: Building2 },
  service:   { label: 'Service',   color: 'bg-blue-100 text-blue-700',       icon: Wrench },
  mandi:     { label: 'Product',   color: 'bg-green-100 text-green-700',     icon: Package },
  supplier:  { label: 'Supplier',  color: 'bg-amber-100 text-amber-700',     icon: Users },
  other:     { label: 'Listing',   color: 'bg-slate-100 text-slate-600',     icon: Tag },
};

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest',    label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
];

const TYPE_TABS = [
  { value: 'all',      label: 'All',       icon: Zap },
  { value: 'service',  label: 'Services',  icon: Wrench },
  { value: 'property', label: 'Properties', icon: Building2 },
  { value: 'mandi',    label: 'Products',  icon: Package },
  { value: 'supplier', label: 'Suppliers', icon: Users },
];

function scoreItem(item, q) {
  const title = getTitle(item).toLowerCase();
  const sd = (item.short_description || '').toLowerCase();
  const desc = (item.description || item.full_description || '').toLowerCase();
  const cat = (item.category_id?.name || '').toLowerCase();
  return (
    (title.includes(q) ? 10 : 0) +
    (sd.includes(q) ? 4 : 0) +
    (desc.includes(q) ? 1 : 0) +
    (cat.includes(q) ? 2 : 0)
  );
}

// ─── Result Card ───────────────────────────────────────────────────────────

const ResultCard = ({ item, query, onClick }) => {
  const type = resolveType(item);
  const meta = TYPE_META[type] || TYPE_META.other;
  const Icon = meta.icon;
  const title = getTitle(item);
  const price = getPrice(item);
  const image = getImage(item);
  const loc = getLocation(item);
  const desc = item.short_description || item.description || '';

  function highlight(text, q) {
    if (!q || !text) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-0.5 not-italic">{part}</mark>
        : part
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md active:scale-[0.985] transition-all flex items-start gap-4 p-4 text-left"
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-16 h-16 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center border border-slate-100">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <Icon size={22} className="text-slate-300" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${meta.color}`}>
            <Icon size={8} />
            {meta.label}
          </span>
          {item.is_featured && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-orange-50 text-orange-500 border border-orange-100">
              <Star size={7} fill="currentColor" />
              Featured
            </span>
          )}
          {(item.onboarding_status === 'approved' || item.verified) && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Check size={7} />
              Verified
            </span>
          )}
        </div>

        <h3 className="text-[14px] font-semibold text-primary-900 leading-snug line-clamp-1">
          {highlight(title, query?.toLowerCase())}
        </h3>

        {desc && (
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
            {highlight(desc.slice(0, 100), query?.toLowerCase())}
          </p>
        )}

        <div className="flex items-center justify-between mt-2">
          {loc && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <MapPin size={9} />
              {loc}
            </span>
          )}
          {price ? (
            <span className="text-[13px] font-bold text-primary-900 ml-auto">
              ₹{Number(price).toLocaleString('en-IN')}
              {(item.pricing?.unit || item.price?.unit) && (
                <span className="text-[10px] font-medium text-slate-400 ml-0.5">
                  /{item.pricing?.unit || item.price?.unit}
                </span>
              )}
            </span>
          ) : type === 'supplier' ? (
            <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-blue-600">
              <Phone size={10} />
              Contact
            </span>
          ) : (
            <span className="ml-auto text-[11px] font-semibold text-primary-600">View Details</span>
          )}
        </div>
      </div>
    </button>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { location } = useLocationContext();
  const inputRef = useRef(null);

  const initialQuery = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [showSort, setShowSort] = useState(false);
  const [rawResults, setRawResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────

  const fetchResults = useCallback(async (q) => {
    if (!q?.trim()) { setRawResults([]); return; }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: q.trim(), limit: 80 });
      if (location.district) params.set('district', location.district);
      if (location.state) params.set('state', location.state);
      const res = await api.get(`/listings?${params}`);
      if (res.data.success) {
        const ql = q.trim().toLowerCase();
        const scored = (res.data.data || []).map(item => ({
          ...item,
          _score: scoreItem(item, ql),
          _type: resolveType(item),
        })).filter(item => item._score > 0);
        setRawResults(scored);
      }
    } catch {
      setError('Could not load results. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [location.district, location.state]);

  useEffect(() => { fetchResults(query); }, [query, fetchResults]);

  // ── Search submit ──────────────────────────────────────────────────────

  const handleSearch = () => {
    const q = inputValue.trim();
    if (!q) return;
    setQuery(q);
    setSearchParams({ q });
    setActiveType('all');
    setSortBy('relevance');
  };

  // ── Derived results ────────────────────────────────────────────────────

  const typeFiltered = activeType === 'all'
    ? rawResults
    : rawResults.filter(i => i._type === activeType);

  const sorted = [...typeFiltered].sort((a, b) => {
    if (sortBy === 'relevance') return b._score - a._score;
    if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sortBy === 'price_asc') return (getPrice(a) || Infinity) - (getPrice(b) || Infinity);
    if (sortBy === 'price_desc') return (getPrice(b) || 0) - (getPrice(a) || 0);
    return 0;
  });

  const countByType = TYPE_TABS.reduce((acc, tab) => {
    acc[tab.value] = tab.value === 'all'
      ? rawResults.length
      : rawResults.filter(i => i._type === tab.value).length;
    return acc;
  }, {});

  // ── Navigate to listing ────────────────────────────────────────────────

  const handleItemClick = (item) => {
    if (item._type === 'supplier') {
      navigate(`/profile/${item._id}`);
    } else {
      navigate(`/listing/${item._id}`);
    }
  };

  // ── Sort label ─────────────────────────────────────────────────────────
  const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort';

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col pb-10">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            onClick={() => navigate(-1)}
            className="shrink-0 p-2 rounded-xl border border-slate-100 text-primary-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Search bar */}
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:border-primary-400 transition-colors">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search services, properties, products…"
              className="flex-1 bg-transparent text-[14px] text-primary-900 placeholder:text-slate-400 outline-none"
            />
            {inputValue && (
              <button onClick={() => { setInputValue(''); inputRef.current?.focus(); }} className="text-slate-300 hover:text-slate-500">
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={handleSearch}
            className="shrink-0 bg-primary-900 text-white text-[13px] font-semibold px-4 py-2.5 rounded-2xl hover:bg-primary-800 active:scale-95 transition-all"
          >
            Search
          </button>
        </div>

        {/* ── Type tabs ──────────────────────────────────────────────── */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
          {TYPE_TABS.map(tab => {
            const count = countByType[tab.value] || 0;
            const active = activeType === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveType(tab.value)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                  active
                    ? 'bg-primary-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <tab.icon size={11} />
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Summary bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-[12px] text-slate-500">
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              Searching…
            </span>
          ) : query ? (
            <span>
              <span className="font-bold text-primary-900">{sorted.length}</span>
              {' '}result{sorted.length !== 1 ? 's' : ''} for{' '}
              <span className="font-bold text-primary-900">"{query}"</span>
              {location.district && (
                <span className="text-slate-400"> · {location.district}</span>
              )}
            </span>
          ) : null}
        </div>

        {/* Sort button */}
        <div className="relative">
          <button
            onClick={() => setShowSort(v => !v)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-primary-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:border-primary-200 transition-colors"
          >
            <SlidersHorizontal size={12} />
            {sortLabel}
            <ChevronDown size={11} className={`transition-transform ${showSort ? 'rotate-180' : ''}`} />
          </button>

          {showSort && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowSort(false)} />
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl border border-slate-100 shadow-xl z-40 overflow-hidden">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-[12px] font-medium transition-colors ${
                      sortBy === opt.value
                        ? 'bg-primary-50 text-primary-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                    {sortBy === opt.value && <Check size={13} className="text-primary-900" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <div className="px-4 space-y-3 flex-1">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-4 animate-pulse">
                <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-slate-100 rounded-full w-16" />
                  <div className="h-4 bg-slate-100 rounded-full w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                  <div className="h-3 bg-slate-100 rounded-full w-1/3 mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <X size={24} className="text-red-400" />
            </div>
            <p className="text-[13px] font-medium text-slate-500">{error}</p>
            <button
              onClick={() => fetchResults(query)}
              className="text-primary-600 font-semibold text-[12px] underline"
            >
              Try again
            </button>
          </div>
        ) : !query ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center">
              <Search size={32} className="text-primary-300" />
            </div>
            <h3 className="text-[15px] font-semibold text-primary-900">Search BaseraBazar</h3>
            <p className="text-[12px] text-slate-400 max-w-xs">
              Find services, properties, mandi products, and verified suppliers near you.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {['CCTV', 'AC Service', 'Apartment', 'Cement', 'Plumber'].map(s => (
                <button
                  key={s}
                  onClick={() => { setInputValue(s); setQuery(s); setSearchParams({ q: s }); }}
                  className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  <TrendingUp size={10} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
              <ShoppingBag size={28} className="text-slate-300" />
            </div>
            <h3 className="text-[14px] font-semibold text-primary-900 uppercase tracking-wide">No results found</h3>
            <p className="text-[12px] text-slate-400 max-w-xs">
              No listings matched <strong>"{query}"</strong>
              {activeType !== 'all' && ` in ${TYPE_TABS.find(t => t.value === activeType)?.label}`}.
              {activeType !== 'all' && (
                <> Try switching to <button onClick={() => setActiveType('all')} className="text-primary-600 font-semibold underline">All types</button>.</>
              )}
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              Tip: try a shorter keyword or check your spelling
            </p>
          </div>
        ) : (
          sorted.map(item => (
            <ResultCard
              key={item._id}
              item={item}
              query={query}
              onClick={() => handleItemClick(item)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SearchResults;
