// AUPA AB — pages

// ============================================================================
// HOME
// ============================================================================
const HomePage = ({ isMobile, navigate, tweaks }) => {
  const articles = AUPA_DATA.articles;
  const featured = articles[0];
  const leads = articles.slice(1, 5);
  const matchSection = articles.filter(a => ['avant-match-toulouse','patat-conf','billetterie-toulouse'].includes(a.id));
  const mercatoSection = articles.filter(a => a.category === 'Mercato');
  const coulisses = articles.filter(a => ['lopez-vintage','umaga-rumeur','la-rochelle-bilan'].includes(a.id));

  const SectionHeader = ({ title, kicker, link }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: isMobile ? 16 : 24 }}>
      <div>
        {kicker && <span className="t-meta" style={{ display: 'block', marginBottom: 4, color: 'var(--blue-aviron)' }}>{kicker}</span>}
        <h2 style={{
          margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 600,
          fontSize: isMobile ? 26 : 34, lineHeight: 1.1, letterSpacing: '-0.012em',
          fontVariationSettings: '"opsz" 72, "SOFT" 20',
        }}>{title}</h2>
      </div>
      {link && (
        <a onClick={() => navigate({ name: 'actu', filter: link.filter })} style={{
          fontSize: 13, fontWeight: 500, color: 'var(--blue-aviron)',
          display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>{link.label} <Icon name="arrowRight" size={14}/></a>
      )}
    </div>
  );

  return (
    <main>
      {/* Match banner (always-on or off based on tweak) */}
      {tweaks.showMatch && (
        <div style={{
          padding: isMobile ? 0 : '24px 32px 0',
          maxWidth: isMobile ? '100%' : 1280, margin: '0 auto',
        }}>
          <MatchBanner onMobile={isMobile}/>
        </div>
      )}

      {/* Hero: featured article */}
      <section style={{
        padding: isMobile ? '24px 16px' : '40px 32px',
        maxWidth: isMobile ? '100%' : 1280, margin: '0 auto',
      }}>
        <ArticleCard article={featured} variant="featured" isMobile={isMobile} onOpen={(id) => navigate({ name: 'article', id })}/>
      </section>

      {/* Editorial pitch — humorous strapline */}
      {!isMobile && (
        <section style={{
          padding: '0 32px 32px', maxWidth: 1280, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24,
        }}>
          {[
            { kpi: '412', label: 'Sources surveillées', note: 'parfois la même rumeur dans 12 médias.' },
            { kpi: '3 247', label: 'Articles indexés', note: 'depuis le retour en Top 14.' },
            { kpi: '15 min', label: 'Fréquence de scan', note: 'on dort un peu, quand même.' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '20px 24px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'baseline', gap: 16,
            }}>
              <span style={{
                fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 44, lineHeight: 1,
                color: 'var(--blue-aviron)', flexShrink: 0,
                fontVariationSettings: '"opsz" 120',
              }} className="tnum">{s.kpi}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{s.note}</div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Leaderboard ad */}
      <section style={{ padding: isMobile ? '0 16px' : '0 32px', maxWidth: isMobile ? '100%' : 1280, margin: '0 auto' }}>
        <AdSlot variant="leaderboard" isMobile={isMobile}/>
      </section>

      {/* À la une grid */}
      <section style={{
        padding: isMobile ? '40px 16px 32px' : '64px 32px 40px',
        maxWidth: isMobile ? '100%' : 1280, margin: '0 auto',
      }}>
        <SectionHeader kicker="À la une" title="Ce qu'il faut lire ce matin" link={{ label: 'Tout voir', filter: 'all' }}/>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 16 : 24,
        }}>
          {leads.slice(0, isMobile ? 4 : 3).map(a => (
            <ArticleCard key={a.id} article={a} variant="lead" onOpen={(id) => navigate({ name: 'article', id })}/>
          ))}
        </div>
      </section>

      {/* Match section + Mercato grid */}
      <section style={{
        padding: isMobile ? '16px 16px 32px' : '32px 32px 56px',
        maxWidth: isMobile ? '100%' : 1280, margin: '0 auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
          gap: isMobile ? 40 : 48,
        }}>
          {/* MATCH column */}
          <div>
            <SectionHeader kicker="Avant-match" title="Tout pour samedi soir" link={{ label: 'Plus de match', filter: 'match' }}/>
            <div>
              {matchSection.map(a => (
                <ArticleCard key={a.id} article={a} variant="row" isMobile={isMobile} onOpen={(id) => navigate({ name: 'article', id })}/>
              ))}
            </div>

            <div style={{ marginTop: isMobile ? 24 : 32 }}>
              <SectionHeader kicker="Mercato" title="Qui part, qui reste, qui n'a jamais existé" link={{ label: 'Tout le mercato', filter: 'mercato' }}/>
              <div>
                {mercatoSection.map(a => (
                  <ArticleCard key={a.id} article={a} variant="row" isMobile={isMobile} onOpen={(id) => navigate({ name: 'article', id })}/>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          {!isMobile && (
            <aside style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div style={{
                padding: 24, background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)',
              }}>
                <TrendingList onOpen={(id) => navigate({ name: 'article', id })}/>
              </div>

              <div style={{
                padding: 28, background: 'var(--blue-night)', color: '#FAFAF7',
                borderRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden',
              }}>
                <span className="t-meta" style={{ color: '#3FB0E5' }}>Le brief du matin</span>
                <h3 style={{
                  margin: '10px 0 12px', fontFamily: 'var(--font-serif)', fontWeight: 600,
                  fontSize: 22, lineHeight: 1.15,
                  textWrap: 'balance',
                  fontVariationSettings: '"opsz" 60, "SOFT" 30',
                }}>Tout l'AB dans votre boîte mail, à 8h. Sans bla-bla.</h3>
                <p style={{ margin: '0 0 16px', fontSize: 13.5, color: 'rgba(250,250,247,0.7)', lineHeight: 1.5 }}>
                  3 articles, 1 stat, 1 phrase d'humeur. On a fait court exprès.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="votre@email.com" style={{
                    flex: 1, padding: '10px 12px', fontSize: 13, fontFamily: 'var(--font-sans)',
                    background: 'rgba(255,255,255,0.08)', color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--radius-md)',
                    outline: 'none',
                  }}/>
                  <button style={{
                    padding: '0 14px', background: '#0099D8', color: '#fff', fontWeight: 500,
                    fontSize: 13, borderRadius: 'var(--radius-md)',
                  }}>S'abonner</button>
                </div>
                <p style={{ margin: '12px 0 0', fontSize: 10.5, color: 'rgba(250,250,247,0.5)' }}>
                  Désabonnement en 1 clic. RGPD. Pas de spam (on a horreur de ça).
                </p>
              </div>

              <AdSlot variant="box"/>
            </aside>
          )}
        </div>
      </section>

      {/* Coulisses */}
      <section style={{
        padding: isMobile ? '16px 16px 32px' : '32px 32px 56px',
        maxWidth: isMobile ? '100%' : 1280, margin: '0 auto',
        background: 'var(--bg-subtle)',
      }}>
        <div style={{ padding: isMobile ? '24px 0' : '40px 0' }}>
          <SectionHeader kicker="Coulisses" title="Ce qui se dit, ce qui se chuchote" link={{ label: 'Plus de coulisses', filter: 'coulisses' }}/>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? 0 : 24,
          }}>
            {coulisses.map(a => (
              isMobile
                ? <ArticleCard key={a.id} article={a} variant="row" isMobile onOpen={(id) => navigate({ name: 'article', id })}/>
                : <ArticleCard key={a.id} article={a} variant="lead" onOpen={(id) => navigate({ name: 'article', id })}/>
            ))}
          </div>
        </div>
      </section>

      {/* Tribune */}
      <section style={{
        padding: isMobile ? '32px 16px' : '64px 32px',
        maxWidth: isMobile ? '100%' : 1280, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <span className="t-meta" style={{ color: 'var(--blue-aviron)' }}>Tribune AUPA AB</span>
            <h2 style={{
              margin: '4px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 600,
              fontSize: isMobile ? 26 : 34, lineHeight: 1.1, letterSpacing: '-0.012em',
              fontVariationSettings: '"opsz" 72',
            }}>Vu de la Sud, par les supporters</h2>
          </div>
          {!isMobile && <Button variant="ghost" iconRight="arrowRight">Voir toute la tribune</Button>}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 12 : 24,
        }}>
          <TribuneTile
            item={AUPA_DATA.tribune[0]}
            gradient="linear-gradient(135deg, #0B2545 0%, #0099D8 100%)"
            accent={
              <svg style={{ position: 'absolute', inset: 0, opacity: 0.3 }} viewBox="0 0 100 100" preserveAspectRatio="none">
                {Array.from({length: 12}).map((_, i) => (
                  <rect key={i} x="0" y={i*8 + 2} width="100" height="1.5" fill="#FAFAF7" opacity={Math.random() * 0.5 + 0.3}/>
                ))}
                <circle cx="70" cy="35" r="20" fill="#FAFAF7" opacity="0.15"/>
              </svg>
            }
          />
          <TribuneTile
            item={AUPA_DATA.tribune[1]}
            gradient="linear-gradient(160deg, #EFEAE0 0%, #CFCAB8 100%)"
            accent={
              <svg style={{ position: 'absolute', inset: 0, opacity: 0.6 }} viewBox="0 0 100 100" preserveAspectRatio="none">
                <rect x="40" y="20" width="20" height="60" fill="#0099D8" rx="3"/>
                <rect x="38" y="18" width="24" height="3" fill="#0B2545"/>
                <rect x="46" y="25" width="8" height="50" fill="#FAFAF7" opacity="0.7"/>
              </svg>
            }
          />
          {!isMobile && (
            <TribuneTile
              item={AUPA_DATA.tribune[2]}
              gradient="linear-gradient(180deg, #1A1D24 0%, #0B2545 100%)"
              accent={
                <svg style={{ position: 'absolute', inset: 0, opacity: 0.4 }} viewBox="0 0 100 100" preserveAspectRatio="none">
                  <circle cx="20" cy="30" r="2" fill="#FAFAF7"/>
                  <circle cx="50" cy="20" r="1.5" fill="#FAFAF7"/>
                  <circle cx="80" cy="40" r="2" fill="#0099D8"/>
                  <circle cx="35" cy="55" r="1.5" fill="#FAFAF7"/>
                  <circle cx="75" cy="70" r="2.5" fill="#FAFAF7"/>
                  <path d="M0 80 L100 80" stroke="#FAFAF7" strokeWidth="0.3" opacity="0.3"/>
                </svg>
              }
            />
          )}
        </div>

        <div style={{
          marginTop: isMobile ? 24 : 40, padding: isMobile ? '20px' : '32px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 16 : 24,
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{
              margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 600,
              fontSize: isMobile ? 19 : 22, lineHeight: 1.2,
              fontVariationSettings: '"opsz" 60',
            }}>
              Vous avez une photo de Jean-Dauger ? Envoyez-la.
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
              On préfère la vôtre, prise depuis votre place, à celles des agences. Vraiment.
            </p>
          </div>
          <Button variant="primary">Soumettre une photo</Button>
        </div>
      </section>
    </main>
  );
};

