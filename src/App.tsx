import { useState } from 'react'
import { CommandBar, ContentDialog, Flyout, NavigationView, Pivot, Tile, ToggleSwitch, type NavItem } from './components'

type Page = 'start' | 'controls' | 'patterns' | 'settings'
type Era = 'win8' | 'win10'
type ControlTab = 'input' | 'selection' | 'status'

const pages: NavItem<Page>[] = [
  { key: 'start', glyph: '⌂', label: '开始' },
  { key: 'controls', glyph: '☷', label: '控件' },
  { key: 'patterns', glyph: '▤', label: '模式' },
  { key: 'settings', glyph: '⚙', label: '设置' },
]

function StartPage() {
  return <section className="page-enter"><div className="hero"><div><p className="kicker">MICROSOFT DESIGN LANGUAGE / WEB STUDY</p><h2>Content before chrome.</h2><p className="lead">以 React 组件重建 Windows 8 到早期 UWP 的排版、导航、命令、状态与自适应行为，而不是把 Fluent 的圆角卡片套在网页上。</p></div><div className="principles"><span>type is hierarchy</span><span>motion explains change</span><span>touch first, mouse precise</span><span>adaptive, not merely responsive</span></div></div><div className="tile-grid"><Tile title="邮件" meta="3 条新消息" glyph="✉" wide /><Tile title="天气" meta="23°C · 晴" glyph="☀" tone="orange" /><Tile title="日历" meta="今天 2 个事件" glyph="□" tone="green" /><Tile title="音乐" meta="继续播放" glyph="♫" wide tone="purple" /><Tile title="系统" meta="个性化与设备" glyph="⚙" tone="gray" /></div><div className="rules"><div><p className="kicker">SYSTEM PRINCIPLES</p><h3>从页面原型转向组件系统。</h3></div><div className="rule-list"><p><b>01</b><span>NavigationView 负责窗口级导航，Pivot 负责同一上下文中的视图切换。</span></p><p><b>02</b><span>CommandBar 只暴露高频命令；低频操作进入省略号与 Flyout。</span></p><p><b>03</b><span>ContentDialog 用于阻断式决策，Flyout 用于临时、就地的选择。</span></p><p><b>04</b><span>所有控件首先保留原生 HTML 语义，再覆盖 UWP 的视觉状态。</span></p></div></div></section>
}

function ControlsPage() {
  const [tab, setTab] = useState<ControlTab>('input')
  const [name, setName] = useState('Jules')
  const [enabled, setEnabled] = useState(true)
  return <section className="page-enter"><header className="section-head"><p className="kicker">CONTROL PRIMITIVES</p><h2>Controls</h2><p>用 Pivot 划分控件类别，避免把所有组件平铺在一个无限长页面中。</p></header><Pivot tabs={[{ key: 'input', label: 'Input' }, { key: 'selection', label: 'Selection' }, { key: 'status', label: 'Status' }]} value={tab} onChange={setTab} /><div className="control-panel">{tab === 'input' && <><article className="control-block"><h3>Buttons</h3><div className="row"><button className="button accent">主要操作</button><button className="button">标准按钮</button><button className="button quiet">文本操作</button></div></article><article className="control-block"><h3>TextBox / ComboBox</h3><div className="fields"><label>显示名称<input value={name} onChange={(e) => setName(e.target.value)} /></label><label>强调色<select defaultValue="blue"><option value="blue">Windows 蓝</option><option value="green">Windows 绿</option><option value="purple">Windows 紫</option></select></label></div></article></>}{tab === 'selection' && <><article className="control-block"><h3>CheckBox / RadioButton</h3><label className="check"><input type="checkbox" defaultChecked /><span />显示实时内容</label><label className="radio"><input type="radio" name="density" defaultChecked /><span />标准间距</label><label className="radio"><input type="radio" name="density" /><span />紧凑间距</label></article><article className="control-block"><h3>ToggleSwitch</h3><ToggleSwitch checked={enabled} onChange={setEnabled} label="同步设置" detail="面向设置页和即时状态切换" /></article></>}{tab === 'status' && <><article className="control-block"><h3>ProgressRing</h3><div className="status"><span className="ring" /><span>正在同步</span></div></article><article className="control-block"><h3>ProgressBar</h3><div className="bar"><i /></div><small>64%</small></article></>}</div></section>
}

