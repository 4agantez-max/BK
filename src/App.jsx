import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { defaultSettings } from "./data/works.js";
import {
  currentDemoAdmin,
  deleteComment,
  fetchAdminSnapshot,
  fetchApprovedComments,
  fetchApprovedFeedback,
  fetchSettings,
  fetchWorks,
  listenToAuth,
  loginAdmin,
  logoutAdmin,
  moderateComment,
  moderateFeedback,
  removeWork,
  saveSettings,
  saveWork,
  seedDemoData,
  submitExhibitionFeedback,
  submitWorkComment,
  trackVisit,
  verifyAdminUser,
} from "./lib/data.js";
import { firebaseReady } from "./lib/firebase.js";
import { fetchGitHubAssets } from "./lib/githubAssets.js";

const LanguageContext = createContext(null);
const languages = {
  id: {
    viewWorks: "Lihat karya",
    works: "Karya dipamerkan",
    workCount: "karya",
    feedbackTitle: "Berikan suara untuk pameran",
    feedbackTeaser: "Cerita singkatmu membantu kami memahami pengalaman di ruang bawah air ini.",
    giveFeedback: "Isi feedback",
    comments: "Komentar",
    noComments: "Belum ada komentar. Jadi yang pertama",
    sendComment: "Kirim komentar",
    anonymous: "Anonim",
    approval: "Terima kasih. Komentar kamu menunggu persetujuan admin.",
    name: "Nama (opsional)",
    comment: "Komentar",
    privacy: "Website mencatat kunjungan anonim dan menyimpan ID acak serta pilihan bahasa di browser. Tidak ada IP, lokasi, atau data pribadi yang disimpan.",
    back: "Kembali",
    download: "Unduh aplikasi",
    apkWarning: "Aplikasi belum ditandatangani resmi. Android mungkin menampilkan peringatan saat instalasi.",
    openLink: "Buka link",
    loading: "Memuat...",
    loadError: "Konten tidak dapat dimuat. Coba muat ulang halaman.",
    feedbackClosed: "Feedback sudah ditutup",
    submit: "Kirim feedback",
    overallRating: "Rating keseluruhan pameran",
    optionalComment: "Saran atau komentar (opsional)",
    answerRequired: "Pilih satu jawaban untuk setiap pertanyaan.",
    thankYou: "Terima kasih. Feedback kamu sudah dikirim.",
    alreadySent: "Perangkat ini sudah mengirim feedback.",
    requiredRating: "Pilih rating bintang 1 sampai 5.",
    questions: "Pertanyaan",
    close: "Tutup",
  },
  en: {
    viewWorks: "View works",
    works: "Works on display",
    workCount: "works",
    feedbackTitle: "Share your voice",
    feedbackTeaser: "Your brief story helps us understand the experience in this underwater space.",
    giveFeedback: "Give feedback",
    comments: "Comments",
    noComments: "No comments yet. Be the first",
    sendComment: "Send comment",
    anonymous: "Anonymous",
    approval: "Thank you. Your comment is waiting for admin approval.",
    name: "Name (optional)",
    comment: "Comment",
    privacy: "This website records anonymous visits and stores a random ID and language preference in your browser. No IP, location, or personal data is stored.",
    back: "Back",
    download: "Download app",
    apkWarning: "The app is not officially signed. Android may show a warning during installation.",
    openLink: "Open link",
    loading: "Loading...",
    loadError: "Content could not be loaded. Please reload the page.",
    feedbackClosed: "Feedback is now closed",
    submit: "Send feedback",
    overallRating: "Overall exhibition rating",
    optionalComment: "Suggestion or comment (optional)",
    answerRequired: "Choose one answer for each question.",
    thankYou: "Thank you. Your feedback has been submitted.",
    alreadySent: "This device has already submitted feedback.",
    requiredRating: "Choose a star rating from 1 to 5.",
    questions: "Questions",
    close: "Close",
  },
};

function useLanguage() {
  return useContext(LanguageContext);
}

function useToast() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    const handler = (event) => {
      setMessage(event.detail);
      window.clearTimeout(window.toastTimer);
      window.toastTimer = window.setTimeout(() => setMessage(""), 3200);
    };
    window.addEventListener("underwater-toast", handler);
    return () => window.removeEventListener("underwater-toast", handler);
  }, []);
  return message ? <div className="toast" role="status">{message}</div> : null;
}

