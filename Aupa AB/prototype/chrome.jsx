// AUPA AB — chrome: header, footer, drawer, search overlay

const { useState: useStateH, useEffect: useEffectH } = React;

// ============================================================================
// Logo — uses uploaded logo.png inside an AUPA wordmark
// ============================================================================
const LogoMark = ({ size = 32 }) => (
  <img src="logo.png" alt="AUPA AB" style={{
    width: size, height: size, borderRadius: 6,
    flexShrink: 0, display: 'block',
  }}/>
);

const Logo = ({ variant = 'full', size = 36 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <LogoMark size={size}/>
    {variant === 'full' && (
      <span style={{
        fontSize: 9.5, color: 'var(--text-secondary)',
        letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600,
        borderLeft: '1px solid var(--border-default)',
        paddingLeft: 10, marginLeft: 2,
        lineHeight: 1.3, maxWidth: 100,
      }}>Tribune<br/>des supporters</span>
    )}
  </div>
);

// ============================================================================
// Header (responsive)
// ============================================================================
const Header = ({ route, navigate, isMobile, onMenu, onSearch, theme, onToggleTheme }) => {
  const navItems = [
    { id: 'home', label: 'À la une' },
    { id: 'actu', label: 'Actualités' },
    { id: 'match', label: 'Match' },
    { id: 'mercato', label: 'Mercato' },
    { id: 'tribune', label: 'Tribune' },
  ];

  if (isMobile) {
    return (
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: 56,
        background: theme === 'dark' ? 'rgba(14,17,22,0.92)' : 'rgba(250,250,247,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', padding: '0 16px',
        gap: 12,
      }}>
        <button onClick={() => navigate({ name: 'home' })} style={{ display: 'flex' }}>
          <Logo size={32}/>
        </button>
        <div style={{ flex: 1 }}/>
        <button onClick={onSearch} style={{ color: 'var(--text-primary)', padding: 8 }} aria-label="Recherche">
          <Icon name="search" size={20}/>
        </button>
        <button onClick={onToggleTheme} style={{ color: 'var(--text-primary)', padding: 8 }} aria-label="Theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20}/>
        </button>
        <button onClick={onMenu} style={{ color: 'var(--text-primary)', padding: 8 }} aria-label="Menu">
          <Icon name="menu" size={22}/>
        </button>
      </header>
    );
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      height: 72,
      background: theme === 'dark' ? 'rgba(14,17,22,0.92)' : 'rgba(250,250,247,0.92)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', height: '100%',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', gap: 32,
      }}>
        <button onClick={() => navigate({ name: 'home' })} style={{ display: 'flex' }}>
          <Logo size={36}/>
        </button>

        <nav style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
          {navItems.map(n => {
            const active = route.name === n.id || (n.id === 'actu' && route.name === 'actu');
            return (
              <button key={n.id} onClick={() => navigate({ name: n.id })} style={{
                padding: '10px 14px', fontSize: 14, fontWeight: 500,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                position: 'relative',
                transition: 'color 100ms',
              }}>
                {n.label}
                {active && (
                  <span style={{
                    position: 'absolute', bottom: -1, left: 14, right: 14, height: 2,
                    background: 'var(--blue-aviron)', borderRadius: 1,
                  }}/>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={onSearch} style={{
            padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 8,
            color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)', fontSize: 13,
            background: 'var(--bg-elevated)',
            minWidth: 180,
          }}>
            <Icon name="search" size={15}/>
            <span style={{ flex: 1, textAlign: 'left' }}>Recherche…</span>
            <kbd style={{
              fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 500,
              background: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: 3,
              color: 'var(--text-tertiary)',
            }}>⌘ K</kbd>
          </button>
          <button onClick={onToggleTheme} style={{
            color: 'var(--text-primary)', padding: 8, borderRadius: 'var(--radius-md)',
          }} aria-label="Theme">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18}/>
          </button>
          <Button variant="ghost" size="sm" icon="user" onClick={() => navigate({ name: 'login' })}>
            Se connecter
          </Button>
          <Button variant="primary" size="sm">S'inscrire</Button>
        </div>
      </div>
    </header>
  );
};

// ============================================================================
// Mobile drawer
// ============================================================================
const MobileDrawer = ({ open, onClose, navigate, route }) => {
  const navItems = [
    { id: 'home', label: 'À la une', icon: 'home' },
    { id: 'actu', label: 'Toutes les actualités', icon: 'newspaper' },
    { id: 'match', label: 'Match', icon: 'calendar' },
    { id: 'mercato', label: 'Mercato', icon: 'arrowRight' },
    { id: 'tribune', label: 'Tribune supporters', icon: 'users' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 80,
      pointerEvents: open ? 'auto' : 'none',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(11,37,69,0.5)',
        opacity: open ? 1 : 0,
        transition: 'opacity 200ms ease',
        backdropFilter: 'blur(4px)',
      }}/>
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '88%', maxWidth: 360,
        background: 'var(--bg-default)',
        borderLeft: '1px solid var(--border-subtle)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ height: 56, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
          <Logo size={32}/>
          <button onClick={onClose} style={{ padding: 8, color: 'var(--text-primary)' }}><Icon name="x" size={22}/></button>
        </div>
        <nav style={{ padding: '12px 8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => { navigate({ name: n.id }); onClose(); }} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', fontSize: 16, fontWeight: 500,
              color: route.name === n.id ? 'var(--blue-aviron)' : 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'left',
            }}>
              <Icon name={n.icon} size={20}/>
              {n.label}
            </button>
          ))}
          <div style={{ flex: 1 }}/>
          <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle)', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button variant="primary" fullWidth onClick={() => { navigate({ name: 'login' }); onClose(); }}>Se connecter</Button>
            <Button variant="secondary" fullWidth>Créer un compte</Button>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', margin: '8px 0 0', lineHeight: 1.4 }}>
              Site non officiel. Pas affilié à l'Aviron Bayonnais. Faits par des supporters, sur leur temps libre, avec amour.
            </p>
          </div>
        </nav>
      </div>
    </div>
  );
};

