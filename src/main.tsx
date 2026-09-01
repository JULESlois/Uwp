import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'

type Page = 'start' | 'controls' | 'motion' | 'settings'
type Era = 'win8' | 'win10'

type TileProps = {
  title: string
  meta: string
  glyph: string
  wide?: boolean
  tone?: 'blue' | 'green' | 'orange' | 'purple' | 'gray'
}

const pages: Array<{ key: Page; glyph: string; label: string }> = [
  { key: 'start', glyph: '⌂', label: '开始' },
  { key: 'controls', glyph: '☷', label: '控件' },
  { key: 'motion', glyph: '↝', label: '动效' },
  { key: 'settings', glyph: '⚙', label: '设置' },
]

function Tile({ title, meta, glyph, wide, tone = 'blue' }: TileProps) {
  return (
    <button className={`tile tile--${tone}${wide ? ' tile--wide' : ''}`}>
      <span className="tile__glyph" aria-hidden="true">{glyph}</span>
      <span className="tile__copy"><strong>{title}</strong><small>{meta}</small></span>
    </button>
  )
}

function Toggle({ checked, onChange, label, detail }: { checked: boolean; onChange: (value: boolean) => void; label: string; detail: string }) {
  return (
    <label className="setting-row">
      <span><strong>{label}</strong><small>{detail}</small></span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i className="switch" aria-hidden="true"><b /></i>
    </label>
  )
}

function StartPage() {
  return (
    <>
      <section className="hero">
        <div>
          <p className="kicker">MICROSOFT DESIGN LANGUAGE / WEB STUDY</p>
          <h2>Metro is typography,<br />motion and content.</h2>
          <p className="lead">不是给网页套一层“Windows 皮肤”，而是复刻 Windows 8 到早期 UWP 的信息层级、直接操控、磁贴节奏与自适应布局。</p>
        </div>
        <div className="principles" aria-label="设计原则">
          <span>content before chrome</span>
          <span>type is hierarchy</span>
          <span>motion explains change</span>
          <span>touch first, mouse precise</span>
        </div>
      </section>

      <section className="tile-grid" aria-label="开始磁贴">
        <Tile title="邮件" meta="3 条新消息" glyph="✉" wide />
        <Tile title="天气" meta="23°C · 晴" glyph="☀" tone="orange" />
        <Tile title="日历" meta="今天 2 个事件" glyph="□" tone="green" />
        <Tile title="音乐" meta="继续播放" glyph="♫" wide tone="purple" />
        <Tile title="系统" meta="个性化与设备" glyph="⚙" tone="gray" />
      </section>

      <section className="rules">
        <div><p className="kicker">DESIGN RULES</p><h3>界面不是卡片集合。</h3></div>
        <div className="rule-list">
          <p><b>01</b><span>用字号、基线、留白和阅读方向建立层级，而不是依赖圆角容器。</span></p>
          <p><b>02</b><span>强调色用于当前状态与主要操作，不把每个元素都染成强调色。</span></p>
          <p><b>03</b><span>Windows 8 偏全屏、平面和横向节奏；Windows 10/UWP 增加窗体层级与细粒度反馈。</span></p>
          <p><b>04</b><span>窄屏改变布局状态：导航移到底部，内容重新编排，而不是简单缩放。</span></p>
        </div>
      </section>
    </>
  )
}

function ControlsPage() {
  const [name, setName] = useState('Jules')
  const [enabled, setEnabled] = useState(true)
  return (
    <section className="page-enter">
      <header className="section-head"><p className="kicker">UWP CONTROL LANGUAGE</p><h2>Controls</h2><p>原生语义优先，再用 CSS 复刻 UWP 的状态语言。</p></header>
      <div className="control-grid">
        <article className="control-block"><h3>Buttons</h3><div className="row"><button className="button accent">主要操作</button><button className="button">标准按钮</button><button className="button quiet">文本操作</button></div></article>
        <article className="control-block"><h3>Selection</h3><label className="check"><input type="checkbox" defaultChecked /><span />显示实时内容</label><label className="radio"><input type="radio" name="density" defaultChecked /><span />标准间距</label><label className="radio"><input type="radio" name="density" /><span />紧凑间距</label></article>
        <article className="control-block control-block--wide"><h3>TextBox / ComboBox</h3><div className="fields"><label>显示名称<input value={name} onChange={(e) => setName(e.target.value)} /></label><label>强调色<select defaultValue="blue"><option value="blue">Windows 蓝</option><option value="green">Windows 绿</option><option value="purple">Windows 紫</option></select></label></div></article>
        <article className="control-block control-block--wide"><h3>Settings row</h3><Toggle checked={enabled} onChange={setEnabled} label="同步设置" detail="模拟 ToggleSwitch + SettingsPane 行为" /></article>
        <article className="control-block"><h3>ProgressRing</h3><div className="status"><span className="ring" /><span>正在同步</span></div></article>
        <article className="control-block"><h3>ProgressBar</h3><div className="bar"><i /></div><small>64%</small></article>
      </div>
    </section>
  )
}

