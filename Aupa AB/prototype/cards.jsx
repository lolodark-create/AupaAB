// AUPA AB — article card variants + comments

const { useState: useStateC } = React;

// ============================================================================
// Article card — variants: featured, lead, row, compact
// ============================================================================
const ArticleCard = ({ article, variant = 'row', isMobile, onOpen }) => {
  const source = AUPA_DATA.sources[article.source];

  const handle = (e) => {
    e.preventDefault();
    onOpen && onOpen(article.id);
  };

  // FEATURED: big asymmetric hero
  if (variant === 'featured') {
    return (
      <article onClick={handle} style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr',
        gap: isMobile ? 0 : 0,
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}>
        <div style={{ aspectRatio: isMobile ? '16 / 10' : 'unset', height: isMobile ? 'auto' : 460 }}>
          <EditorialThumb article={article} large={!isMobile} w="100%" h="100%"/>
        </div>
        <div style={{ padding: isMobile ? 24 : 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Badge variant="category">{article.category}</Badge>
            <SourceChip sourceKey={article.source}/>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>· {article.time}</span>
          </div>
          <h1 style={{
            margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 600,
            fontSize: isMobile ? 30 : 42, lineHeight: 1.06,
            letterSpacing: '-0.014em',
            color: 'var(--text-primary)',
            fontVariationSettings: '"opsz" 120, "SOFT" 40',
            textWrap: 'balance',
          }}>{article.title}</h1>
          <p style={{
            margin: 0, fontSize: isMobile ? 16 : 18, lineHeight: 1.55,
            color: 'var(--text-secondary)',
            textWrap: 'pretty',
          }}>{article.lede}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
            <Button variant="primary" iconRight="arrowRight" onClick={handle}>Lire la suite</Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="message" size={13}/> {article.comments}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={13}/> {article.readingMin} min</span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // LEAD: vertical card (3-col grid)
  if (variant === 'lead') {
    return (
      <article onClick={handle} style={{
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        height: '100%',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
        <div style={{ aspectRatio: '4 / 3' }}><EditorialThumb article={article} w="100%" h="100%"/></div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge variant="category" size="sm">{article.category}</Badge>
            <SourceChip sourceKey={article.source} size="sm"/>
          </div>
          <h2 style={{
            margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 600,
            fontSize: 22, lineHeight: 1.18,
            letterSpacing: '-0.005em',
            color: 'var(--text-primary)',
            display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3,
            overflow: 'hidden',
            textWrap: 'balance',
          }}>{article.title}</h2>
          {article.lede && (
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--text-secondary)',
                        display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>
              {article.lede}
            </p>
          )}
          <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
            <span>{article.time}</span>
            <span style={{ display: 'inline-flex', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="message" size={12}/> {article.comments}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={12}/> {article.readingMin}m</span>
            </span>
          </div>
        </div>
      </article>
    );
  }

  // COMPACT: small horizontal (sidebar / related)
  if (variant === 'compact') {
    return (
      <article onClick={handle} style={{
        display: 'flex', gap: 12, padding: 8, cursor: 'pointer',
        borderRadius: 'var(--radius-md)',
        transition: 'background 100ms',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
        <div style={{ width: 80, height: 80, flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <EditorialThumb article={article} size="xs" w="100%" h="100%"/>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span className="t-meta" style={{ fontSize: 10.5 }}>{article.category}</span>
          <h4 style={{
            margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 500,
            fontSize: 14.5, lineHeight: 1.25, color: 'var(--text-primary)',
            display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden',
          }}>{article.title}</h4>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{article.time}</span>
        </div>
      </article>
    );
  }

  // ROW (default): horizontal list item
  return (
    <article onClick={handle} style={{
      display: 'flex', gap: isMobile ? 14 : 24,
      padding: isMobile ? '16px 0' : '20px 0',
      borderBottom: '1px solid var(--border-subtle)',
      cursor: 'pointer',
      transition: 'background 100ms',
    }}>
      <div style={{
        width: isMobile ? 96 : 220,
        height: isMobile ? 96 : 146,
        flexShrink: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden',
      }}>
        <EditorialThumb article={article} size="sm" w="100%" h="100%"/>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: isMobile ? 6 : 8, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge variant="category" size="sm">{article.category}</Badge>
          {!isMobile && <SourceChip sourceKey={article.source} size="sm"/>}
          <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>· {article.time}</span>
        </div>
        <h3 style={{
          margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 500,
          fontSize: isMobile ? 17 : 22, lineHeight: 1.2,
          letterSpacing: '-0.005em',
          color: 'var(--text-primary)',
          display: '-webkit-box', WebkitBoxOrient: 'vertical',
          WebkitLineClamp: isMobile ? 3 : 2, overflow: 'hidden',
          textWrap: 'balance',
        }}>{article.title}</h3>
        {!isMobile && article.lede && (
          <p style={{
            margin: 0, fontSize: 14.5, lineHeight: 1.5,
            color: 'var(--text-secondary)',
            display: '-webkit-box', WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2, overflow: 'hidden',
          }}>{article.lede}</p>
        )}
        <div style={{ marginTop: 'auto', display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--text-secondary)', alignItems: 'center' }}>
          {isMobile && <SourceChip sourceKey={article.source} size="sm"/>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="message" size={13}/> {article.comments}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={13}/> {article.readingMin} min</span>
          {!isMobile && (
            <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 12 }}>
              <button style={{ color: 'var(--text-secondary)' }} title="Sauvegarder" onClick={(e) => e.stopPropagation()}><Icon name="bookmark" size={16}/></button>
              <button style={{ color: 'var(--text-secondary)' }} title="Partager" onClick={(e) => e.stopPropagation()}><Icon name="share" size={16}/></button>
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

// ============================================================================
// Trending list
// ============================================================================
const TrendingList = ({ onOpen }) => (
  <div>
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <h3 style={{
        margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 600,
        fontSize: 17, letterSpacing: '-0.005em',
      }}>Le plus lu cette semaine</h3>
    </div>
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {AUPA_DATA.trending.map((t) => (
        <li key={t.rank} onClick={() => onOpen && onOpen(t.id)} style={{
          display: 'flex', gap: 14, alignItems: 'baseline', padding: '14px 0',
          borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
        }}>
          <span style={{
            fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600,
            color: 'var(--blue-aviron)', lineHeight: 1, flexShrink: 0,
            width: 32, fontVariationSettings: '"opsz" 96',
          }}>{t.rank}</span>
          <span style={{
            fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 500,
            lineHeight: 1.3, color: 'var(--text-primary)',
          }}>{t.title}</span>
        </li>
      ))}
    </ol>
  </div>
);

// ============================================================================
// Comment item
// ============================================================================
const Comment = ({ comment, reply, onLike, liked }) => {
  if (comment.deleted) {
    return (
      <div style={{
        padding: '14px 0', color: 'var(--text-tertiary)',
        fontSize: 14, fontStyle: 'italic',
        borderBottom: reply ? 'none' : '1px solid var(--border-subtle)',
      }}>{comment.body}</div>
    );
  }
  const isLiked = liked && liked[comment.id];
  return (
    <div style={{ paddingTop: reply ? 14 : 20, paddingBottom: reply ? 0 : 20, borderBottom: reply ? 'none' : '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Avatar char={comment.avatar} bg={comment.avatarBg} size={reply ? 32 : 40}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{comment.author}</span>
            {comment.role && (
              <span style={{
                fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em',
                color: comment.role === 'MODÉRATEUR' ? 'var(--blue-aviron)' : 'var(--green-basque)',
                background: 'transparent', border: '1px solid currentColor',
                padding: '1px 6px', borderRadius: 'var(--radius-sm)',
              }}>{comment.role}</span>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>· {comment.time}</span>
          </div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: 'var(--text-primary)' }}>{comment.body}</p>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 18, fontSize: 12.5, color: 'var(--text-secondary)' }}>
            <button onClick={() => onLike(comment.id)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: isLiked ? 'var(--red-ikurrina)' : 'inherit',
              fontWeight: isLiked ? 600 : 500, transition: 'color 100ms',
            }}>
              <Icon name="heart" size={14} fill={isLiked ? 'currentColor' : 'none'}/>
              <span className="tnum">{comment.likes + (isLiked ? 1 : 0)}</span>
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="message" size={14}/> Répondre
            </button>
            <button style={{ marginLeft: 'auto' }}><Icon name="more" size={16}/></button>
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div style={{
              marginTop: 14, marginLeft: -12, paddingLeft: 20,
              borderLeft: '2px solid var(--border-subtle)',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              {comment.replies.map(r => <Comment key={r.id} comment={r} reply onLike={onLike} liked={liked}/>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Tribune (community photos)
// ============================================================================
const TribuneTile = ({ item, gradient, accent }) => (
  <div style={{
    aspectRatio: '4 / 5',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
    background: gradient,
    transition: 'transform 200ms ease',
  }}
  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}>
    {accent}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, transparent 50%, rgba(11,37,69,0.85))',
    }}/>
    <div style={{
      position: 'absolute', left: 16, right: 16, bottom: 16,
      color: '#FAFAF7',
    }}>
      <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 4, letterSpacing: '0.04em' }}>{item.author}</div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.25, fontWeight: 500, fontVariationSettings: '"opsz" 48' }}>
        {item.caption}
      </div>
    </div>
  </div>
);

Object.assign(window, { ArticleCard, TrendingList, Comment, TribuneTile });