// ============================================================================
// ACTU (list)
// ============================================================================
const ActuPage = ({ isMobile, navigate }) => {
  const [filter, setFilter] = React.useState('all');
  const [source, setSource] = React.useState('all');
  const [period, setPeriod] = React.useState('30d');

  const cats = ['all', 'Mercato', 'Avant-match', 'Après-match', 'Coulisses', 'Club', 'Formation', 'International', 'Pays Basque', 'Billetterie', 'Conférence'];
  const filtered = AUPA_DATA.articles.filter(a => {
    if (filter !== 'all' && a.category !== filter) return false;
    if (source !== 'all' && a.source !== source) return false;
    return true;
  });

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '24px 16px 40px' : '40px 32px 80px' }}>
      <div style={{ marginBottom: isMobile ? 24 : 40 }}>
        <span className="t-meta" style={{ color: 'var(--blue-aviron)' }}>Actualités</span>
        <h1 style={{
          margin: '4px 0 8px', fontFamily: 'var(--font-serif)', fontWeight: 600,
          fontSize: isMobile ? 34 : 56, lineHeight: 1.04, letterSpacing: '-0.015em',
          fontVariationSettings: '"opsz" 144, "SOFT" 40',
          textWrap: 'balance',
        }}>Toutes les news de l'Aviron Bayonnais</h1>
        <p style={{ margin: 0, fontSize: isMobile ? 15 : 18, color: 'var(--text-secondary)', maxWidth: 680 }}>
          412 sources surveillées, scannées toutes les 15 minutes. On garde ce qui mérite, on jette le reste. <em>Promis.</em>
        </p>
      </div>

      {/* Filters bar */}
      <div style={{
        position: 'sticky', top: isMobile ? 56 : 72, zIndex: 10,
        background: 'var(--bg-default)',
        margin: isMobile ? '0 -16px' : '0 -32px',
        padding: isMobile ? '12px 16px' : '12px 32px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {cats.map(c => (
            <button key={c} onClick={() => setFilter(c)} style={{
              padding: '8px 14px', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
              borderRadius: 'var(--radius-full)',
              background: filter === c ? 'var(--text-primary)' : 'transparent',
              color: filter === c ? 'var(--bg-default)' : 'var(--text-secondary)',
              border: filter === c ? '1px solid var(--text-primary)' : '1px solid var(--border-subtle)',
              transition: 'background 100ms',
            }}>{c === 'all' ? 'Tout' : c}</button>
          ))}
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
            <select value={source} onChange={(e) => setSource(e.target.value)} style={{
              padding: '6px 12px', fontSize: 13, fontFamily: 'var(--font-sans)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}>
              <option value="all">Toutes les sources</option>
              {Object.entries(AUPA_DATA.sources).map(([k, s]) => <option key={k} value={k}>{s.name}</option>)}
            </select>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{
              padding: '6px 12px', fontSize: 13, fontFamily: 'var(--font-sans)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}>
              <option value="24h">Dernières 24h</option>
              <option value="7d">7 jours</option>
              <option value="30d">30 jours</option>
              <option value="all">Tout</option>
            </select>
            <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--text-secondary)' }} className="tnum">
              {filtered.length} article{filtered.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* List */}
      <div>
        {filtered.map((a, i) => (
          <React.Fragment key={a.id}>
            <ArticleCard article={a} variant="row" isMobile={isMobile} onOpen={(id) => navigate({ name: 'article', id })}/>
            {/* In-feed native ad after every 4 items */}
            {(i + 1) % 4 === 0 && i < filtered.length - 1 && (
              <div style={{ padding: '16px 0' }}>
                <AdSlot variant="native" isMobile={isMobile}/>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
        <Button variant="secondary" size="lg" iconRight="arrowRight">Charger plus d'articles</Button>
      </div>
    </main>
  );
};

Object.assign(window, { HomePage, ActuPage });
