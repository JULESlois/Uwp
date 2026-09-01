import { useState } from 'react'
import { AcrylicPane, AppBar, AutoSuggestBox, CharmBar, CheckBox, ComboBox, CommandBar, ContentDialog, ContextMenu, EdgeAppBar, Flyout, GridView, ListView, MasterDetailsView, NavigationView, Pivot, RadioButton, RevealSurface, SemanticZoom, SettingsPane, SnapView, SplitView, TeachingTip, Tile, ToggleSwitch, type ListItem, type NavItem, type PaneMode } from './components'

type Page = 'start' | 'controls' | 'views' | 'patterns' | 'settings'
type Era = 'win8' | 'win10'
type ControlTab = 'input' | 'selection' | 'status'

const pages: NavItem<Page>[] = [
  { key: 'start', glyph: '⌂', label: '开始' },
  { key: 'controls', glyph: '☷', label: '控件' },
  { key: 'views', glyph: '▤', label: '视图' },
  { key: 'patterns', glyph: '◫', label: '模式' },
  { key: 'settings', glyph: '⚙', label: '设置' },
]

const startGroups = [
  { name: '通讯', tiles: [<Tile key="mail" title="邮件" meta="3 条新消息" glyph="✉" wide />, <Tile key="people" title="人脉" meta="18 位联系人在线" glyph="◎" tone="purple" />] },
  { name: '日程', tiles: [<Tile key="weather" title="天气" meta="23°C · 晴" glyph="☀" tone="orange" />, <Tile key="calendar" title="日历" meta="今天 2 个事件" glyph="□" tone="green" />] },
  { name: '媒体', tiles: [<Tile key="music" title="音乐" meta="继续播放" glyph="♫" wide tone="purple" />, <Tile key="photos" title="照片" meta="最近 42 张" glyph="▧" tone="blue" />] },
  { name: '系统', tiles: [<Tile key="system" title="系统" meta="个性化与设备" glyph="⚙" tone="gray" />, <Tile key="store" title="应用商店" meta="4 个更新" glyph="▣" tone="green" />] },
]

function StartPage({ era }: { era: Era }) {
  const [zoomedOut, setZoomedOut] = useState(false)
  const jump = (name: string) => document.getElementById(`group-${name}`)?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  const overview = <div className="start-overview">{startGroups.map((group) => <button key={group.name} onClick={() => { setZoomedOut(false); requestAnimationFrame(() => jump(group.name)) }}><strong>{group.name}</strong><span>{group.tiles.length}</span></button>)}</div>
  const detail = <><nav className="group-nav" aria-label="磁贴分组">{startGroups.map((group) => <button key={group.name} onClick={() => jump(group.name)}>{group.name}</button>)}</nav><div className={`start-groups ${era === 'win8' ? 'horizontal' : ''}`} onWheel={(event) => { if (era === 'win8' && Math.abs(event.deltaY) > Math.abs(event.deltaX)) event.currentTarget.scrollLeft += event.deltaY }}>{startGroups.map((group) => <section id={`group-${group.name}`} className="start-group" key={group.name}><h3>{group.name}</h3><div className="group-tiles">{group.tiles}</div></section>)}</div></>
  return <section className="page-enter"><div className="hero simple"><h2>内容优先于界面装饰。</h2><p className="lead">Windows 8 强调全屏、横向阅读和磁贴分组；Windows 10/UWP 在此基础上加入更细的窗口层级、命令和反馈。</p></div><SemanticZoom zoomedOut={zoomedOut} onChange={setZoomedOut} overview={overview} detail={detail} /><div className="rules"><h3>设计原则</h3><div className="rule-list"><p><b>01</b><span>字号、基线和留白承担主要层级，不用多余标签解释页面是什么。</span></p><p><b>02</b><span>Windows 8 模式使用横向开始屏幕、分组导航与 Semantic Zoom。</span></p><p><b>03</b><span>分割线只在真正需要定义结构边界时出现。</span></p></div></div></section>
}

