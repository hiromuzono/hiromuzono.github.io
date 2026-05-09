'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from './context';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import GoalDetail from './components/GoalDetail';
import Habits from './components/Habits';
import GoalModal from './components/GoalModal';
import { Goal } from './types';

function AppContent() {
  const { data, deleteGoal } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [goalModal, setGoalModal] = useState<{ open: boolean; goal?: Goal }>({ open: false });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const activeGoal = data.goals.find(g => g.id === activeTab) ?? null;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAddGoal={() => setGoalModal({ open: true })}
      />
      <main className="flex-1 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 49px)' }}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'habits' && <Habits />}
        {activeGoal && <GoalDetail key={activeGoal.id} goal={activeGoal} />}
        {!activeGoal && activeTab !== 'dashboard' && activeTab !== 'habits' && (
          <div className="flex items-center justify-center h-full text-gray-600">
            目標が見つかりません
          </div>
        )}
      </main>

      {goalModal.open && (
        <GoalModal
          goal={goalModal.goal}
          onClose={() => setGoalModal({ open: false })}
        />
      )}
    </div>
  );
}

export default function DreamTrackerPage() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
