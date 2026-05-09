'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, Clock, CheckCircle2, Circle } from 'lucide-react';
import { Goal, Milestone, Task } from '../types';
import { useApp } from '../context';
import MilestoneModal from './MilestoneModal';
import TaskModal from './TaskModal';
import GoalModal from './GoalModal';
import { format, parseISO, differenceInCalendarMonths } from 'date-fns';

function getMilestoneBadge(period: string): { label: string; color: string } {
  const now = format(new Date(), 'yyyy-MM');
  const next1 = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), 'yyyy-MM');
  const next2 = format(new Date(new Date().getFullYear(), new Date().getMonth() + 2, 1), 'yyyy-MM');
  if (period < now) return { label: '期限切れ', color: 'bg-red-500/20 text-red-400' };
  if (period === now) return { label: '今月', color: 'bg-blue-500/20 text-blue-400' };
  if (period === next1 || period === next2) return { label: '近日', color: 'bg-green-500/20 text-green-400' };
  return { label: '予定', color: 'bg-gray-700 text-gray-400' };
}

function calcTaskProgress(tasks: Task[]) {
  if (tasks.length === 0) return { taskPct: 0, timePct: 0 };
  const done = tasks.filter(t => t.done).length;
  const taskPct = Math.round((done / tasks.length) * 100);
  const totalTime = tasks.reduce((s, t) => s + (t.estimatedMinutes ?? 1), 0);
  const doneTime = tasks.filter(t => t.done).reduce((s, t) => s + (t.estimatedMinutes ?? 1), 0);
  const timePct = totalTime === 0 ? 0 : Math.round((doneTime / totalTime) * 100);
  return { taskPct, timePct };
}

function calcGoalProgress(goal: Goal) {
  const allTasks = goal.milestones.flatMap(m => m.tasks);
  return calcTaskProgress(allTasks);
}

function calcElapsedPace(goal: Goal): number {
  const now = new Date();
  const start = parseISO(`${goal.startDate}-01`);
  const end = parseISO(`${goal.deadline}-01`);
  const totalMs = end.getTime() - start.getTime();
  if (totalMs <= 0) return 100;
  const elapsedMs = now.getTime() - start.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));
}

interface MilestoneRowProps {
  goal: Goal;
  milestone: Milestone;
  showCompleted: boolean;
}

function MilestoneRow({ goal, milestone, showCompleted }: MilestoneRowProps) {
  const { deleteTask, toggleTask, deleteMilestone } = useApp();
  const [open, setOpen] = useState(true);
  const [taskModal, setTaskModal] = useState<{ mode: 'add' | 'edit'; task?: Task } | null>(null);
  const [msModal, setMsModal] = useState(false);

  const badge = getMilestoneBadge(milestone.period);
  const tasks = showCompleted ? milestone.tasks : milestone.tasks.filter(t => !t.done);
  const { taskPct } = calcTaskProgress(milestone.tasks);
  const doneCount = milestone.tasks.filter(t => t.done).length;

  return (
    <div className="border border-gray-700 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-medium truncate">{milestone.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
            <span className="text-gray-500 text-sm">{milestone.period}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-gray-400 text-sm">{doneCount}/{milestone.tasks.length}</span>
          <span className="text-gray-300 text-sm font-medium">{taskPct}%</span>
          <button onClick={e => { e.stopPropagation(); setMsModal(true); }}
            className="text-gray-500 hover:text-gray-300 p-1"><Pencil size={14} /></button>
          <button onClick={e => { e.stopPropagation(); deleteMilestone(goal.id, milestone.id); }}
            className="text-gray-500 hover:text-red-400 p-1"><Trash2 size={14} /></button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-3 pt-1 space-y-1.5">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 py-1.5 group">
              <button onClick={() => toggleTask(goal.id, milestone.id, task.id)} className="shrink-0">
                {task.done
                  ? <CheckCircle2 size={18} style={{ color: goal.color }} />
                  : <Circle size={18} className="text-gray-600" />}
              </button>
              <span className={`flex-1 text-sm ${task.done ? 'line-through text-gray-600' : 'text-gray-200'}`}>
                {task.title}
                {task.note && <span className="text-gray-500 ml-2 text-xs">{task.note}</span>}
              </span>
              {task.estimatedMinutes != null && (
                <span className="text-gray-600 text-xs flex items-center gap-1">
                  <Clock size={12} />{task.estimatedMinutes}分
                </span>
              )}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setTaskModal({ mode: 'edit', task })}
                  className="text-gray-500 hover:text-gray-300 p-1"><Pencil size={12} /></button>
                <button onClick={() => deleteTask(goal.id, milestone.id, task.id)}
                  className="text-gray-500 hover:text-red-400 p-1"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          <button
            onClick={() => setTaskModal({ mode: 'add' })}
            className="flex items-center gap-2 text-gray-500 hover:text-indigo-400 text-sm py-1 transition-colors">
            <Plus size={14} /> タスクを追加
          </button>
        </div>
      )}

      {taskModal && (
        <TaskModal
          goalId={goal.id}
          milestoneId={milestone.id}
          task={taskModal.task}
          onClose={() => setTaskModal(null)}
        />
      )}
      {msModal && (
        <MilestoneModal goalId={goal.id} milestone={milestone} onClose={() => setMsModal(false)} />
      )}
    </div>
  );
}