function MotionPage() {
  return (
    <section className="page-enter">
      <header className="section-head"><p className="kicker">MOTION & FEEDBACK</p><h2>Motion</h2><p>动效负责解释空间关系，不负责炫技。</p></header>
      <div className="motion-stage"><div className="motion-block">01</div><div className="motion-block tall">02</div><div className="motion-block short">03</div></div>
      <div className="rule-list compact-rules">
        <p><b>Enter</b><span>内容从主阅读方向快速进入，建立页面连续性。</span></p>
        <p><b>Press</b><span>1–2px 位移或极轻缩放，传递直接操控反馈。</span></p>
        <p><b>Reveal</b><span>Win10 可使用边缘高光，但不要演化为玻璃卡片泛滥。</span></p>
      </div>
    </section>
  )
}

function SettingsPage({ dark, setDark, motion, setMotion, compact, setCompact }: { dark: boolean; setDark: (v: boolean) => void; motion: boolean; setMotion: (v: boolean) => void; compact: boolean; setCompact: (v: boolean) => void }) {
  return (
    <section className="page-enter settings-page">
      <header className="section-head"><p className="kicker">PERSONALIZATION</p><h2>Settings</h2></header>
      <div className="settings-stack">
        <Toggle checked={dark} onChange={setDark} label="深色主题" detail="模拟 RequestedTheme / ThemeResource" />
        <Toggle checked={motion} onChange={setMotion} label="界面动画" detail="关闭后禁用非必要转场和加载动画" />
        <Toggle checked={compact} onChange={setCompact} label="紧凑密度" detail="面向鼠标与桌面窗口的较高信息密度" />
      </div>
    </section>
  )
}

function App() {
  const [page, setPage] = useState<Page>('start')
  const [era, setEra] = useState<Era>('win10')
  const [dark, setDark] = useState(true)
  const [motion, setMotion] = useState(true)
  const [compact, setCompact] = useState(false)

  return (
    <div className={`app ${dark ? 'dark' : 'light'} ${era} ${motion ? '' : 'no-motion'} ${compact ? 'compact' : ''}`}>
      <aside className="nav" aria-label="主导航">
        <div className="nav__brand"><span>▦</span><strong>UWP</strong></div>
        <nav>{pages.map((item) => <button key={item.key} className={page === item.key ? 'active' : ''} onClick={() => setPage(item.key)}><span>{item.glyph}</span><b>{item.label}</b></button>)}</nav>
      </aside>

      <main className="shell">
        <header className="topbar">
          <div><p className="kicker">REACT + TYPESCRIPT</p><h1>{pages.find((item) => item.key === page)?.label}</h1></div>
          <div className="era-switch" role="group" aria-label="设计年代"><button className={era === 'win8' ? 'active' : ''} onClick={() => setEra('win8')}>Windows 8</button><button className={era === 'win10' ? 'active' : ''} onClick={() => setEra('win10')}>Windows 10</button></div>
        </header>

        <div className="commandbar" role="toolbar" aria-label="命令栏"><button>⌕<span>搜索</span></button><button>↗<span>共享</span></button><button onClick={() => { setDark(true); setMotion(true); setCompact(false) }}>↻<span>重置</span></button><i /><button>•••</button></div>

        {page === 'start' && <StartPage />}
        {page === 'controls' && <ControlsPage />}
        {page === 'motion' && <MotionPage />}
        {page === 'settings' && <SettingsPage dark={dark} setDark={setDark} motion={motion} setMotion={setMotion} compact={compact} setCompact={setCompact} />}
      </main>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
