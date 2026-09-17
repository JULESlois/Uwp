import { useState } from 'react'
import { Button, CheckBox, ComboBox, Pivot, ProgressBar, Slider } from 'uwp-react-lab/controls'
import { CommandBar } from 'uwp-react-lab/commands'
import { ContentDialog } from 'uwp-react-lab/overlays'

type View = 'projects' | 'activity'

const projects = [
  { name: 'Atlas', detail: 'Design system migration', progress: 78, status: 'active' },
  { name: 'Northwind', detail: 'Desktop shell prototype', progress: 46, status: 'active' },
  { name: 'Archive', detail: 'Legacy interaction notes', progress: 100, status: 'done' },
]

export default function App() {
  const [view, setView] = useState<View>('projects')
  const [filter, setFilter] = useState('all')
  const [compact, setCompact] = useState(false)
  const [capacity, setCapacity] = useState(68)
  const [dialogOpen, setDialogOpen] = useState(false)

  const visibleProjects = projects.filter((project) => filter === 'all' || project.status === filter)

  return (
    <div className={`app win10 project-hub${compact ? ' compact' : ''}`}>
      <header className="hub-header">
        <div>
          <h1>Project Hub</h1>
          <p>一个只通过 UWP public API 组合出来的独立网站示例。</p>
        </div>
        <Button variant="accent" onClick={() => setDialogOpen(true)}>新建项目</Button>
      </header>

      <CommandBar
        ariaLabel="项目命令"
        commands={[
          { label: '新建', glyph: '+', primary: true, onClick: () => setDialogOpen(true) },
          { label: '同步', glyph: '↻' },
          { label: '导出', glyph: '⇩' },
        ]}
      />

      <Pivot
        tabs={[{ key: 'projects', label: '项目' }, { key: 'activity', label: '活动' }]}
        value={view}
        onChange={setView}
      />

      {view === 'projects' ? (
        <main className="hub-content">
          <aside className="hub-filters" aria-label="项目筛选">
            <h2>筛选</h2>
            <ComboBox
              label="状态"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: '全部' },
                { value: 'active', label: '进行中' },
                { value: 'done', label: '已完成' },
              ]}
            />
            <CheckBox checked={compact} onChange={setCompact} label="紧凑密度" />
            <Slider label="团队容量" value={capacity} onValueChange={setCapacity} formatValue={(value) => `${value}%`} />
          </aside>

          <section className="project-list" aria-label="项目">
            {visibleProjects.map((project) => (
              <article className="project-row" key={project.name}>
                <div>
                  <h2>{project.name}</h2>
                  <p>{project.detail}</p>
                </div>
                <div className="project-progress">
                  <span>{project.progress}%</span>
                  <ProgressBar value={project.progress} label={`${project.name} 进度`} />
                </div>
                <Button variant="quiet">打开</Button>
              </article>
            ))}
          </section>
        </main>
      ) : (
        <main className="activity-list">
          <h2>最近活动</h2>
          <p><time>09:42</time><span>Atlas 完成了导航结构迁移。</span></p>
          <p><time>08:10</time><span>Northwind 更新了 CommandBar 命令。</span></p>
          <p><time>昨天</time><span>Archive 已标记为完成。</span></p>
        </main>
      )}

      <ContentDialog
        open={dialogOpen}
        title="新建项目"
        onClose={() => setDialogOpen(false)}
        primaryButtonText="创建"
        secondaryButtonText="取消"
      >
        <p>这里可以继续组合 TextBox、ComboBox 与模板选择器；对话框、焦点管理和按钮语义均由组件库负责。</p>
      </ContentDialog>
    </div>
  )
}