interface Props {
  goal: Goal;
}

export default function GoalDetail({ goal }: Props) {
  const { deleteGoal } = useApp();
  const [showCompleted, setShowCompleted] = useState(true);
  const [msModal, setMsModal] = useState(false);
  const [editGoalModal, setEditGoalModal] = useState(false);

  const { taskPct, timePct } = calcGoalProgress(goal);
  const elapsedPace = calcElapsedPace(goal);
  const diff = taskPct - elapsedPace;

  const now = format(new Date(), 'yyyy-MM');
  const deadline = goal.deadline;
  const remaining = differenceInCalendarMonths(parseISO(`${deadline}-01`), new Date());

  return (
    <div className="flex flex-col h-full">
      {/* Goal Header */}
      <div className="p-6 border-b border-gray-800 bg-gray-900">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">{goal.emoji}</span>
              <h1 className="text-white text-xl font-bold">{goal.name}</h1>
            </div>
            <div className="text-gray-500 text-sm">
              開始: {goal.startDate} &nbsp;|&nbsp; 期限: {goal.deadline} &nbsp;|&nbsp; 残り: {remaining > 0 ? `${remaining}ヶ月` : '期限切れ'}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditGoalModal(true)} className="text-gray-500 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              <Pencil size={16} />
            </button>
            <button
              onClick={() => { if (confirm('この目標を削除しますか？')) deleteGoal(goal.id); }}
              className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-xs w-20 shrink-0">タスク進捗</span>
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${taskPct}%`, backgroundColor: goal.color }} />
            </div>
            <span className="text-gray-300 text-sm font-medium w-10 text-right">{taskPct}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-xs w-20 shrink-0">時間進捗</span>
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500 opacity-70" style={{ width: `${timePct}%`, backgroundColor: goal.color }} />
            </div>
            <span className="text-gray-300 text-sm font-medium w-10 text-right">{timePct}%</span>
          </div>
        </div>

        {/* Pace comparison */}
        <div className="bg-gray-800/60 rounded-xl p-3 text-sm space-y-1">
          <div className="flex items-center gap-2 text-gray-400">
            <span>📅</span>
            <span>経過時間ペース: <span className="text-white font-medium">{elapsedPace}%</span></span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span>✅</span>
            <span>実績達成率: <span className="text-white font-medium">{taskPct}%</span></span>
          </div>
          <div className={`flex items-center gap-2 font-medium ${diff >= 0 ? 'text-green-400' : 'text-amber-400'}`}>
            <span>{diff >= 0 ? '✅' : '⚠️'}</span>
            <span>{diff >= 0 ? `+${diff}% ペース通りです` : `${diff}% ペースより遅れています`}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
        <div className="flex gap-2">
          <button
            onClick={() => setShowCompleted(false)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!showCompleted ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            未完了のみ
          </button>
          <button
            onClick={() => setShowCompleted(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showCompleted ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            すべて表示
          </button>
        </div>
      </div>

      {/* Milestones */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {goal.milestones.length === 0 && (
          <div className="text-center text-gray-600 py-12">
            <p className="text-4xl mb-3">🏁</p>
            <p>マイルストーンがありません</p>
            <p className="text-sm mt-1">まず最初のマイルストーンを追加しましょう</p>
          </div>
        )}
        {goal.milestones.map(ms => (
          <MilestoneRow key={ms.id} goal={goal} milestone={ms} showCompleted={showCompleted} />
        ))}
        <button
          onClick={() => setMsModal(true)}
          className="w-full py-3 border border-dashed border-gray-700 rounded-xl text-gray-500 hover:text-indigo-400 hover:border-indigo-500 text-sm flex items-center justify-center gap-2 transition-colors">
          <Plus size={16} /> マイルストーンを追加
        </button>
      </div>

      {msModal && <MilestoneModal goalId={goal.id} onClose={() => setMsModal(false)} />}
      {editGoalModal && <GoalModal goal={goal} onClose={() => setEditGoalModal(false)} />}
    </div>
  );
}
