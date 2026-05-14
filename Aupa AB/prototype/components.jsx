// AUPA AB — shared components & atoms
// Loaded after React + data.js

const { useState, useEffect, useRef, useMemo, useCallback, Fragment } = React;

const DATA = window.AUPA_DATA;

// ============================================================================
// Icons (Lucide-style, stroke 1.5)
// ============================================================================
const Icon = ({ name, size = 20, stroke = 1.5, ...rest }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', ...rest };
  const paths = {
    menu: <><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    search: <><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
    home: <><path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></>,
    newspaper: <><path d="M4 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4z"/><path d="M20 4v16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2"/><line x1="7" y1="9" x2="15" y2="9"/><line x1="7" y1="13" x2="15" y2="13"/><line x1="7" y1="17" x2="11" y2="17"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>,
    share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
    message: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>,
    more: <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    chevronDown: <polyline points="6 9 12 15 18 9"/>,
    chevronUp: <polyline points="18 15 12 9 6 15"/>,
    chevronRight: <polyline points="9 18 15 12 9 6"/>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
    check: <polyline points="20 6 9 17 4 12"/>,
    flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>,
    arrowUp: <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    mapPin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    tv: <><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></>,
  };
  return <svg {...common}>{paths[name] || null}</svg>;
};

// ============================================================================
// Lauburu (Basque cross) — used as accent mark + filigree
// ============================================================================
const Lauburu = ({ size = 24, stroke = 'currentColor', fill = 'none', strokeWidth = 1.5, opacity = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
    <g stroke={stroke} fill={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M50 50 C50 30, 30 30, 30 50 C30 40, 40 40, 50 50 Z" transform="rotate(0 50 50)"/>
      <path d="M50 50 C50 30, 30 30, 30 50 C30 40, 40 40, 50 50 Z" transform="rotate(90 50 50)"/>
      <path d="M50 50 C50 30, 30 30, 30 50 C30 40, 40 40, 50 50 Z" transform="rotate(180 50 50)"/>
      <path d="M50 50 C50 30, 30 30, 30 50 C30 40, 40 40, 50 50 Z" transform="rotate(270 50 50)"/>
    </g>
  </svg>
);

// ============================================================================
// Button
// ============================================================================
const Button = ({ children, variant = 'primary', size = 'md', fullWidth, onClick, href, type = 'button', icon, iconRight, ...rest }) => {
  const heights = { sm: 32, md: 40, lg: 48 };
  const paddings = { sm: '0 12px', md: '0 16px', lg: '0 24px' };
  const sizes = { sm: 14, md: 15, lg: 17 };
  const variants = {
    primary: { background: 'var(--blue-aviron)', color: '#fff', border: '1px solid var(--blue-aviron)' },
    secondary: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' },
    ghost: { background: 'transparent', color: 'var(--blue-aviron)', border: '1px solid transparent' },
    danger: { background: 'var(--red-ikurrina)', color: '#fff', border: '1px solid var(--red-ikurrina)' },
    dark: { background: 'var(--blue-night)', color: '#fff', border: '1px solid var(--blue-night)' },
  };
  const style = {
    ...variants[variant],
    height: heights[size],
    padding: paddings[size],
    fontSize: sizes[size],
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    borderRadius: 'var(--radius-md)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: fullWidth ? '100%' : 'auto',
    transition: 'background 100ms ease, border-color 100ms ease',
    whiteSpace: 'nowrap',
  };
  const inner = <>{icon && <Icon name={icon} size={size === 'sm' ? 14 : 16}/>}<span>{children}</span>{iconRight && <Icon name={iconRight} size={size === 'sm' ? 14 : 16}/>}</>;
  if (href) return <a href={href} onClick={onClick} style={style} {...rest}>{inner}</a>;
  return <button type={type} onClick={onClick} style={style} {...rest}>{inner}</button>;
};

// ============================================================================
// Badge / Tag
// ============================================================================
const Badge = ({ children, variant = 'default', size = 'md', icon, dot, pulse }) => {
  const variants = {
    default: { background: 'var(--sand)', color: 'var(--text-primary)' },
    category: { background: 'rgba(0, 153, 216, 0.12)', color: 'var(--blue-aviron)' },
    live: { background: 'var(--red-ikurrina)', color: '#fff' },
    success: { background: 'rgba(47, 143, 79, 0.15)', color: 'var(--success)' },
    outline: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-default)' },
    sponsored: { background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' },
  };
  const sizes = { sm: { padding: '2px 8px', fontSize: 10.5 }, md: { padding: '4px 10px', fontSize: 11.5 }};
  return (
    <span style={{
      ...variants[variant], ...sizes[size],
      borderRadius: 'var(--radius-full)',
      fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
    }}>
      {pulse && <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'currentColor', animation: 'aupa-pulse 1.4s ease-in-out infinite' }}/>}
      {icon && <Icon name={icon} size={12}/>}
      {children}
    </span>
  );
};