function PatternsPage() {
  const [flyout, setFlyout] = useState(false)
  const [dialog, setDialog] = useState(false)
  return <section className="page-enter"><header className="section-head"><p className="kicker">INTERACTION PATTERNS</p><h2>Flyout & Dialog</h2><p>临时层必须服务于上下文，而不是成为“所有内容都放进弹窗”的逃生口。</p></header><div className="pattern-grid"><article><span className="pattern-index">01</span><h3>Flyout</h3><p>锚定触发位置，适合轻量选择和更多命令。</p><Flyout open={flyout} onClose={() => setFlyout(false)} anchor={<button className="button" onClick={() => setFlyout((v) => !v)}>打开 Flyout</button>}><button role="menuitem" onClick={() => setFlyout(false)}>固定到开始屏幕</button><button role="menuitem" onClick={() => setFlyout(false)}>添加到收藏</button><button role="menuitem" onClick={() => setFlyout(false)}>属性</button></Flyout></article><article><span className="pattern-index">02</span><h3>ContentDialog</h3><p>只用于需要用户明确确认后才能继续的流程。</p><button className="button accent" onClick={() => setDialog(true)}>打开 ContentDialog</button></article></div><div className="motion-stage"><div className="motion-block">01</div><div className="motion-block tall">02</div><div className="motion-block short">03</div></div><ContentDialog open={dialog} title="删除此项目？" onClose={() => setDialog(false)}><p>这是阻断式确认示例。真正的 UWP 应避免为可撤销操作滥用确认框。</p></ContentDialog></section>
}

function SettingsPage({ dark, setDark, motion, setMotion, compact, setCompact }: { dark: boolean; setDark: (v: boolean) => void; motion: boolean; setMotion: (v: boolean) => void; compact: boolean; setCompact: (v: boolean) => void }) {
  return <section className="page-enter settings-page"><header className="section-head"><p className="kicker">PERSONALIZATION</p><h2>Settings</h2></header><div className="settings-stack"><ToggleSwitch checked={dark} onChange={setDark} label="深色主题" detail="模拟 RequestedTheme / ThemeResource" /><ToggleSwitch checked={motion} onChange={setMotion} label="界面动画" detail="关闭非必要转场与加载动画" /><ToggleSwitch checked={compact} onChange={setCompact} label="紧凑密度" detail="提高桌面鼠标环境的信息密度" /></div></section>
}

export default function App() {
  const [page, setPage] = useState<Page>('start')
  const [era, setEra] = useState<Era>('win10')
  const [dark, setDark] = useState(true)
  const [motion, setMotion] = useState(true)
  const [compact, setCompact] = useState(false)
  const reset = () => { setDark(true); setMotion(true); setCompact(false) }
  return <div className={`app ${dark ? 'dark' : 'light'} ${era} ${motion ? '' : 'no-motion'} ${compact ? 'compact' : ''}`}><NavigationView items={pages} value={page} onChange={setPage} /><main className="shell"><header className="topbar"><div><p className="kicker">REACT + TYPESCRIPT</p><h1>{pages.find((item) => item.key === page)?.label}</h1></div><div className="era-switch" role="group" aria-label="设计年代"><button className={era === 'win8' ? 'active' : ''} onClick={() => setEra('win8')}>Windows 8</button><button className={era === 'win10' ? 'active' : ''} onClick={() => setEra('win10')}>Windows 10</button></div></header><CommandBar commands={[{ label: '搜索', glyph: '⌕' }, { label: '共享', glyph: '↗' }, { label: '重置', glyph: '↻', onClick: reset }, { label: '更多', glyph: '•••' }]} />{page === 'start' && <StartPage />}{page === 'controls' && <ControlsPage />}{page === 'patterns' && <PatternsPage />}{page === 'settings' && <SettingsPage dark={dark} setDark={setDark} motion={motion} setMotion={setMotion} compact={compact} setCompact={setCompact} />}</main></div>
}