// ============================================================================
// Search overlay
// ============================================================================
const SearchOverlay = ({ open, onClose, navigate, isMobile }) => {
  const [q, setQ] = useStateH('');
  const inputRef = React.useRef(null);
  useEffectH(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 50);
    }
    if (!open) setQ('');
  }, [open]);

  const results = q ? AUPA_DATA.articles.filter(a =>
    a.title.toLowerCase().includes(q.toLowerCase()) ||
    (a.lede || '').toLowerCase().includes(q.toLowerCase())
  ).slice(0, 6) : [];

  const highlight = (text) => {
    if (!q) return text;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(re).map((part, i) =>
      part.toLowerCase() === q.toLowerCase()
        ? <mark key={i} style={{ background: 'rgba(0,153,216,0.25)', color: 'inherit', padding: '0 2px', borderRadius: 2 }}>{part}</mark>
        : part
    );
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(11,37,69,0.65)',
        backdropFilter: 'blur(8px)',
        animation: 'aupa-fade 150ms ease',
      }}/>
      <div style={{
        position: 'absolute',
        top: isMobile ? 0 : '10%',
        left: isMobile ? 0 : '50%',
        right: isMobile ? 0 : 'auto',
        bottom: isMobile ? 0 : 'auto',
        width: isMobile ? '100%' : 640,
        maxWidth: '100%',
        transform: isMobile ? 'none' : 'translateX(-50%)',
        background: 'var(--bg-default)',
        borderRadius: isMobile ? 0 : 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        maxHeight: isMobile ? '100%' : '80vh',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Icon name="search" size={20}/>
          <input
            ref={inputRef}
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Spedding, mercato, Toulouse…"
            style={{
              flex: 1, fontSize: 18, fontFamily: 'var(--font-sans)',
              fontWeight: 400, color: 'var(--text-primary)',
              background: 'transparent', border: 'none', outline: 'none',
            }}/>
          <kbd style={{ fontSize: 11, padding: '2px 8px', border: '1px solid var(--border-default)', borderRadius: 4, color: 'var(--text-secondary)' }}>esc</kbd>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {!q && (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h4 className="t-meta" style={{ margin: '0 0 12px' }}>Recherches populaires</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {AUPA_DATA.popularSearches.map(s => (
                    <button key={s} onClick={() => setQ(s)} style={{
                      padding: '6px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 13, fontWeight: 500,
                      color: 'var(--text-primary)',
                    }}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="t-meta" style={{ margin: '0 0 12px' }}>Index</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                  3 247 articles indexés. 412 sources surveillées. Mises à jour toutes les 15 min. Si vous ne trouvez pas, ça n'existe sans doute pas (ou alors c'est trop frais).
                </p>
              </div>
            </div>
          )}
          {q && results.length > 0 && (
            <div style={{ padding: '8px 8px 16px' }}>
              {results.map(a => (
                <button key={a.id} onClick={() => { navigate({ name: 'article', id: a.id }); onClose(); }} style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  padding: '12px 16px', textAlign: 'left',
                  width: '100%', borderRadius: 'var(--radius-md)',
                  transition: 'background 100ms',
                }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                   onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                    <EditorialThumb article={a} size="xs" w="100%" h="100%"/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <Badge variant="category" size="sm">{a.category}</Badge>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{a.time}</span>
                    </div>
                    <h4 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 500, lineHeight: 1.3 }}>
                      {highlight(a.title)}
                    </h4>
                  </div>
                </button>
              ))}
            </div>
          )}
          {q && results.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Lauburu size={48} stroke="var(--text-tertiary)" opacity={0.5}/>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 17, margin: '16px 0 6px' }}>
                Aucun article ne correspond à « {q} »
              </h4>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                Essayez avec moins de mots. Ou abonnez-vous à la newsletter, on vous le dira quand ça arrivera.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Footer