function notify(message) {
  window.dispatchEvent(new CustomEvent("underwater-toast", { detail: message }));
}

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    if (!("IntersectionObserver" in window)) {
      ref.current.classList.add("is-visible");
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = "", style }) {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${className}`} style={style}>{children}</div>;
}

function isFeedbackOpen(settings) {
  if (!settings.feedbackOpen) return false;
  const now = new Date();
  if (settings.startDate && now < new Date(`${settings.startDate}T00:00:00`)) return false;
  if (settings.endDate && now > new Date(`${settings.endDate}T23:59:59`)) return false;
  return true;
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function App() {
  const storedLanguage = localStorage.getItem("uw-language");
  const initialLanguage = storedLanguage || (/^en\b/i.test(navigator.language) ? "en" : "id");
  const [language, setLanguage] = useState(initialLanguage in languages ? initialLanguage : "id");
  const value = useMemo(() => ({
    language,
    setLanguage: (next) => {
      localStorage.setItem("uw-language", next);
      setLanguage(next);
    },
    t: languages[language],
  }), [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    seedDemoData();
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/karya/:workId" element={<WorkPage />} />
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      <UseToast />
    </LanguageContext.Provider>
  );
}

function UseToast() {
  return useToast();
}

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="lang-switch" aria-label="Pilih bahasa">
      {["id", "en"].map((item) => (
        <button
          aria-pressed={language === item}
          className={language === item ? "active" : ""}
          key={item}
          onClick={() => setLanguage(item)}
          type="button"
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Footer() {
  const { t, language } = useLanguage();
  const footerRef = useRef(null);

  useLayoutEffect(() => {
    const footer = footerRef.current;
    const works = document.getElementById("works");
    if (!footer || !works) return undefined;

    const updateBubbleDistance = () => {
      const distance = footer.getBoundingClientRect().bottom - works.getBoundingClientRect().top;
      footer.style.setProperty("--bubble-rise-distance", `${Math.max(0, distance)}px`);
    };

    updateBubbleDistance();
    const main = footer.previousElementSibling;
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateBubbleDistance);
    if (observer) {
      observer.observe(footer);
      if (main) observer.observe(main);
    }
    window.addEventListener("resize", updateBubbleDistance);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateBubbleDistance);
    };
  }, []);

  return (
    <footer className="site-footer" ref={footerRef}>
      <div className="footer-bubbles" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
      </div>
      <div className="container">
        <div className="footer-grid">
          <p className="footer-tag">{language === "en" ? "Dive in, find your calm" : "Menyelam ke dalam, menemukan ketenangan"}</p>
          <p className="privacy-note">{t.privacy}</p>
        </div>
        <div className="footer-bottom">
          <span>Underwater Room · XI TMB</span>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}

function SiteHeader() {
  return (
    <header className="site-header container">
      <span aria-hidden="true" />
      <LanguageSwitcher />
    </header>
  );
}

function scrollToSection(event, sectionId) {
  event.preventDefault();
  const section = document.getElementById(sectionId);
  if (!section) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  section.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

function ScrollNav({ visible, showFeedback }) {
  const { language, setLanguage } = useLanguage();
  const labels = language === "id"
    ? { works: "Karya", feedback: "Penilaian", top: "↑ Atas" }
    : { works: "Works", feedback: "Feedback", top: "↑ Top" };
  return (
    <nav aria-hidden={!visible} aria-label={language === "id" ? "Navigasi pameran" : "Exhibition navigation"} className={`scroll-nav ${visible ? "visible" : ""}`}>
      <div className="container scroll-nav-inner">
        <a className="scroll-nav-brand" href="#top" onClick={(event) => scrollToSection(event, "top")}>
          <span>UNDERWATER</span><strong>ROOM <small>XI TMB</small></strong>
        </a>
        <div className="scroll-nav-links">
          <a href="#works" onClick={(event) => scrollToSection(event, "works")}>{labels.works}</a>
          {showFeedback && <a href="#feedback" onClick={(event) => scrollToSection(event, "feedback")}>{labels.feedback}</a>}
          <a href="#top" onClick={(event) => scrollToSection(event, "top")}>{labels.top}</a>
        </div>
        <div className="scroll-nav-language">
          {["id", "en"].map((item) => <button
            aria-pressed={language === item}
            className={language === item ? "active" : ""}
            key={item}
            onClick={() => setLanguage(item)}
            tabIndex={visible ? 0 : -1}
            type="button"
          >{item.toUpperCase()}</button>)}
        </div>
      </div>
    </nav>
  );
}

function HomePage() {
  const { language, t } = useLanguage();
  const location = useLocation();
  const [works, setWorks] = useState([]);
  const [approvedFeedback, setApprovedFeedback] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [navVisible, setNavVisible] = useState(false);

  useEffect(() => {
    const updateNav = () => setNavVisible(window.scrollY > 190);
    updateNav();
    window.addEventListener("scroll", updateNav, { passive: true });
    return () => window.removeEventListener("scroll", updateNav);
  }, []);

  useEffect(() => {
    if (location.state?.scrollTo !== "works") return undefined;
    const frame = window.requestAnimationFrame(() => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById("works")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.key, location.state]);

  useEffect(() => {
    let active = true;
    Promise.all([fetchWorks(), fetchSettings(), fetchApprovedFeedback()])
      .then(([workItems, currentSettings, comments]) => {
        if (!active) return;
        setWorks(workItems);
        setSettings(currentSettings);
        setApprovedFeedback(comments);
        setLoading(false);
      })
      .catch((cause) => {
        console.error("Unable to load public exhibition content.", cause);
        if (active) {
          setError(t.loadError);
          setLoading(false);
        }
      });
    trackVisit().catch((cause) => console.error("Visitor tracking failed.", cause));
    return () => { active = false; };
  }, [t.loadError]);

  return (
    <>
      <SiteHeader />
      <ScrollNav visible={navVisible} showFeedback={!loading && !error && isFeedbackOpen(settings)} />
      <main>
        <section className={`hero ${navVisible ? "nav-collapsed" : ""}`} id="top">
          <div className="caustic" aria-hidden="true" />
          <div className="hero-inner container">
            <p className="coming">{language === "id" ? "Pameran karya · 2026" : "Works exhibition · 2026"}</p>
            <div className="title-stage">
              <span className="title-ripple ripple-inner" aria-hidden="true" />
              <span className="title-ripple ripple-outer" aria-hidden="true" />
              <div className="torn-title">
                <h1><span className="under">UNDERWATER</span><span className="room">ROOM <small>XI TMB</small></span></h1>
              </div>
            </div>
            <p className="tagline">{language === "id" ? "Menyelam ke dalam, menemukan ketenangan" : "Dive in, find your calm"}</p>
            <div className="hero-actions">
              <a className="button button-dark" href="#works" onClick={(event) => scrollToSection(event, "works")}>{t.viewWorks}</a>
              {!loading && !error && isFeedbackOpen(settings) && (
                  <a className="button button-hero-secondary" href="#feedback" onClick={(event) => scrollToSection(event, "feedback")}>{language === "id" ? "Isi penilaian" : "Rate the exhibition"}</a>
              )}
            </div>
          </div>
          <svg className="wave" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
            <path className="wave-layer wave-layer-back" d="M0 74 C180 28 330 105 520 78 C720 50 850 30 1040 62 C1210 90 1320 108 1440 70 L1440 200 L0 200 Z" />
            <path className="wave-layer wave-layer-mid" d="M0 112 C170 78 340 142 530 112 C720 82 870 68 1040 103 C1210 138 1320 146 1440 112 L1440 200 L0 200 Z" />
            <path className="wave-layer wave-layer-front" d="M0 147 C190 119 330 174 540 145 C730 119 900 107 1080 139 C1240 168 1340 171 1440 148 L1440 200 L0 200 Z" />
          </svg>
        </section>

        <section className="gallery-section" id="works">
          <div className="container">
            <div className="section-heading">
              <h2>{t.works}</h2>
              <span>{works.length.toString().padStart(2, "0")} {t.workCount}</span>
            </div>
            {loading && <p className="light-copy">{t.loading}</p>}
            {error && <p className="error-message" role="alert">{error}</p>}
            {!loading && !error && (
              works.length ? (
                <div className="work-grid">
                  {works.map((work, index) => (
                    <Reveal className="work-reveal" key={work.id} style={{ "--reveal-delay": `${index % 3 * 90}ms` }}>
                      <Link className="work-card" to={`/karya/${work.id}`}>
                        <Artwork work={work} compact />
                        <div className="work-copy">
                          <h3>{work.title}</h3>
                          <p>{work.creator}</p>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              ) : <p className="light-copy">{language === "id" ? "Belum ada karya yang ditampilkan." : "No works are on display yet."}</p>
            )}
          </div>
        </section>

        {!loading && !error && (isFeedbackOpen(settings) ? (
          <section className="feedback-teaser" id="feedback">
            <div className="container">
              <Reveal className="feedback-panel feedback-inline">
                <div className="feedback-intro"><span className="eyebrow">{language === "id" ? "CERITAKAN PENGALAMANMU" : "TELL US ABOUT YOUR VISIT"}</span><h2>{t.feedbackTitle}</h2><p>{t.feedbackTeaser}</p></div>
                <FeedbackForm settings={settings} />
              </Reveal>
            </div>
          </section>
        ) : <p className="feedback-closed container">{t.feedbackClosed}</p>)}

        {approvedFeedback.length > 0 && (
          <section className="public-feedback">
            <div className="container">
              <h2>{t.comments} · {language === "id" ? "Pameran" : "Exhibition"}</h2>
              <div className="public-feedback-grid">
                {approvedFeedback.map((item) => <blockquote key={item.id}><p>{item.comment}</p><cite>{item.name || t.anonymous}</cite></blockquote>)}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

function Artwork({ work, compact = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imagePath = work.images?.[0];
  const imageSrc = imagePath
    ? /^https:\/\//i.test(imagePath)
      ? imagePath
      : imagePath.startsWith("/") ? `.${imagePath}` : `./${imagePath}`
    : "";
  return (
    <div className={`artwork ${compact ? "artwork-compact" : ""}`}>
      {!imageFailed && imagePath && (
        <img
          alt={`${work.title} — ${work.creator}`}
          loading={compact ? "lazy" : "eager"}
          onError={() => setImageFailed(true)}
          src={imageSrc}
        />
      )}
      {(imageFailed || !imagePath) && <div className={`artwork-placeholder artwork-${(work.order || 1) % 6 + 1}`} aria-hidden="true"><span>{work.title}</span></div>}
    </div>
  );
}

function WorkPage() {
  const { workId } = useParams();
  const { language, t } = useLanguage();
  const [work, setWork] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [comments, setComments] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const touchStart = useRef(null);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previousBehavior;
  }, [workId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setImageIndex(0);
    Promise.all([fetchWorks(), fetchSettings()])
      .then(async ([items, currentSettings]) => {
        const found = items.find((item) => item.id === workId);
        if (!found) throw new Error("Karya tidak ditemukan.");
        const approved = await fetchApprovedComments(workId);
        if (!active) return;
        setWork(found);
        setSettings(currentSettings);
        setComments(approved);
        setLoading(false);
      })
      .catch((cause) => {
        console.error("Unable to load work details.", cause);
        if (active) {
          setError(cause.message || t.loadError);
          setLoading(false);
        }
      });
    trackVisit(workId).catch((cause) => console.error("Work view tracking failed.", cause));
    return () => { active = false; };
  }, [workId, t.loadError]);

  async function sendComment(event) {
    event.preventDefault();
    if (!isFeedbackOpen(settings)) {
      notify(t.feedbackClosed);
      return;
    }
    if (!text.trim()) {
      notify(language === "id" ? "Komentar tidak boleh kosong." : "Comment cannot be empty.");
      return;
    }
    try {
      await submitWorkComment(workId, { name, text });
      notify(t.approval);
      setText("");
      setName("");
    } catch (cause) {
      notify(cause.message || t.loadError);
    }
  }

  if (loading) return <PageMessage>{t.loading}</PageMessage>;
  if (error || !work) return <PageMessage error>{error || t.loadError}<Link state={{ scrollTo: "works" }} to="/">← {t.back}</Link></PageMessage>;

  const imageCount = work.images?.length || 0;
  const apkUrl = work.apk?.url ? safeExternalUrl(work.apk.url) : "";
  const linkUrl = work.linkUrl ? safeExternalUrl(work.linkUrl) : "";
  return (
    <div className="detail-page">
      <nav className="detail-nav">
        <div className="container detail-nav-inner">
          <Link state={{ scrollTo: "works" }} to="/">← {t.back}</Link>
          <LanguageSwitcher />
        </div>
      </nav>
      <main className="container detail-layout">
        <section className="detail-gallery" aria-label={language === "id" ? "Galeri karya" : "Work gallery"}>
          <div className="detail-artwork" onTouchStart={(event) => { touchStart.current = event.changedTouches[0].clientX; }} onTouchEnd={(event) => {
            if (touchStart.current === null || imageCount < 2) return;
            const delta = event.changedTouches[0].clientX - touchStart.current;
            if (Math.abs(delta) > 40) setImageIndex((current) => (current + (delta < 0 ? 1 : imageCount - 1)) % imageCount);
            touchStart.current = null;
          }}>
            {imageCount > 0 ? <Artwork key={imageIndex} work={{ ...work, images: [work.images[imageIndex]] }} /> : <div className="artwork-placeholder"><span>{work.title}</span></div>}
          </div>
          {imageCount > 1 && <div className="gallery-controls">
            <button type="button" onClick={() => setImageIndex((imageIndex + imageCount - 1) % imageCount)} aria-label={language === "id" ? "Gambar sebelumnya" : "Previous image"}>←</button>
            <span>{language === "id" ? "Gambar" : "Image"} <strong>{imageIndex + 1}</strong> / {imageCount}</span>
            <button type="button" onClick={() => setImageIndex((imageIndex + 1) % imageCount)} aria-label={language === "id" ? "Gambar berikutnya" : "Next image"}>→</button>
          </div>}
        </section>
        <article className="detail-copy">
          <p className="detail-kicker">{language === "id" ? "KARYA DIPAMERKAN" : "ON DISPLAY"} <span>{String(work.order || 1).padStart(2, "0")}</span></p>
          <h1>{work.title}</h1>
          <p className="creator"><span aria-hidden="true">✦</span> {work.creator}</p>
          <p className="description">{work.description}</p>
          {work.chapters?.filter((chapter) => chapter.title?.trim() && chapter.content?.trim()).length > 0 && (
            <section className="work-chapters" aria-label={language === "id" ? "Subbab karya" : "Work chapters"}>
              {work.chapters.filter((chapter) => chapter.title?.trim() && chapter.content?.trim()).map((chapter, index) => (
                <article key={`${chapter.title}-${index}`}>
                  <h2>{chapter.title}</h2>
                  <p>{chapter.content}</p>
                </article>
              ))}
            </section>
          )}
          {work.extras?.filter((item) => item.label && item.value).length > 0 && (
            <dl className="work-extras">
              {work.extras.filter((item) => item.label && item.value).map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
            </dl>
          )}
          {(linkUrl || apkUrl) && <div className="detail-actions">
            {linkUrl && <a className="button button-outline" href={linkUrl} target="_blank" rel="noopener noreferrer">{t.openLink}</a>}
            {apkUrl && <a className="button button-dark" href={apkUrl} target="_blank" rel="noopener noreferrer">↓ {t.download}</a>}
          </div>}
          {apkUrl && <aside className="apk-info">
            <p><strong>{work.apk.size || "—"}</strong>{work.apk.version && ` · ${work.apk.version}`}</p>
            {work.apk.sha256 && <p><span>SHA-256</span><code>{work.apk.sha256}</code></p>}
            <p>{t.apkWarning}</p>
          </aside>}
        </article>
      </main>

      <section className="container comments-section">
        <h2>{t.comments}</h2>
        {comments.length ? comments.map((item) => <article className="comment" key={item.id}>
          <div className="comment-meta"><strong>{item.name || t.anonymous}</strong><time>{formatDate(item.createdAt, language)}</time></div>
          <p>{item.text}</p>
        </article>) : <p>{t.noComments}</p>}
        {isFeedbackOpen(settings) ? <form className="comment-form" onSubmit={sendComment}>
          <label htmlFor="visitor-name">{t.name}</label>
          <input id="visitor-name" maxLength={50} onChange={(event) => setName(event.target.value)} value={name} />
          <label htmlFor="visitor-comment">{t.comment}</label>
          <textarea id="visitor-comment" maxLength={500} onChange={(event) => setText(event.target.value)} required value={text} />
          <div className="form-footer"><span>{text.length}/500</span><button className="button button-dark" type="submit">{t.sendComment}</button></div>
          <small>{t.approval}</small>
        </form> : <p className="feedback-closed">{t.feedbackClosed}</p>}
      </section>
      <Footer />
    </div>
  );
}

function FeedbackForm({ settings }) {
  const { language, t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [answers, setAnswers] = useState({});
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!isFeedbackOpen(settings)) {
      setError(t.feedbackClosed);
      return;
    }
    if (rating < 1) {
      setError(t.requiredRating);
      return;
    }
    if (questions.some((question) => !answers[question.id])) {
      setError(t.answerRequired);
      return;
    }
    setError("");
    setSending(true);
    try {
      await submitExhibitionFeedback({ name: name.trim() || t.anonymous, rating, answers, comment: comment.trim() });
      setSubmitted(true);
    } catch (error) {
      setError(error.message || t.loadError);
    } finally {
      setSending(false);
    }
  }

  const questions = settings.questions || defaultSettings.questions;
  if (submitted) {
    return <div className="feedback-success" role="status"><span aria-hidden="true">✓</span><p>{t.thankYou}</p></div>;
  }
  return (
    <form className="feedback-form" onSubmit={submit}>
      <fieldset className="rating-fieldset"><legend>{t.overallRating}</legend><div className="rating-buttons">
        {[1, 2, 3, 4, 5].map((value) => <button aria-label={`${value} / 5`} aria-pressed={rating === value} className={value <= rating ? "star selected" : "star"} key={value} onClick={() => setRating(value)} type="button">★</button>)}
      </div></fieldset>
      <h3>{t.questions}</h3>
      {questions.map((question) => {
        const translatedOptions = translateQuestionOptions(question.id, language, question.options);
        return <fieldset className="question" key={question.id}>
          <legend>{translateQuestion(question.id, language, question.label)}</legend>
          {translatedOptions.map((option) => <label className="radio-option" key={option}>
            <input checked={answers[question.id] === option} name={question.id} onChange={() => setAnswers({ ...answers, [question.id]: option })} type="radio" value={option} />
            <span>{option}</span>
          </label>)}
        </fieldset>;
      })}
      <label htmlFor="feedback-name">{t.name}<input id="feedback-name" maxLength={50} onChange={(event) => setName(event.target.value)} value={name} /></label>
      <label htmlFor="feedback-comment">{t.optionalComment}<textarea id="feedback-comment" maxLength={500} onChange={(event) => setComment(event.target.value)} value={comment} /></label>
      {error && <p className="error-message" role="alert">{error}</p>}
      <div className="modal-actions"><button className="button button-dark" disabled={sending} type="submit">{sending ? t.loading : t.submit}</button></div>
    </form>
  );
}

function translateQuestion(id, language, fallback) {
  if (language === "id") return fallback;
  return {
    discovery: "How did you hear about this exhibition?",
    favorite: "Which part did you find most interesting?",
    usability: "How easy was this website to use?",
  }[id] || fallback;
}

function translateQuestionOptions(id, language, fallback) {
  if (language === "id") return fallback;
  return {
    discovery: ["Social media", "Friends", "QR at the venue", "Other"],
    favorite: ["Artwork presentation", "Work information", "Downloadable app", "Easy website navigation"],
    usability: ["Very easy", "Easy", "Okay", "Difficult"],
  }[id] || fallback;
}

function PageMessage({ children, error = false }) {
  return <main className="page-message"><p className={error ? "error-message" : ""}>{children}</p></main>;
}

function formatDate(value, language = "id") {
  if (!value) return "";
  const date = value.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en", { dateStyle: "medium" }).format(date);
}

function formatFileSize(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AdminPage() {
  const { language } = useLanguage();
  const [user, setUser] = useState(() => currentDemoAdmin());
  const [authLoading, setAuthLoading] = useState(firebaseReady);
  const [snapshot, setSnapshot] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!firebaseReady) return undefined;
    return listenToAuth(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
      } else {
        try {
          setUser(await verifyAdminUser(firebaseUser) ? firebaseUser : null);
        } catch (error) {
          console.error("Unable to verify admin access.", error);
          setUser(null);
        }
      }
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    fetchAdminSnapshot()
      .then((data) => { if (active) { setSnapshot(data); setLoadError(""); } })
      .catch((error) => {
        console.error("Unable to load admin dashboard.", error);
        if (active) setLoadError(error.message || "Data admin gagal dimuat.");
      });
    return () => { active = false; };
  }, [user, refreshKey]);

  async function refresh() {
    setRefreshKey((current) => current + 1);
  }

  async function handleLogout() {
    try {
      await logoutAdmin();
      setUser(null);
      setSnapshot(null);
    } catch (error) {
      notify(error.message || "Logout gagal.");
    }
  }

  if (authLoading) return <PageMessage>Memeriksa sesi admin...</PageMessage>;
  if (!user) return <AdminLogin onSuccess={setUser} />;

  const pendingComments = snapshot?.comments.filter((item) => !item.approved && !item.hidden) || [];
  const pendingFeedback = snapshot?.feedback.filter((item) => !item.approved && !item.hidden) || [];
  const totalVisits = snapshot?.stats?.global?.totalVisits ?? snapshot?.stats?.totalVisits ?? 0;
  const uniqueVisitors = snapshot?.stats?.global?.uniqueVisitors ?? snapshot?.stats?.uniqueVisitors ?? 0;

  return (
    <div className="admin-shell">
      <header className="admin-header"><div className="container admin-header-inner">
        <div><span className="eyebrow">UNDERWATER ROOM</span><h1>Dashboard admin</h1></div>
        <div className="admin-header-actions"><span>{user.email}</span><Link className="button button-outline light-outline" to="/">Lihat situs</Link><button className="button button-dark" onClick={handleLogout} type="button">Keluar</button></div>
      </div></header>
      <main className="container admin-main">
        {!firebaseReady && <div className="demo-banner" role="note">Mode demo aktif. Data dan sesi tersimpan sementara di tab ini; Firebase belum dikonfigurasi.</div>}
        <nav className="admin-tabs" aria-label="Menu admin">
          {[["dashboard", "Ringkasan"], ["works", "Karya"], ["comments", `Komentar (${pendingComments.length})`], ["feedback", `Feedback (${pendingFeedback.length})`], ["settings", "Pengaturan"]].map(([key, label]) => (
            <button aria-current={activeTab === key ? "page" : undefined} className={activeTab === key ? "active" : ""} key={key} onClick={() => setActiveTab(key)} type="button">{label}</button>
          ))}
          <button className="tab-export" onClick={() => exportJson(snapshot)} type="button">Ekspor JSON</button>
        </nav>
        {loadError && <p className="error-message" role="alert">{loadError}</p>}
        {!snapshot && !loadError && <p>{language === "id" ? "Memuat data admin..." : "Loading admin data..."}</p>}
        {snapshot && activeTab === "dashboard" && <AdminDashboard snapshot={snapshot} totalVisits={totalVisits} uniqueVisitors={uniqueVisitors} />}
        {snapshot && activeTab === "works" && <WorksAdmin onRefresh={refresh} works={snapshot.works} />}
        {snapshot && activeTab === "comments" && <CommentsAdmin comments={snapshot.comments} onRefresh={refresh} works={snapshot.works} />}
        {snapshot && activeTab === "feedback" && <FeedbackAdmin feedback={snapshot.feedback} onRefresh={refresh} />}
        {snapshot && activeTab === "settings" && <SettingsAdmin onRefresh={refresh} settings={snapshot.settings} />}
      </main>
      <footer className="admin-footer"><Link to="/">← Kembali ke pameran</Link><span>Data mentah hanya tersedia untuk admin.</span></footer>
    </div>
  );
}

function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      onSuccess(await loginAdmin(email, password));
    } catch (cause) {
      setError(cause.message || "Login gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={submit}>
        <Link className="login-back" to="/">← Kembali ke pameran</Link>
        <span className="eyebrow">UNDERWATER ROOM · XI TMB</span>
        <h1>Masuk sebagai admin</h1>
        <p>{firebaseReady ? "Masuk menggunakan akun Google yang terdaftar sebagai admin." : "Masuk ke demo lokal."}</p>
        {!firebaseReady && <div className="demo-credentials"><strong>Kredensial demo</strong><span>admin@underwaterroom.id</span><span>underwater-demo</span></div>}
        {!firebaseReady && <>
          <label htmlFor="admin-email">Email</label>
          <input autoComplete="username" id="admin-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          <label htmlFor="admin-password">Password</label>
          <input autoComplete="current-password" id="admin-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        </>}
        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="button button-dark full-button" disabled={loading} type="submit">
          {loading ? "Memeriksa..." : firebaseReady ? "Masuk dengan Google" : "Masuk"}
        </button>
        {firebaseReady && <small>Hanya email Google yang terdaftar sebagai admin yang dapat masuk.</small>}
        {!firebaseReady && <small>Login ini hanya untuk demo lokal.</small>}
      </form>
    </main>
  );
}

function AdminDashboard({ snapshot, totalVisits, uniqueVisitors }) {
  const waiting = snapshot.comments.filter((item) => !item.approved && !item.hidden).length + snapshot.feedback.filter((item) => !item.approved && !item.hidden).length;
  const workViews = snapshot.stats.workViews || {};
  const mostViewed = snapshot.works.map((work) => ({
    ...work,
    views: snapshot.stats[`works_${work.id}`]?.views ?? workViews[work.id] ?? 0,
  })).sort((a, b) => b.views - a.views)[0];
  const ratingCount = snapshot.feedback.filter((item) => typeof item.rating === "number");
  const average = ratingCount.length ? (ratingCount.reduce((sum, item) => sum + item.rating, 0) / ratingCount.length).toFixed(1) : "—";

  return <>
    <div className="admin-stat-grid">
      <Stat label="Total kunjungan" value={totalVisits} />
      <Stat label="Unique visitor" value={uniqueVisitors} />
      <Stat label="Menunggu moderasi" value={waiting} />
      <Stat label="Rating rata-rata" value={average} />
    </div>
    <section className="admin-panel">
      <div className="panel-heading"><div><span className="eyebrow">VISITOR</span><h2>View per karya</h2></div><span className="data-note">{firebaseReady ? "Firestore" : "Data demo sesi ini"}</span></div>
      {snapshot.works.length ? <div className="admin-table"><table><thead><tr><th>Karya</th><th>Kreator</th><th>View</th><th>Status</th></tr></thead><tbody>
        {snapshot.works.map((work) => <tr key={work.id}><td>{work.title}</td><td>{work.creator}</td><td>{snapshot.stats[`works_${work.id}`]?.views ?? workViews[work.id] ?? 0}</td><td><StatusBadge status={work.visible ? "Tampil" : "Disembunyikan"} kind={work.visible ? "approved" : "hidden"} /></td></tr>)}
      </tbody></table></div> : <p>Belum ada data karya.</p>}
      {mostViewed && <p className="panel-footnote">View terbanyak: <strong>{mostViewed.title}</strong> · {mostViewed.views}</p>}
    </section>
  </>;
}

function Stat({ label, value }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>;
}

function WorksAdmin({ works, onRefresh }) {
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  async function toggle(work) {
    try {
      await saveWork({ ...work, visible: !work.visible });
      onRefresh();
    } catch (error) { notify(error.message || "Status karya gagal diubah."); }
  }
  async function remove(work) {
    if (!window.confirm(`Hapus karya "${work.title}"?`)) return;
    try {
      await removeWork(work.id);
      onRefresh();
    } catch (error) { notify(error.message || "Karya gagal dihapus."); }
  }
  if (editing) return <WorkEditor initial={editing === "new" ? null : editing} busy={busy} onCancel={() => setEditing(null)} onSave={async (work) => {
    setBusy(true);
    try { await saveWork(work); setEditing(null); onRefresh(); }
    catch (error) { notify(error.message || "Karya gagal disimpan."); }
    finally { setBusy(false); }
  }} />;
  return <section className="admin-panel">
    <div className="panel-heading"><div><span className="eyebrow">KONTEN PAMERAN</span><h2>Kelola karya</h2></div><button className="button button-dark" onClick={() => setEditing("new")} type="button">+ Tambah karya</button></div>
    <div className="admin-table"><table><thead><tr><th>Urutan</th><th>Judul / Kreator</th><th>Status</th><th>Link</th><th>Aksi</th></tr></thead><tbody>
      {works.map((work) => <tr key={work.id}><td>{work.order}</td><td><strong>{work.title}</strong><small>{work.creator}</small></td><td><StatusBadge kind={work.visible ? "approved" : "hidden"} status={work.visible ? "Tampil" : "Disembunyikan"} /></td><td>{work.linkUrl || work.apk?.url ? "Ada" : "—"}</td><td><div className="table-actions"><button className="text-button" onClick={() => setEditing(work)} type="button">Ubah</button><button className="text-button" onClick={() => toggle(work)} type="button">{work.visible ? "Sembunyikan" : "Tampilkan"}</button><button className="text-button danger-text" onClick={() => remove(work)} type="button">Hapus</button></div></td></tr>)}
    </tbody></table></div>
    <p className="panel-footnote">Tambahkan gambar secara manual ke <code>public/uploads/images/</code> di GitHub, lalu pilih dari editor karya.</p>
  </section>;
}

function WorkEditor({ initial, busy, onCancel, onSave }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [creator, setCreator] = useState(initial?.creator || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [images, setImages] = useState((initial?.images || []).join(", "));
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl || "");
  const [apkUrl, setApkUrl] = useState(initial?.apk?.url || "");
  const [apkSize, setApkSize] = useState(initial?.apk?.size || "");
  const [apkVersion, setApkVersion] = useState(initial?.apk?.version || "");
  const [apkSha, setApkSha] = useState(initial?.apk?.sha256 || "");
  const [extras, setExtras] = useState((initial?.extras || []).map((item) => `${item.label}=${item.value}`).join("\n"));
  const [chapters, setChapters] = useState(initial?.chapters || []);
  const [order, setOrder] = useState(initial?.order || 1);
  const [visible, setVisible] = useState(initial?.visible ?? true);
  const [error, setError] = useState("");
  const [assetCategory, setAssetCategory] = useState("");
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetError, setAssetError] = useState("");

  async function openAssetPicker(category) {
    setAssetCategory(category);
    setAssets([]);
    setAssetError("");
    setLoadingAssets(true);
    try {
      setAssets(await fetchGitHubAssets(category));
    } catch (cause) {
      setAssetError(cause.message || "Daftar file GitHub gagal dimuat.");
    } finally {
      setLoadingAssets(false);
    }
  }

  function chooseAsset(asset) {
    setError("");
    if (assetCategory === "images") {
      const currentImages = images.split(",").map((path) => path.trim()).filter(Boolean);
      if (currentImages.includes(asset.url)) return;
      if (currentImages.length >= 12) {
        setError("Maksimal 12 gambar per karya.");
        return;
      }
      setImages([...currentImages, asset.url].join(", "));
    } else {
      setApkUrl(asset.url);
      setApkSize(formatFileSize(asset.size));
      setApkSha("");
      setAssetCategory("");
    }
  }

  function submit(event) {
    event.preventDefault();
    setError("");
    const safeLink = linkUrl ? safeExternalUrl(linkUrl) : "";
    const safeApkUrl = apkUrl ? safeExternalUrl(apkUrl) : "";
    if (linkUrl && !safeLink) return setError("Link redirect harus menggunakan HTTPS.");
    if (apkUrl && !safeApkUrl) return setError("Link APK harus menggunakan HTTPS.");
    if (safeApkUrl && !apkSize.trim()) return setError("Ukuran file APK wajib diisi.");
    if (apkSha.trim() && !/^[a-f0-9]{64}$/i.test(apkSha.trim())) return setError("SHA-256 harus terdiri dari 64 karakter hexadecimal.");
    const id = initial?.id || title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const parsedExtras = extras.split("\n").map((line) => {
      const [label, ...rest] = line.split("=");
      return { label: label.trim(), value: rest.join("=").trim() };
    }).filter((item) => item.label && item.value);
    const parsedChapters = chapters.map((chapter) => ({
      title: chapter.title.trim(),
      content: chapter.content.trim(),
    })).filter((chapter) => chapter.title && chapter.content);
    if (parsedChapters.length > 20) return setError("Maksimal 20 subbab per karya.");
    onSave({
      id, title: title.trim(), creator: creator.trim(), description: description.trim(),
      images: images.split(",").map((path) => path.trim()).filter(Boolean),
      linkUrl: safeLink,
      ...(safeApkUrl ? { apk: { url: safeApkUrl, size: apkSize.trim(), version: apkVersion.trim(), sha256: apkSha.trim() } } : {}),
      extras: parsedExtras,
      ...(parsedChapters.length ? { chapters: parsedChapters } : {}),
      order: Number(order), visible,
    });
    return undefined;
  }

  return <form className="admin-panel editor-form" onSubmit={submit}>
    <div className="panel-heading"><div><span className="eyebrow">{initial ? "UBAH KONTEN" : "KONTEN BARU"}</span><h2>{initial ? "Ubah karya" : "Tambah karya"}</h2></div></div>
    <div className="editor-grid">
      <label>Judul *<input onChange={(event) => setTitle(event.target.value)} required value={title} /></label>
      <label>Kreator *<input onChange={(event) => setCreator(event.target.value)} required value={creator} /></label>
      <label className="span-two">Deskripsi<textarea onChange={(event) => setDescription(event.target.value)} value={description} /></label>
      <label className="span-two">Path gambar (pisahkan dengan koma)<input onChange={(event) => setImages(event.target.value)} placeholder="images/karya-01.webp" value={images} /></label>
      <div className="span-two asset-picker-actions">
        <button className="button button-outline" disabled={busy || loadingAssets} onClick={() => openAssetPicker("images")} type="button">Pilih gambar dari GitHub</button>
        <small>File harus sudah ada di <code>public/uploads/images/</code>.</small>
      </div>
      <label>Link redirect (HTTPS)<input onChange={(event) => setLinkUrl(event.target.value)} type="url" value={linkUrl} /></label>
      <label>Urutan<input min="1" onChange={(event) => setOrder(event.target.value)} type="number" value={order} /></label>
      <label className="span-two">Info tambahan (satu pasang Label=Nilai per baris)<textarea onChange={(event) => setExtras(event.target.value)} placeholder={"Tahun=2026\nTools=Blender"} value={extras} /></label>
      <div className="span-two chapter-editor">
        <div className="panel-heading"><div><h3>Subbab halaman karya</h3><p className="panel-footnote">Tambahkan bagian seperti konsep, proses, atau makna karya.</p></div>
          <button className="button button-outline" disabled={chapters.length >= 20} onClick={() => setChapters((current) => [...current, { title: "", content: "" }])} type="button">+ Tambah subbab</button>
        </div>
        {chapters.map((chapter, index) => <div className="chapter-fields" key={index}>
          <label>Judul subbab<input onChange={(event) => setChapters((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} value={chapter.title} /></label>
          <label>Isi subbab<textarea onChange={(event) => setChapters((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, content: event.target.value } : item))} value={chapter.content} /></label>
          <button className="text-button danger-text" onClick={() => setChapters((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button">Hapus subbab</button>
        </div>)}
      </div>
      <p className="panel-footnote span-two">Tambahkan APK secara manual ke <code>public/uploads/apps/</code> di GitHub. Pengunjung dapat mengunduh APK dari halaman karya.</p>
      <div className="span-two asset-picker-actions">
        <button className="button button-outline" disabled={busy || loadingAssets} onClick={() => openAssetPicker("apps")} type="button">Pilih aplikasi dari GitHub</button>
        <small>File harus sudah ada di <code>public/uploads/apps/</code>.</small>
      </div>
      <label>Link APK (opsional, HTTPS)<input onChange={(event) => setApkUrl(event.target.value)} type="url" value={apkUrl} /></label>
      <label>Ukuran APK (wajib jika link APK diisi)<input onChange={(event) => setApkSize(event.target.value)} placeholder="24 MB" value={apkSize} /></label>
      <label>Versi APK (opsional)<input onChange={(event) => setApkVersion(event.target.value)} value={apkVersion} /></label>
      <label>SHA-256 (opsional)<input onChange={(event) => setApkSha(event.target.value)} value={apkSha} /></label>
      {assetCategory && <section className="span-two github-asset-picker">
        <div className="panel-heading">
          <div><h3>{assetCategory === "images" ? "Pilih gambar" : "Pilih aplikasi"}</h3><p className="panel-footnote">Daftar dibaca dari repository GitHub.</p></div>
          <div className="asset-picker-actions">
            <button className="text-button" disabled={loadingAssets} onClick={() => openAssetPicker(assetCategory)} type="button">Muat ulang</button>
            <button className="text-button" onClick={() => setAssetCategory("")} type="button">Tutup</button>
          </div>
        </div>
        {loadingAssets && <p role="status">Memuat daftar file...</p>}
        {assetError && <p className="error-message" role="alert">{assetError}</p>}
        {!loadingAssets && !assetError && !assets.length && <p>Belum ada file yang cocok. Tambahkan file ke folder GitHub di atas.</p>}
        <div className="github-asset-list">
          {assets.map((asset) => {
            const selected = assetCategory === "images"
              ? images.split(",").map((path) => path.trim()).includes(asset.url)
              : apkUrl === asset.url;
            return <button className="github-asset-option" disabled={selected} key={asset.url} onClick={() => chooseAsset(asset)} type="button">
              <span>{asset.name}</span><small>{selected ? "Sudah dipilih" : formatFileSize(asset.size)}</small>
            </button>;
          })}
        </div>
      </section>}
    </div>
    <label className="check-label"><input checked={visible} onChange={(event) => setVisible(event.target.checked)} type="checkbox" /> Tampilkan ke publik</label>
    {error && <p className="error-message" role="alert">{error}</p>}
    <div className="modal-actions"><button className="button button-outline" onClick={onCancel} type="button">Batal</button><button className="button button-dark" disabled={busy} type="submit">{busy ? "Menyimpan..." : "Simpan karya"}</button></div>
  </form>;
}

function CommentsAdmin({ comments, onRefresh, works }) {
  const workNames = Object.fromEntries(works.map((work) => [work.id, work.title]));
  async function update(item, changes) {
    try { await moderateComment(item.workId, item.id, changes); onRefresh(); }
    catch (error) { notify(error.message || "Moderasi komentar gagal."); }
  }
  async function remove(item) {
    if (!window.confirm("Hapus komentar ini secara permanen?")) return;
    try { await deleteComment(item.workId, item.id); onRefresh(); }
    catch (error) { notify(error.message || "Komentar gagal dihapus."); }
  }
  return <section className="admin-panel">
    <div className="panel-heading"><div><span className="eyebrow">FEEDBACK KARYA</span><h2>Moderasi komentar</h2></div></div>
    {comments.length ? <div className="admin-table"><table><thead><tr><th>Karya</th><th>Nama / Komentar</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
      {comments.map((item) => <tr key={item.id}><td>{workNames[item.workId] || item.workId}</td><td><strong>{item.name || "Anonim"}</strong><p>{item.text}</p></td><td><StatusBadge status={item.hidden ? "Disembunyikan" : item.approved ? "Disetujui" : "Menunggu"} kind={item.hidden ? "hidden" : item.approved ? "approved" : "pending"} /></td><td><div className="table-actions">{!item.approved && <button className="text-button" onClick={() => update(item, { approved: true, hidden: false })} type="button">Setujui</button>}<button className="text-button" onClick={() => update(item, { hidden: !item.hidden })} type="button">{item.hidden ? "Tampilkan" : "Sembunyikan"}</button><button className="text-button danger-text" onClick={() => remove(item)} type="button">Hapus</button></div></td></tr>)}
    </tbody></table></div> : <p>Belum ada komentar.</p>}
  </section>;
}

function FeedbackAdmin({ feedback, onRefresh }) {
  const rated = feedback.filter((item) => typeof item.rating === "number");
  const average = rated.length
    ? (rated.reduce((total, item) => total + item.rating, 0) / rated.length).toFixed(1)
    : "—";
  const answerCounts = {};
  feedback.forEach((item) => Object.entries(item.answers || {}).forEach(([question, answer]) => {
    answerCounts[question] ||= {};
    answerCounts[question][answer] = (answerCounts[question][answer] || 0) + 1;
  }));
  async function update(item, changes) {
    try { await moderateFeedback(item.id, changes); onRefresh(); }
    catch (error) { notify(error.message || "Moderasi feedback gagal."); }
  }
  return <section className="admin-panel">
    <div className="panel-heading"><div><span className="eyebrow">FEEDBACK PAMERAN</span><h2>Respons pengunjung</h2></div></div>
    <div className="feedback-analytics">
      <div className="analytics-average"><span>Rating rata-rata</span><strong>{average}</strong><small>{rated.length} respons</small></div>
      {Object.entries(answerCounts).map(([question, counts]) => <div className="analytics-answer" key={question}><strong>{question}</strong>{Object.entries(counts).map(([answer, count]) => <span key={answer}>{answer} <b>{count}</b></span>)}</div>)}
    </div>
    {feedback.length ? <div className="admin-table"><table><thead><tr><th>Rating</th><th>Jawaban</th><th>Komentar</th><th>Status / Aksi</th></tr></thead><tbody>
      {feedback.map((item) => <tr key={item.id}><td>{item.rating} / 5</td><td>{Object.entries(item.answers || {}).map(([question, answer]) => <p key={question}><strong>{question}:</strong> {answer}</p>)}</td><td>{item.comment || "—"}<small>{item.name || "Anonim"} · {formatDate(item.createdAt)}</small></td><td><StatusBadge status={item.hidden ? "Disembunyikan" : item.approved ? "Disetujui" : "Menunggu"} kind={item.hidden ? "hidden" : item.approved ? "approved" : "pending"} /><div className="table-actions">{!item.approved && <button className="text-button" onClick={() => update(item, { approved: true, hidden: false })} type="button">Setujui komentar</button>}<button className="text-button" onClick={() => update(item, { hidden: !item.hidden })} type="button">{item.hidden ? "Tampilkan" : "Sembunyikan"}</button></div></td></tr>)}
    </tbody></table></div> : <p>Belum ada feedback pameran.</p>}
    <p className="panel-footnote">Rating dan jawaban hanya tampil untuk admin. Komentar hanya dipublikasikan setelah disetujui.</p>
  </section>;
}

function SettingsAdmin({ settings, onRefresh }) {
  const [value, setValue] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [questionsText, setQuestionsText] = useState((settings.questions || defaultSettings.questions)
    .map((question) => `${question.id}|${question.label}|${question.options.join(";")}`)
    .join("\n"));
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const questions = questionsText.split("\n").filter((line) => line.trim()).map((line) => {
        const [id, label, optionsText] = line.split("|");
        const options = optionsText?.split(";").map((option) => option.trim()).filter(Boolean) || [];
        if (!id?.match(/^[a-z0-9_-]{1,40}$/) || !label?.trim() || options.length < 2) {
          throw new Error("Format pertanyaan tidak valid. Gunakan id|pertanyaan|opsi 1;opsi 2.");
        }
        return { id, label: label.trim(), options };
      });
      if (!questions.length) throw new Error("Minimal satu pertanyaan harus tersedia.");
      await saveSettings({ ...value, questions });
      setValue({ ...value, questions });
      onRefresh();
      notify("Pengaturan berhasil disimpan.");
    }
    catch (error) { notify(error.message || "Pengaturan gagal disimpan."); }
    finally { setSaving(false); }
  }
  return <form className="admin-panel settings-form" onSubmit={submit}>
    <div className="panel-heading"><div><span className="eyebrow">PREFERENSI PAMERAN</span><h2>Pengaturan feedback</h2></div></div>
    <label className="check-label"><input checked={value.feedbackOpen} onChange={(event) => setValue({ ...value, feedbackOpen: event.target.checked })} type="checkbox" /> Buka feedback pengunjung</label>
    <p className="field-hint">Feedback otomatis ditutup di luar rentang tanggal ini. Kosongkan jika tidak ingin membatasi tanggal.</p>
    <div className="editor-grid date-grid">
      <label>Tanggal mulai<input onChange={(event) => setValue({ ...value, startDate: event.target.value })} type="date" value={value.startDate || ""} /></label>
      <label>Tanggal selesai<input onChange={(event) => setValue({ ...value, endDate: event.target.value })} type="date" value={value.endDate || ""} /></label>
    </div>
    <h3>Pertanyaan pilihan ganda</h3>
    <p className="field-hint">Satu baris per pertanyaan: <code>id|Pertanyaan|opsi 1;opsi 2</code>. ID pertanyaan harus konsisten untuk menyimpan jawaban.</p>
    <label className="question-config">Daftar pertanyaan<textarea onChange={(event) => setQuestionsText(event.target.value)} value={questionsText} /></label>
    <button className="button button-dark" disabled={saving} type="submit">{saving ? "Menyimpan..." : "Simpan pengaturan"}</button>
  </form>;
}

function StatusBadge({ status, kind }) {
  return <span className={`status-badge ${kind}`}>{status}</span>;
}

function exportJson(snapshot) {
  if (!snapshot) return;
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...snapshot }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `underwater-room-export-${date}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export default App;