function ControlsPage() {
  const [tab, setTab] = useState<ControlTab>('input')
  const [name, setName] = useState('Jules')
  const [accent, setAccent] = useState('blue')
  const [enabled, setEnabled] = useState(true)
  const [live, setLive] = useState(true)
  const [density, setDensity] = useState('standard')
  const [query, setQuery] = useState('')
  return <section className="page-enter"><header className="section-head"><h2>基础控件</h2><p>控件状态也由这些基础组件统一承担，视图和模式页面不再自定义另一套 hover、selected 或 disabled 规则。</p></header><Pivot tabs={[{ key: 'input', label: '输入' }, { key: 'selection', label: '选择' }, { key: 'status', label: '状态' }]} value={tab} onChange={setTab} /><div className="control-panel">{tab === 'input' && <><article className="control-block"><h3>按钮</h3><div className="row"><button className="button accent">主要操作</button><button className="button">标准按钮</button><button className="button quiet">文本操作</button><button className="button" disabled>不可用</button></div></article><article className="control-block"><h3>文本框、下拉框与建议</h3><div className="fields"><label className="field-label">显示名称<input value={name} onChange={(event) => setName(event.target.value)} /></label><ComboBox label="强调色" value={accent} onChange={setAccent} options={[{ value: 'blue', label: 'Windows 蓝' }, { value: 'green', label: 'Windows 绿' }, { value: 'purple', label: 'Windows 紫' }]} /><label className="field-label field-wide">AutoSuggestBox<AutoSuggestBox value={query} onChange={setQuery} suggestions={['NavigationView', 'ListView', 'GridView', 'SemanticZoom', 'ContentDialog', 'SettingsPane']} placeholder="搜索控件" /></label><ComboBox label="不可用下拉框" value="locked" onChange={() => undefined} disabled options={[{ value: 'locked', label: '此项不可更改' }]} /></div></article></>}{tab === 'selection' && <><article className="control-block"><h3>复选与单选</h3><div className="selection-stack"><CheckBox checked={live} onChange={setLive} label="显示实时内容" /><RadioButton checked={density === 'standard'} onChange={() => setDensity('standard')} name="density" value="standard" label="标准间距" /><RadioButton checked={density === 'compact'} onChange={() => setDensity('compact')} name="density" value="compact" label="紧凑间距" /><CheckBox checked={false} onChange={() => undefined} label="不可用选项" disabled /></div></article><article className="control-block"><h3>开关</h3><ToggleSwitch checked={enabled} onChange={setEnabled} label="同步设置" detail="立即改变状态，不额外弹出确认框" /><ToggleSwitch checked={false} onChange={() => undefined} label="不可用开关" disabled /></article></>}{tab === 'status' && <><article className="control-block"><h3>加载指示</h3><div className="status"><span className="ring" /><span>正在同步</span></div></article><article className="control-block"><h3>进度</h3><div className="bar"><i /></div><small>64%</small></article></>}</div></section>
}

const libraryItems: ListItem[] = [
  { key: 'design', title: 'Design language notes', detail: 'Metro / Modern UI', glyph: '▤' },
  { key: 'controls', title: 'Control inventory', detail: 'Buttons, selectors, input', glyph: '☷' },
  { key: 'motion', title: 'Motion studies', detail: 'Enter, exit, connected motion', glyph: '↝' },
  { key: 'layout', title: 'Adaptive layouts', detail: '正在由系统策略锁定', glyph: '▦', disabled: true },
]

function ViewsPage() {
  const [selected, setSelected] = useState<string[]>(['design'])
  const [gridSelected, setGridSelected] = useState<string[]>(['controls'])
  const [folder, setFolder] = useState('inbox')
  const [master, setMaster] = useState('design')
  const folders = [{ key: 'inbox', label: '收件箱' }, { key: 'archive', label: '归档' }, { key: 'flagged', label: '已标记' }]
  return <section className="page-enter"><header className="section-head"><h2>列表与分栏</h2><p>列表、网格和分栏直接复用基础选择器；不可用状态也从数据模型一路传到相同的控件状态。</p></header><div className="view-grid"><article className="view-block"><div className="view-heading"><h3>ListView</h3><strong>已选择 {selected.length} 项</strong></div><ListView items={libraryItems} selected={selected} onSelectionChange={setSelected} /></article><article className="view-block"><div className="view-heading"><h3>GridView</h3><strong>已选择 {gridSelected.length} 项</strong></div><GridView items={libraryItems} selected={gridSelected} onSelectionChange={setGridSelected} /></article><article className="view-block wide"><div className="view-heading"><h3>SplitView</h3></div><SplitView pane={<nav className="folder-list">{folders.map((item) => <RadioButton key={item.key} name="folder" value={item.key} checked={folder === item.key} onChange={() => setFolder(item.key)} label={item.label} />)}</nav>}><div className="split-detail"><h3>{folders.find((item) => item.key === folder)?.label}</h3><p>宽度降低时窗格会从并排布局重排为上下文更紧凑的状态，而不是继续压缩文字。</p><div className="message-lines"><span /><span /><span /></div></div></SplitView></article><article className="view-block wide"><div className="view-heading"><h3>MasterDetailsView</h3></div><MasterDetailsView items={libraryItems} value={master} onChange={setMaster} renderDetail={(item) => <div className="split-detail"><h3>{item.title}</h3><p>{item.detail}</p><div className="message-lines"><span /><span /><span /></div></div>} /></article></div></section>
}