// ============================================================================
// Avatar
// ============================================================================
const Avatar = ({ char = '?', size = 40, bg = '#0099D8', color = '#fff' }) => (
  <div style={{
    width: size, height: size, borderRadius: 9999, background: bg, color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 600, fontSize: size * 0.4, fontFamily: 'var(--font-sans)',
    flexShrink: 0,
  }}>{char}</div>
);

// ============================================================================
// SourceChip — source logo + name
// ============================================================================
const SourceChip = ({ sourceKey, size = 'md' }) => {
  const s = DATA.sources[sourceKey];
  if (!s) return null;
  const dims = size === 'sm' ? { box: 16, font: 8.5 } : { box: 20, font: 10 };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: dims.box, height: dims.box, borderRadius: 3, background: s.color, color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: dims.font, fontWeight: 700, letterSpacing: '0.02em',
        fontFamily: 'var(--font-sans)',
      }}>{s.mono}</span>
      <span style={{ fontSize: size === 'sm' ? 11 : 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{s.name}</span>
    </span>
  );
};

// ============================================================================
// Editorial Thumbnail — auto-generated cover for articles
// 3 variants per brief §7.1
// ============================================================================
const EditorialThumb = ({ article, variant, w, h, large, size }) => {
  const v = variant || (article.category === 'Pays Basque' || article.id === 'derby-biarritz' ? 'wave' : (article.id.charCodeAt(0) + article.id.charCodeAt(1)) % 3);
  const map = { 0: 'night', 1: 'sand', 2: 'aviron', 'night': 'night', 'sand': 'sand', 'wave': 'wave', 'aviron': 'aviron' };
  const chosen = map[v] || 'night';

  // size: 'xs' (compact 80px), 'sm' (row 96-146), 'md' (lead 4:3), 'lg' (hero)
  const sz = size || (large ? 'lg' : 'md');
  const titleFont = { xs: 13, sm: 16, md: 22, lg: 38 }[sz];
  const padding   = { xs: 10, sm: 14, md: 20, lg: 44 }[sz];
  const monoFont  = { xs: 8,  sm: 9,  md: 10, lg: 12 }[sz];
  const lines     = { xs: 3,  sm: 3,  md: 4,  lg: 5 }[sz];
  const source = AUPA_DATA.sources[article.source];

  const palettes = {
    night: { bg: '#0B2545', fg: '#FAFAF7', filFG: '#3FB0E5' },
    sand: { bg: '#EFEAE0', fg: '#0B2545', filFG: '#0099D8' },
    aviron: { bg: '#0099D8', fg: '#FAFAF7', filFG: '#FAFAF7' },
    wave: { bg: '#0099D8', fg: '#FAFAF7', filFG: '#FAFAF7' },
  };
  const p = palettes[chosen];

  return (
    <div style={{
      position: 'relative', width: w || '100%', height: h || '100%',
      background: p.bg, color: p.fg, overflow: 'hidden',
      borderRadius: 'inherit',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding,
    }}>
      {/* Filigree */}
      {chosen === 'night' && (
        <svg style={{ position: 'absolute', right: '-15%', top: '50%', transform: 'translateY(-50%)', opacity: 0.06, width: '120%', height: '120%' }} viewBox="0 0 100 100">
          <g stroke={p.filFG} fill="none" strokeWidth="0.8">
            <path d="M50 50 C50 30, 30 30, 30 50 C30 40, 40 40, 50 50 Z" transform="rotate(0 50 50)"/>
            <path d="M50 50 C50 30, 30 30, 30 50 C30 40, 40 40, 50 50 Z" transform="rotate(90 50 50)"/>
            <path d="M50 50 C50 30, 30 30, 30 50 C30 40, 40 40, 50 50 Z" transform="rotate(180 50 50)"/>
            <path d="M50 50 C50 30, 30 30, 30 50 C30 40, 40 40, 50 50 Z" transform="rotate(270 50 50)"/>
          </g>
        </svg>
      )}
      {chosen === 'sand' && (
        <div style={{ position: 'absolute', left: padding, right: padding, bottom: padding * 0.7, height: 2, background: 'var(--blue-aviron)' }}/>
      )}
      {chosen === 'wave' && (
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.18 }} width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
          <path d="M0 100 Q 50 60, 100 100 T 200 100 T 300 100 T 400 100 V 200 H 0 Z" fill={p.filFG}/>
          <path d="M0 130 Q 50 100, 100 130 T 200 130 T 300 130 T 400 130 V 200 H 0 Z" fill={p.filFG} opacity="0.5"/>
        </svg>
      )}
      {chosen === 'aviron' && (
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.08 }} width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
          {Array.from({length: 6}).map((_, i) => (
            <line key={i} x1={i * 80} y1="0" x2={i * 80 - 120} y2="200" stroke={p.filFG} strokeWidth="40"/>
          ))}
        </svg>
      )}

      {/* Top: source */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {source && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: monoFont + 1, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
            opacity: 0.85,
          }}>
            <span style={{
              width: monoFont * 2 + 4, height: monoFont * 2 + 4, borderRadius: 3,
              background: chosen === 'night' ? p.fg : (chosen === 'sand' ? p.bg : 'rgba(255,255,255,0.2)'),
              color: chosen === 'night' ? p.bg : (chosen === 'sand' ? p.fg : p.fg),
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: monoFont, fontWeight: 700,
            }}>{source.mono}</span>
            {source.name}
          </span>
        )}
        {sz !== 'xs' && (
          <span style={{ fontSize: monoFont + 1, opacity: 0.7, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
            {article.date || article.time}
          </span>
        )}
      </div>

      {/* Middle: title */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', paddingTop: padding * 0.4, paddingBottom: padding * 0.4 }}>
        <h3 style={{
          margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 600,
          fontSize: titleFont, lineHeight: 1.08,
          letterSpacing: '-0.012em',
          color: p.fg,
          display: '-webkit-box', WebkitBoxOrient: 'vertical',
          WebkitLineClamp: lines,
          overflow: 'hidden',
          fontVariationSettings: '"opsz" 96, "SOFT" 40',
        }}>{article.title}</h3>
      </div>

      {/* Bottom: AUPA AB monogram */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <span style={{ fontSize: monoFont + 1, letterSpacing: '0.18em', fontWeight: 700, opacity: 0.7 }}>
          AUPA · AB
        </span>
        {sz !== 'xs' && (
          <span style={{ fontSize: monoFont + 1, opacity: 0.55, letterSpacing: '0.06em', fontWeight: 500, textTransform: 'uppercase' }}>
            {article.category}
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Ad slots — 4 variants per brief §12
// ============================================================================
const AdSlot = ({ variant = 'leaderboard', isMobile }) => {
  const baseStyle = {
    background: 'var(--bg-subtle)',
    borderRadius: 'var(--radius-md)',
    border: '1px dashed var(--border-default)',
    padding: 'var(--space-4)',
    position: 'relative',
  };
  const label = (
    <span style={{
      position: 'absolute', top: 8, left: 12,
      fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase',
      color: 'var(--text-tertiary)', fontWeight: 500, opacity: 0.85,
    }}>Publicité</span>
  );

  if (variant === 'leaderboard') {
    return (
      <div style={{ ...baseStyle, height: isMobile ? 110 : 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {label}
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: isMobile ? 17 : 22, fontWeight: 600, color: 'var(--text-primary)' }}>
            Hégia Cidre Basque
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Le sponsor maillot qu'on évoque ici sans crier.</div>
          <div style={{ fontSize: 10.5, marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{isMobile ? '320 × 100' : '970 × 130 native'}</div>
        </div>
      </div>
    );
  }

  if (variant === 'native') {
    return (
      <div style={{
        ...baseStyle, padding: 0, display: 'flex', gap: 16, overflow: 'hidden',
        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          width: isMobile ? 96 : 200, flexShrink: 0, aspectRatio: '3 / 2',
          background: 'linear-gradient(135deg, #C8102E, #8B0000)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: isMobile ? 22 : 32,
          letterSpacing: '0.04em',
        }}>PIPER</div>
        <div style={{ padding: '14px 16px 14px 0', flex: 1 }}>
          <Badge variant="sponsored" size="sm">Sponsorisé · Piperade Lab</Badge>
          <h4 style={{
            margin: '8px 0 4px', fontFamily: 'var(--font-serif)', fontWeight: 500,
            fontSize: isMobile ? 15 : 18, lineHeight: 1.25, color: 'var(--text-primary)',
          }}>Le piment d'Espelette livré chez vous, en 48h. Évidemment.</h4>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Production locale, AOP, depuis Itxassou. Un code pour les abonnés AUPA dans l'article.
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'box') {
    return (
      <div style={{ ...baseStyle, aspectRatio: '6 / 5', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 300, margin: '0 auto' }}>
        {label}
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.15 }}>
            Bibitalk
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.4 }}>
            Le bar à vin de la rue Pannecau cherche un serveur (bilingue basque-français apprécié).
          </div>
          <div style={{ fontSize: 10.5, marginTop: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>300 × 250</div>
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div style={{ ...baseStyle, aspectRatio: '6 / 5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {label}
        <div style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Etxe Peio</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.35 }}>
            Restaurant basque, Saint-Pée-sur-Nivelle. Brunch d'avant-match dimanche midi.
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// ============================================================================
// Match banner — next fixture
// ============================================================================
const MatchBanner = ({ compact, onMobile }) => {
  const m = DATA.nextMatch;
  return (
    <div style={{
      background: 'var(--blue-night)',
      color: '#FAFAF7',
      borderRadius: compact ? 0 : 'var(--radius-lg)',
      padding: onMobile ? '20px 20px' : '28px 32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Lauburu watermark */}
      <svg style={{ position: 'absolute', right: -30, top: '50%', transform: 'translateY(-50%)', opacity: 0.07 }}
           width={onMobile ? 180 : 280} height={onMobile ? 180 : 280} viewBox="0 0 100 100">
        <g stroke="#3FB0E5" fill="none" strokeWidth="0.8">
          <path d="M50 50 C50 30, 30 30, 30 50 C30 40, 40 40, 50 50 Z" transform="rotate(0 50 50)"/>
          <path d="M50 50 C50 30, 30 30, 30 50 C30 40, 40 40, 50 50 Z" transform="rotate(90 50 50)"/>
          <path d="M50 50 C50 30, 30 30, 30 50 C30 40, 40 40, 50 50 Z" transform="rotate(180 50 50)"/>
          <path d="M50 50 C50 30, 30 30, 30 50 C30 40, 40 40, 50 50 Z" transform="rotate(270 50 50)"/>
        </g>
      </svg>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: onMobile ? 'column' : 'row', gap: onMobile ? 16 : 32, alignItems: onMobile ? 'flex-start' : 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, color: '#3FB0E5' }}>
            Prochain match · J-{m.daysOut}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(250,250,247,0.6)', letterSpacing: '0.04em' }}>
            {m.competition} · {m.diffusion}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: onMobile ? 14 : 24, flex: onMobile ? 'unset' : 1 }}>
          {/* Home */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 6,
                background: '#0099D8', color: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 12, letterSpacing: '0.02em',
              }}>AB</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, lineHeight: 1 }}>{m.home.short}</span>
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {m.home.form.map((r, i) => (
                <span key={i} style={{
                  width: 14, height: 14, borderRadius: 3, fontSize: 8.5, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: r === 'V' ? '#2F8F4F' : r === 'D' ? '#D52B1E' : '#5A6472',
                  color: '#fff',
                }}>{r}</span>
              ))}
            </div>
          </div>

          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontStyle: 'italic', color: 'rgba(250,250,247,0.4)', fontWeight: 400 }}>vs</span>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 6,
                background: '#fff', color: '#000',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 12, letterSpacing: '0.02em',
                border: '2px solid #C8102E',
              }}>ST</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, lineHeight: 1 }}>{m.away.short}</span>
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {m.away.form.map((r, i) => (
                <span key={i} style={{
                  width: 14, height: 14, borderRadius: 3, fontSize: 8.5, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: r === 'V' ? '#2F8F4F' : r === 'D' ? '#D52B1E' : '#5A6472',
                  color: '#fff',
                }}>{r}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: onMobile ? 0 : 'auto' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Icon name="calendar" size={14}/>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{m.kickoff}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'rgba(250,250,247,0.7)' }}>
            <Icon name="mapPin" size={14}/>
            <span style={{ fontSize: 12.5 }}>{m.venue}</span>
          </div>
        </div>
      </div>

      {/* Countdown ticker */}
      {!onMobile && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: 'rgba(63,176,229,0.2)',
        }}>
          <div style={{ width: '38%', height: '100%', background: '#3FB0E5' }}/>
        </div>
      )}
    </div>
  );
};

// Export to window
Object.assign(window, { Icon, Lauburu, Button, Badge, Avatar, SourceChip, EditorialThumb, AdSlot, MatchBanner, AUPA_DATA: DATA });
