// AUPA AB — app root

const { useState: useStateApp, useEffect: useEffectApp, useMemo: useMemoApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "showMatch": true,
  "readingSize": 17,
  "redIntensity": "discret",
  "thumbStyle": "auto",
  "showAds": true
}/*EDITMODE-END*/;

function AupaApp() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [route, setRoute] = useStateApp({ name: 'home' });
  const [theme, setTheme] = useStateApp(tweaks.theme || 'light');
  const [drawerOpen, setDrawerOpen] = useStateApp(false);
  const [searchOpen, setSearchOpen] = useStateApp(false);
  const [isMobile, setIsMobile] = useStateApp(false);

  // Detect viewport
  useEffectApp(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Sync theme from tweaks
  useEffectApp(() => {
    setTheme(tweaks.theme);
  }, [tweaks.theme]);

  // Apply theme
  useEffectApp(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const navigate = (r) => {
    setRoute(r);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
    setDrawerOpen(false);
    setSearchOpen(false);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setTweak('theme', next);
  };

  // ⌘K to open search
  useEffectApp(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  let pageContent;
  if (route.name === 'article') {
    pageContent = <ArticlePage articleId={route.id} isMobile={isMobile} navigate={navigate}/>;
  } else if (route.name === 'actu' || route.name === 'mercato' || route.name === 'match' || route.name === 'tribune') {
    pageContent = <ActuPage isMobile={isMobile} navigate={navigate}/>;
  } else {
    pageContent = <HomePage isMobile={isMobile} navigate={navigate} tweaks={tweaks}/>;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-default)', color: 'var(--text-primary)' }}>
      <Header
        route={route}
        navigate={navigate}
        isMobile={isMobile}
        onMenu={() => setDrawerOpen(true)}
        onSearch={() => setSearchOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} navigate={navigate} route={route}/>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} navigate={navigate} isMobile={isMobile}/>

      {pageContent}

      <Footer isMobile={isMobile} navigate={navigate}/>

      <TweaksPanel title="Tweaks · AUPA AB">
        <TweakSection title="Mode d'affichage">
          <TweakRadio label="Thème" value={tweaks.theme} options={[{value: 'light', label: 'Clair'}, {value: 'dark', label: 'Sombre'}]} onChange={(v) => setTweak('theme', v)}/>
          <TweakSlider label="Confort de lecture" value={tweaks.readingSize} min={15} max={22} step={1} onChange={(v) => setTweak('readingSize', v)} unit="px"/>
        </TweakSection>
        <TweakSection title="Accueil">
          <TweakToggle label="Bandeau prochain match" value={tweaks.showMatch} onChange={(v) => setTweak('showMatch', v)}/>
          <TweakToggle label="Emplacements pub" value={tweaks.showAds} onChange={(v) => setTweak('showAds', v)}/>
        </TweakSection>
        <TweakSection title="Style éditorial">
          <TweakSelect label="Vignettes auto" value={tweaks.thumbStyle} options={[
            {value: 'auto', label: 'Auto (rotation)'},
            {value: 'night', label: 'Bleu nuit · lauburu'},
            {value: 'sand', label: 'Sable · filet bleu'},
            {value: 'aviron', label: 'Bleu Aviron · vagues'},
          ]} onChange={(v) => setTweak('thumbStyle', v)}/>
          <TweakRadio label="Rouge Ikurriña" value={tweaks.redIntensity} options={[
            {value: 'jamais', label: 'Jamais'},
            {value: 'discret', label: 'Discret'},
            {value: 'present', label: 'Présent'},
          ]} onChange={(v) => setTweak('redIntensity', v)}/>
        </TweakSection>
      </TweaksPanel>

      {/* Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes aupa-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes aupa-fade { from { opacity: 0; } to { opacity: 1; } }
      `}}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AupaApp/>);
