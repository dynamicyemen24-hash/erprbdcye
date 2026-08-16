import React from 'react';
import { DashboardPreset, SYSTEM_PRESETS } from './SmartCustomizationPanel';
import { KPILayoutItem } from './types';

export function useDashboardState(currentUser: any) {
  const [activeSubTab, setActiveSubTab] = React.useState<'overview' | 'performance' | 'readiness'>('overview');
  const [isCustomizerOpen, setIsCustomizerOpen] = React.useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = React.useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = React.useState(false);

  // --- EXECUTIVE SUMMARY STATES ---
  const [isSummaryLoading, setIsSummaryLoading] = React.useState(false);
  const [summaryOutput, setSummaryOutput] = React.useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = React.useState(false);
  const [summaryError, setSummaryError] = React.useState<string | null>(null);

  // Load custom presets per-user
  const [customPresets, setCustomPresets] = React.useState<DashboardPreset[]>(() => {
    try {
      const userSuffix = currentUser?.id ? `_${currentUser.id}` : '_guest';
      const saved = localStorage.getItem(`nexora_dashboard_presets${userSuffix}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Load active preset per-user
  const [currentPreset, setCurrentPreset] = React.useState<DashboardPreset>(() => {
    try {
      const userSuffix = currentUser?.id ? `_${currentUser.id}` : '_guest';
      const savedActiveId = localStorage.getItem(`nexora_active_preset_id${userSuffix}`);
      const savedPresets = localStorage.getItem(`nexora_dashboard_presets${userSuffix}`);
      let parsedCustom: DashboardPreset[] = [];
      if (savedPresets) {
        try { parsedCustom = JSON.parse(savedPresets); } catch (e) {}
      }
      if (savedActiveId) {
        const found = SYSTEM_PRESETS.find(p => p.id === savedActiveId) || parsedCustom.find(p => p.id === savedActiveId);
        if (found) return found;
      }
    } catch (e) {}
    return SYSTEM_PRESETS[0];
  });

  const handleApplyPreset = (preset: DashboardPreset) => {
    setCurrentPreset(preset);
    try {
      const userSuffix = currentUser?.id ? `_${currentUser.id}` : '_guest';
      localStorage.setItem(`nexora_active_preset_id${userSuffix}`, preset.id);
    } catch (e) {}
  };

  const handleSaveCustomPreset = (preset: DashboardPreset) => {
    const updated = [...customPresets, preset];
    setCustomPresets(updated);
    setCurrentPreset(preset);
    try {
      const userSuffix = currentUser?.id ? `_${currentUser.id}` : '_guest';
      localStorage.setItem(`nexora_dashboard_presets${userSuffix}`, JSON.stringify(updated));
      localStorage.setItem(`nexora_active_preset_id${userSuffix}`, preset.id);
    } catch (e) {}
  };

  const handleDeletePreset = (id: string) => {
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    try {
      const userSuffix = currentUser?.id ? `_${currentUser.id}` : '_guest';
      localStorage.setItem(`nexora_dashboard_presets${userSuffix}`, JSON.stringify(updated));
      if (currentPreset.id === id) {
        setCurrentPreset(SYSTEM_PRESETS[0]);
        localStorage.setItem(`nexora_active_preset_id${userSuffix}`, SYSTEM_PRESETS[0].id);
      }
    } catch (e) {}
  };

  const getSpacingClass = () => {
    switch (currentPreset.spacing) {
      case 'compact': return 'gap-4';
      case 'spacious': return 'gap-10';
      case 'comfortable':
      default: return 'gap-8';
    }
  };

  // --- KPI CARD REORDERING & PINNING STATE ENGINE ---
  const [kpiLayout, setKpiLayout] = React.useState<KPILayoutItem[]>(() => {
    const saved = localStorage.getItem('rbd_kpi_layout_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      { id: 'programs', pinned: false },
      { id: 'approvals', pinned: false },
      { id: 'beneficiaries', pinned: false },
      { id: 'budget', pinned: false }
    ];
  });

  const [draggedCardId, setDraggedCardId] = React.useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = React.useState<string | null>(null);

  const saveLayout = (newLayout: KPILayoutItem[]) => {
    setKpiLayout(newLayout);
    localStorage.setItem('rbd_kpi_layout_v2', JSON.stringify(newLayout));
  };

  const handleMoveLeft = (index: number) => {
    if (index <= 0) return;
    const newLayout = [...kpiLayout];
    const temp = newLayout[index];
    newLayout[index] = newLayout[index - 1];
    newLayout[index - 1] = temp;
    saveLayout(newLayout);
  };

  const handleMoveRight = (index: number) => {
    if (index >= kpiLayout.length - 1) return;
    const newLayout = [...kpiLayout];
    const temp = newLayout[index];
    newLayout[index] = newLayout[index + 1];
    newLayout[index + 1] = temp;
    saveLayout(newLayout);
  };

  const handleTogglePin = (id: string) => {
    const newLayout = kpiLayout.map(item => {
      if (item.id === id) {
        const nextPinned = !item.pinned;
        return { ...item, pinned: nextPinned };
      }
      return item;
    });

    const pinned = newLayout.filter(item => item.pinned);
    const unpinned = newLayout.filter(item => !item.pinned);
    saveLayout([...pinned, ...unpinned]);
  };

  const handleResetLayout = () => {
    const defaults = [
      { id: 'programs', pinned: false },
      { id: 'approvals', pinned: false },
      { id: 'beneficiaries', pinned: false },
      { id: 'budget', pinned: false }
    ];
    saveLayout(defaults);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCardId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedCardId && draggedCardId !== id) {
      setDragOverCardId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedCardId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) {
      setDraggedCardId(null);
      setDragOverCardId(null);
      return;
    }

    const sourceIndex = kpiLayout.findIndex(item => item.id === sourceId);
    const targetIndex = kpiLayout.findIndex(item => item.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const newLayout = [...kpiLayout];
    const [movedItem] = newLayout.splice(sourceIndex, 1);
    newLayout.splice(targetIndex, 0, movedItem);

    const pinned = newLayout.filter(item => item.pinned);
    const unpinned = newLayout.filter(item => !item.pinned);
    saveLayout([...pinned, ...unpinned]);

    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  return {
    activeSubTab, setActiveSubTab,
    isCustomizerOpen, setIsCustomizerOpen,
    isViewDropdownOpen, setIsViewDropdownOpen,
    isMoreDropdownOpen, setIsMoreDropdownOpen,
    isSummaryLoading, setIsSummaryLoading,
    summaryOutput, setSummaryOutput,
    isSummaryModalOpen, setIsSummaryModalOpen,
    summaryError, setSummaryError,
    customPresets, currentPreset,
    handleApplyPreset, handleSaveCustomPreset, handleDeletePreset,
    getSpacingClass,
    kpiLayout, draggedCardId, dragOverCardId, setDragOverCardId,
    handleMoveLeft, handleMoveRight, handleTogglePin, handleResetLayout,
    handleDragStart, handleDragOver, handleDragEnd, handleDrop
  };
}