function PatternsPage({ era }: { era: Era }) {
  const [flyout, setFlyout] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [settings, setSettings] = useState(false)
  const [tip, setTip] = useState(false)
  const [snapped, setSnapped] = useState(false)
  const [status, setStatus] = useState('尚未执行命令')
  return <section className="page-enter"><header className="section-head"><h2>交互模式</h2><p>Windows 8 的边缘命令和 Windows 10 的窗格、材质反馈继续保持分离；底部边缘现在也能真正唤出应用命令。</p></header><div className="pattern-grid expanded"><article><h3>Flyout</h3><p>锚定触发位置，适合轻量选择。</p><Flyout open={flyout} onClose={() => setFlyout(false)} anchor={<button className="button" onClick={() => setFlyout((value) => !value)}>打开 Flyout</button>}><button role="menuitem" onClick={() => setFlyout(false)}>固定到开始屏幕</button><button role="menuitem" onClick={() => setFlyout(false)}>添加到收藏</button><button role="menuitem" onClick={() => setFlyout(false)}>属性</button></Flyout></article><article><h3>ContentDialog</h3><p>只用于必须明确确认后才能继续的流程。</p><button className="button accent" onClick={() => setDialog(true)}>打开对话框</button></article><article><h3>ContextMenu</h3><p>在下面区域使用鼠标右键打开上下文命令。</p><ContextMenu items={[{ label: '打开', onClick: () => setStatus('已打开项目') }, { label: '重命名', onClick: () => setStatus('进入重命名') }, { label: '删除', onClick: () => setStatus('已执行删除示例') }, { label: '系统保留命令', disabled: true }]}><div className="context-target">右键单击此区域</div></ContextMenu></article><article><h3>TeachingTip</h3><p>用于就地解释新功能，不阻断当前任务。</p><TeachingTip open={tip} title="Semantic Zoom" onClose={() => setTip(false)} anchor={<button className="button" onClick={() => setTip(true)}>显示提示</button>}><p>使用缩放按钮在磁贴与分组概览之间切换。</p></TeachingTip></article><article><h3>SettingsPane</h3><p>Windows 8 从屏幕边缘进入；Windows 10 可作为窄设置窗格。</p><button className="button" onClick={() => setSettings(true)}>打开设置面板</button></article><article><h3>Snap View</h3><p>布局变化不是简单缩放，而是重新选择保留的信息与操作。</p></article></div><SnapView snapped={snapped} onChange={setSnapped} /><div className="appbar-demo"><div><h3>AppBar / BottomAppBar</h3><p>{status}</p></div><AppBar commands={[{ label: '添加', glyph: '+', onClick: () => setStatus('已添加项目') }, { label: '固定', glyph: '⌖', onClick: () => setStatus('已固定到开始屏幕') }, { label: '删除', glyph: '×', onClick: () => setStatus('已删除项目') }, { label: '不可用', glyph: '·', disabled: true }]} /></div><div className="material-demo"><RevealSurface><AcrylicPane><h3>{era === 'win10' ? 'Acrylic + Reveal' : '平面 Surface'}</h3><p>{era === 'win10' ? 'Reveal 只保留低强度边缘掠光；高对比度或 forced-colors 环境下会自动关闭材质效果。' : 'Windows 8 模式关闭 Acrylic 与 Reveal，保留纯色平面和清晰层级。'}</p></AcrylicPane></RevealSurface></div><ContentDialog open={dialog} title="删除此项目？" onClose={() => setDialog(false)}><p>这是阻断式确认示例。可撤销操作不应默认使用确认框。</p></ContentDialog><SettingsPane open={settings} title="当前应用设置" onClose={() => setSettings(false)}><div className="pane-settings"><ToggleSwitch checked={true} onChange={() => undefined} label="允许通知" /><ToggleSwitch checked={false} onChange={() => undefined} label="后台更新" /><button className="pane-link" onClick={() => setSettings(false)}>权限与隐私</button></div></SettingsPane></section>
}