// ============================================================================
const Footer = ({ isMobile, navigate }) => (
  <footer style={{
    background: 'var(--bg-subtle)',
    borderTop: '1px solid var(--border-subtle)',
    marginTop: 64,
    padding: isMobile ? '40px 20px 32px' : '64px 32px 40px',
  }}>
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr 1fr 1fr',
        gap: isMobile ? 32 : 48,
        marginBottom: 40,
      }}>
        <div>
          <Logo size={40}/>
          <p style={{
            margin: '20px 0 0', fontSize: 14.5, lineHeight: 1.6,
            color: 'var(--text-secondary)', maxWidth: 340,
          }}>
            L'agrégateur d'actualités <em>officiellement non-officiel</em> de l'Aviron Bayonnais. Fait par des supporters, pour des supporters. Pas de pop-up, pas de carrousel, juste du rugby.
          </p>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-tertiary)' }}>
            Site indépendant · Aucun lien capitalistique avec le club
          </p>
        </div>

        <div>
          <h5 className="t-meta" style={{ margin: '0 0 16px' }}>Le site</h5>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['À la une', 'home'],
              ['Toutes les actualités', 'actu'],
              ['Tribune supporters', 'tribune'],
              ['Newsletter', 'newsletter'],
              ['Mon compte', 'account'],
            ].map(([label, id]) => (
              <li key={id}><a onClick={() => navigate({ name: id })} style={{ fontSize: 14, color: 'var(--text-primary)', cursor: 'pointer' }}>{label}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="t-meta" style={{ margin: '0 0 16px' }}>Sources</h5>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(AUPA_DATA.sources).slice(0, 6).map(([k, s]) => (
              <li key={k} style={{ fontSize: 14, color: 'var(--text-primary)' }}>{s.name}</li>
            ))}
            <li><a style={{ fontSize: 13, color: 'var(--blue-aviron)', cursor: 'pointer' }}>Voir les 412 sources →</a></li>
          </ul>
        </div>

        <div>
          <h5 className="t-meta" style={{ margin: '0 0 16px' }}>Légal & friandises</h5>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['À propos', 'Charte', 'Mentions légales', 'Confidentialité', 'CGU', 'Contact'].map(l => (
              <li key={l}><a style={{ fontSize: 14, color: 'var(--text-primary)', cursor: 'pointer' }}>{l}</a></li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{
        paddingTop: 24, borderTop: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        gap: 12, alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          © 2026 AUPA AB · <em>Construit à Bayonne, lu partout</em>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Lauburu size={20} stroke="var(--blue-aviron)" strokeWidth={1.5}/>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
            <em>Aupa hi !</em>
          </span>
        </div>
      </div>
    </div>
  </footer>
);

Object.assign(window, { Logo, LogoMark, Header, MobileDrawer, SearchOverlay, Footer });
