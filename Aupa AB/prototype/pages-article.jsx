// AUPA AB — article page + comments

const ArticlePage = ({ articleId, isMobile, navigate }) => {
  const article = AUPA_DATA.articles.find(a => a.id === articleId) || AUPA_DATA.articles[0];
  const [liked, setLiked] = React.useState({});
  const [showComments, setShowComments] = React.useState(true);
  const [bookmarked, setBookmarked] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [sortBy, setSortBy] = React.useState('best');

  const related = AUPA_DATA.articles.filter(a => a.id !== article.id).slice(0, 3);

  const handleLike = (id) => setLiked(prev => ({ ...prev, [id]: !prev[id] }));

  // Body: use article.body or fallback
  const body = article.body || [
    article.lede || '',
    "Le contenu complet de cet article est disponible sur la source d'origine. AUPA AB reformule, contextualise et résume les actualités, mais ne reproduit pas l'intégralité du texte par respect du droit d'auteur. Cliquez sur le bouton ci-dessous pour lire l'article complet chez " + (AUPA_DATA.sources[article.source]?.name || 'la source') + ".",
    "On garde ici l'essentiel : l'information, le contexte, les implications pour le club. Et bien sûr, l'espace de commentaires en bas de page, qui est, soyons honnêtes, la moitié de l'intérêt de venir ici."
  ];

  return (
    <main>
      {/* Article hero strip with category */}
      <div style={{
        background: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: isMobile ? '12px 16px' : '12px 32px',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <button onClick={() => navigate({ name: 'home' })} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500,
          }}>
            <Icon name="arrowLeft" size={14}/> Retour
          </button>
          <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>/</span>
          <a onClick={() => navigate({ name: 'actu' })} style={{ fontSize: 12.5, color: 'var(--text-secondary)', cursor: 'pointer' }}>Actualités</a>
          <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>/</span>
          <span style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 500 }}>{article.category}</span>
        </div>
      </div>

      {/* Article body */}
      <article style={{
        maxWidth: 1280, margin: '0 auto',
        padding: isMobile ? '28px 16px 40px' : '60px 32px 80px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '64px minmax(0, 680px) 1fr',
        gap: isMobile ? 0 : 48,
        justifyContent: isMobile ? 'stretch' : 'center',
      }}>
        {/* Floating share rail (desktop) */}
        {!isMobile && (
          <aside style={{ position: 'sticky', top: 100, height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => setBookmarked(!bookmarked)} style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: bookmarked ? 'var(--blue-aviron)' : 'var(--bg-elevated)',
              color: bookmarked ? '#fff' : 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 100ms',
            }} title="Sauvegarder">
              <Icon name="bookmark" size={18} fill={bookmarked ? 'currentColor' : 'none'}/>
            </button>
            <button style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} title="Partager">
              <Icon name="share" size={18}/>
            </button>
            <div style={{ height: 32, width: 1, background: 'var(--border-subtle)', alignSelf: 'center', margin: '4px 0' }}/>
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 10.5, color: 'var(--text-tertiary)', letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'center' }}>
              {article.readingMin} min de lecture
            </div>
          </aside>
        )}

        {/* Main article column */}
        <div>
          {/* Meta strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <Badge variant="category">{article.category}</Badge>
            <SourceChip sourceKey={article.source}/>
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>· {article.date}</span>
          </div>

          {/* Title */}
          <h1 style={{
            margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 600,
            fontSize: isMobile ? 32 : 52, lineHeight: 1.04, letterSpacing: '-0.015em',
            color: 'var(--text-primary)',
            fontVariationSettings: '"opsz" 144, "SOFT" 50',
            textWrap: 'balance',
          }}>{article.title}</h1>

          {/* Byline */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '28px 0', paddingBottom: 24,
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <Avatar char={article.author ? article.author[0] : 'A'} bg="#0B2545" size={40}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Par {article.author || 'La rédaction'}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                {article.readingMin} min de lecture · Publié à {article.time}
              </div>
            </div>
            {!isMobile && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" size="sm" icon="bookmark" onClick={() => setBookmarked(!bookmarked)}>
                  {bookmarked ? 'Sauvegardé' : 'Sauvegarder'}
                </Button>
                <Button variant="secondary" size="sm" icon="share">Partager</Button>
              </div>
            )}
          </div>

          {/* Editorial cover */}
          <div style={{
            borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 32,
            aspectRatio: '16 / 9',
          }}>
            <EditorialThumb article={article} large w="100%" h="100%"/>
          </div>

          {/* Lede */}
          {article.lede && (
            <p style={{
              fontFamily: 'var(--font-serif)', fontWeight: 400,
              fontSize: isMobile ? 21 : 24, lineHeight: 1.45,
              color: 'var(--text-primary)', margin: '0 0 28px',
              letterSpacing: '-0.003em',
              fontVariationSettings: '"opsz" 36',
              textWrap: 'pretty',
            }}>{article.lede}</p>
          )}

          {/* Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, fontSize: isMobile ? 17 : 18, lineHeight: 1.7, color: 'var(--text-primary)' }}>
            {body.map((p, i) => (
              <p key={i} style={{ margin: 0, textWrap: 'pretty' }}>{p}</p>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 36, marginBottom: 32 }}>
            <Button variant="primary" size="lg" fullWidth iconRight="external">
              Lire l'article complet sur {AUPA_DATA.sources[article.source]?.name}
            </Button>
            <p style={{
              margin: '12px 0 0', fontSize: 12, color: 'var(--text-tertiary)',
              textAlign: 'center', fontStyle: 'italic',
            }}>
              On vous redirige. Pas de pisteur, pas de pop-up. <em>Comme la vie devrait être.</em>
            </p>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
            {article.tags?.map(t => (
              <button key={t} style={{
                padding: '6px 12px', fontSize: 12.5, fontWeight: 500,
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-subtle)', color: 'var(--text-primary)',
              }}>#{t}</button>
            ))}
          </div>

          {/* Action bar */}
          <div style={{
            display: 'flex', gap: 12, padding: '16px 0',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            alignItems: 'center',
          }}>
            <button onClick={() => setBookmarked(!bookmarked)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 13.5, fontWeight: 500,
              color: bookmarked ? 'var(--blue-aviron)' : 'var(--text-primary)',
            }}>
              <Icon name="bookmark" size={16} fill={bookmarked ? 'currentColor' : 'none'}/>
              {bookmarked ? 'Sauvegardé' : 'Sauvegarder'}
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 500 }}>
              <Icon name="share" size={16}/> Partager
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 500 }}>
              <Icon name="flag" size={16}/> Signaler
            </button>
            <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {article.comments} commentaires
            </span>
          </div>

          {/* Box ad (post-content) */}
          <div style={{ margin: '40px auto', maxWidth: 320 }}>
            <AdSlot variant="box"/>
          </div>

          {/* À lire ensuite */}
          <section style={{ marginTop: 56 }}>
            <h3 style={{
              margin: '0 0 20px', fontFamily: 'var(--font-serif)', fontWeight: 600,
              fontSize: 22, letterSpacing: '-0.005em',
              fontVariationSettings: '"opsz" 60',
            }}>À lire ensuite</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {related.map(a => (
                <ArticleCard key={a.id} article={a} variant="compact" onOpen={(id) => navigate({ name: 'article', id })}/>
              ))}
            </div>
          </section>

          {/* Comments */}
          <section style={{ marginTop: 56 }}>
            <button onClick={() => setShowComments(!showComments)} style={{
              width: '100%', padding: '20px 24px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 19,
              letterSpacing: '-0.005em',
            }}>
              <span>Commentaires <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontFamily: 'var(--font-sans)', fontSize: 16, marginLeft: 8 }} className="tnum">({article.comments})</span></span>
              <Icon name={showComments ? 'chevronUp' : 'chevronDown'} size={18}/>
            </button>

            {showComments && (
              <div style={{ marginTop: 24 }}>
                {/* Composer */}
                <div style={{
                  padding: 20, background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: 24,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Avatar char="V" bg="var(--blue-aviron)" size={36}/>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>@vous</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>Connecté · supporter depuis 2020</div>
                    </div>
                  </div>
                  <textarea
                    value={draft} onChange={(e) => setDraft(e.target.value)}
                    placeholder="Partagez votre avis… (le club lit ces commentaires, parfois. Faites bonne impression.)"
                    style={{
                      width: '100%', minHeight: 96, padding: 12,
                      fontSize: 15, fontFamily: 'var(--font-sans)', lineHeight: 1.55,
                      background: 'var(--bg-default)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      resize: 'vertical', outline: 'none',
                    }}/>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                      Markdown léger pris en charge · soyez constructif
                    </span>
                    <Button variant="primary" size="md" disabled={!draft.trim()} style={{ opacity: draft.trim() ? 1 : 0.5 }}>
                      Publier
                    </Button>
                  </div>
                </div>

                {/* Sort */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginRight: 4 }}>Trier par</span>
                  {[['best', 'Meilleurs'], ['recent', 'Plus récents']].map(([k, l]) => (
                    <button key={k} onClick={() => setSortBy(k)} style={{
                      padding: '4px 10px', fontSize: 12.5, fontWeight: 500,
                      borderRadius: 'var(--radius-full)',
                      background: sortBy === k ? 'var(--text-primary)' : 'transparent',
                      color: sortBy === k ? 'var(--bg-default)' : 'var(--text-secondary)',
                    }}>{l}</button>
                  ))}
                </div>

                <div>
                  {AUPA_DATA.comments.map(c => (
                    <Comment key={c.id} comment={c} onLike={handleLike} liked={liked}/>
                  ))}
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                  <Button variant="secondary" size="md">Charger 19 commentaires de plus</Button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar (desktop) */}
        {!isMobile && (
          <aside style={{ position: 'sticky', top: 100, height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{
              padding: 24, background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)',
            }}>
              <TrendingList onOpen={(id) => navigate({ name: 'article', id })}/>
            </div>
            <AdSlot variant="sidebar"/>
            <div style={{
              padding: 24, background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-default)',
            }}>
              <span className="t-meta">Avis de la maison</span>
              <p style={{
                margin: '10px 0 0', fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.4,
                fontVariationSettings: '"opsz" 36', fontStyle: 'italic',
              }}>
                « Les commentaires ici se lisent comme on boit un café : vite, en regardant par la fenêtre, en se disant que la vie est belle. »
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                — un abonné, 2025
              </p>
            </div>
          </aside>
        )}
      </article>
    </main>
  );
};

Object.assign(window, { ArticlePage });