function SettingsPage({ dark, setDark, motion, setMotion, compact, setCompact, highContrast, setHighContrast, navMode, setNavMode }: { dark: boolean; setDark: (value: boolean) => void; motion: boolean; setMotion: (value: boolean) => void; compact: boolean; setCompact: (value: boolean) => void; highContrast: boolean; setHighContrast: (value: boolean) => void; navMode: PaneMode; setNavMode: (value: PaneMode) => void }) {
  return <section className="page-enter settings-page"><header className="section-head"><h2>个性化</h2><p>设置项只保留会真实改变界面行为的选项；NavigationView pane mode 也直接控制左侧窗格。</p></header><div className="settings-stack"><ToggleSwitch checked={dark} onChange={setDark} label="深色主题" detail="切换页面明暗资源" /><ToggleSwitch checked={motion} onChange={setMotion} label="界面动画" detail="关闭非必要转场与加载动画" /><ToggleSwitch checked={compact} onChange={setCompact} label="紧凑密度" detail="提高桌面鼠标环境的信息密度" /><ToggleSwitch checked={highContrast} onChange={setHighContrast} label="高对比度" detail="模拟高对比度资源；系统 forced-colors 仍拥有更高优先级" /><div className="settings-field"><ComboBox label="NavigationView 窗格" value={navMode} onChange={(value) => setNavMode(value as PaneMode)} options={[{ value: 'auto', label: '自动' }, { value: 'compact', label: '紧凑' }, { value: 'expanded', label: '展开' }]} /></div></div></section>
}

export default function App() {
  const [page, setPage] = useState<Page>('start')
  const [era, setEra] = useState<Era>('win10')
  const [dark, setDark] = useState(true)
  const [motion, setMotion] = useState(true)
  const [compact, setCompact] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [navMode, setNavMode] = useState<PaneMode>('auto')
  const [charms, setCharms] = useState(false)
  const [edgeAppBar, setEdgeAppBar] = useState(false)
  const reset = () => { setDark(true); setMotion(true); setCompact(false); setHighContrast(false); setNavMode('auto') }
  const charmSelect = (command: string) => { if (command === 'start') setPage('start'); if (command === 'search') setPage('controls'); if (command === 'settings') setPage('settings'); setCharms(false) }
  const edgeCommands = [{ label: '搜索', glyph: '⌕', onClick: () => { setPage('controls'); setEdgeAppBar(false) } }, { label: '开始', glyph: '⊞', onClick: () => { setPage('start'); setEdgeAppBar(false) } }, { label: '设置', glyph: '⚙', onClick: () => { setPage('settings'); setEdgeAppBar(false) } }]
  return <div className={`app ${dark ? 'dark' : 'light'} ${era} nav-${navMode} ${motion ? '' : 'no-motion'} ${compact ? 'compact' : ''} ${highContrast ? 'high-contrast' : ''}`}><NavigationView items={pages} value={page} onChange={setPage} mode={era === 'win10' ? navMode : 'auto'} />{era === 'win8' && <><CharmBar open={charms} onOpen={() => { setCharms(true); setEdgeAppBar(false) }} onClose={() => setCharms(false)} onSelect={charmSelect} /><EdgeAppBar open={edgeAppBar} onOpen={() => { setEdgeAppBar(true); setCharms(false) }} onClose={() => setEdgeAppBar(false)} commands={edgeCommands} /></>}<main className="shell"><header className="topbar"><h1>{pages.find((item) => item.key === page)?.label}</h1><div className="era-switch" role="group" aria-label="设计年代"><button className={era === 'win8' ? 'active' : ''} onClick={() => setEra('win8')}>Windows 8</button><button className={era === 'win10' ? 'active' : ''} onClick={() => setEra('win10')}>Windows 10</button></div></header>{era === 'win10' && <CommandBar commands={[{ label: '搜索', glyph: '⌕', onClick: () => setPage('controls') }, { label: '共享', glyph: '↗' }, { label: '重置', glyph: '↻', onClick: reset }, { label: '更多', glyph: '•••' }]} />}{page === 'start' && <StartPage era={era} />}{page === 'controls' && <ControlsPage />}{page === 'views' && <ViewsPage />}{page === 'patterns' && <PatternsPage era={era} />}{page === 'settings' && <SettingsPage dark={dark} setDark={setDark} motion={motion} setMotion={setMotion} compact={compact} setCompact={setCompact} highContrast={highContrast} setHighContrast={setHighContrast} navMode={navMode} setNavMode={setNavMode} />}</main></div>
}
