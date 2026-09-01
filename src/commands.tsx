import { CommandBar, type Command } from './components'

export type PriorityCommand = Command & { priority?: 'primary' | 'secondary' }

export function PriorityCommandBar({ commands }: { commands: PriorityCommand[] }) {
  const ranked = [...commands.filter((command) => command.priority !== 'secondary'), ...commands.filter((command) => command.priority === 'secondary')]
  return <div className="priority-command-shell"><CommandBar commands={ranked.map((command) => ({ ...command, primary: command.priority !== 'secondary' }))} /></div>
}
