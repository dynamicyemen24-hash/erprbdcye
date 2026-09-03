// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ - Project Management Office (PMO) Module
// Critical Path Method Engine - NEB-04 Project Management OS
// ═══════════════════════════════════════════════════════════════════════════════
//
// © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
// One Platform. One Organization. One Vision.
//
// Critical Path Method (CPM) Implementation per PMBOK® Guide 7th Edition
// Supports network diagram analysis, forward/backward pass, float calculation
// ═══════════════════════════════════════════════════════════════════════════════

import type {
  NetworkDiagram,
  NetworkNode,
  NetworkEdge,
  ScheduleActivity,
  GanttNode,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Result Types (Engine-Specific)
// ─────────────────────────────────────────────────────────────────────────────

export interface CriticalPathResult {
  network: NetworkDiagram;
  criticalActivities: string[];
  criticalPathDurationDays: number;
  floatAnalysis: {
    totalFloat: number;
    activitiesOnCriticalPath: number;
    averageFloat: number;
    zeroFloatCount: number;
  };
  compressionSuggestions: Array<{
    type: 'CRASHING' | 'FAST_TRACKING';
    potentialSavingsDays: number;
    costImpact: 'LOW' | 'MEDIUM' | 'HIGH';
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
  }>;
}

export interface ScheduleAnalysis {
  totalDurationDays: number;
  criticalPath: string[];
  nearCriticalPaths: string[][];
  schedulePerformanceIndex: number;
  scheduleVarianceDays: number;
  floatDistribution: {
    critical: number;
    nearCritical: number;
    moderate: number;
    ample: number;
  };
  status: 'AHEAD' | 'ON_TRACK' | 'SLIGHTLY_BEHIND' | 'BEHIND' | 'SIGNIFICANTLY_BEHIND';
  recommendations: string[];
}

export interface ResourceLevelingResult {
  leveledActivities: ScheduleActivity[];
  conflicts: Array<{
    activityId: string;
    resourceId: string;
    overallocationPct: number;
    suggestedResolution: string;
  }>;
  utilizationMetrics: {
    averageUtilization: number;
    peakUtilization: number;
    overallocatedCount: number;
    underutilizedCount: number;
  };
  efficiency: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Critical Path Method Engine
// ─────────────────────────────────────────────────────────────────────────────

export class CriticalPathEngine {
  /**
   * Calculate the critical path using forward and backward pass algorithms
   */
  calculateCriticalPath(activities: ScheduleActivity[]): CriticalPathResult {
    if (activities.length === 0) {
      return {
        network: {
          projectId: '',
          nodes: [],
          edges: [],
          criticalPath: [],
          totalFloatDays: 0,
          projectDurationDays: 0,
        },
        criticalActivities: [],
        criticalPathDurationDays: 0,
        floatAnalysis: { totalFloat: 0, activitiesOnCriticalPath: 0, averageFloat: 0, zeroFloatCount: 0 },
        compressionSuggestions: [],
      };
    }

    const projectId = activities[0]?.wbsId ?? '';
    
    // Build network
    const network = this.buildNetwork(activities, projectId);

    // Forward pass
    const projectDuration = this.forwardPass(network);

    // Backward pass
    this.backwardPass(network, projectDuration);

    // Identify critical path
    const criticalPath = network.nodes.filter(n => n.totalFloat === 0);
    const totalFloatSum = network.nodes.reduce((sum, n) => sum + n.totalFloat, 0);
    const averageFloat = network.nodes.length > 0 ? totalFloatSum / network.nodes.length : 0;

    // Compression suggestions
    const compressionSuggestions = this.suggestCompression(network, projectDuration);

    return {
      network,
      criticalActivities: criticalPath.map(n => n.activityId),
      criticalPathDurationDays: projectDuration,
      floatAnalysis: {
        totalFloat: totalFloatSum,
        activitiesOnCriticalPath: criticalPath.length,
        averageFloat: Math.round(averageFloat * 100) / 100,
        zeroFloatCount: criticalPath.length,
      },
      compressionSuggestions,
    };
  }

  /**
   * Build network diagram from activities
   */
  private buildNetwork(activities: ScheduleActivity[], projectId: string): NetworkDiagram {
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];

    // Create nodes
    for (const activity of activities) {
      nodes.push({
        id: `node-${activity.id}`,
        activityId: activity.id,
        name: activity.name,
        duration: activity.durationDays,
        earliestStart: 0,
        earliestFinish: 0,
        latestStart: 0,
        latestFinish: 0,
        totalFloat: 0,
        freeFloat: 0,
        isCritical: false,
      });
    }

    // Create edges from dependencies
    for (const activity of activities) {
      for (const depId of activity.dependencies) {
        edges.push({
          from: `node-${depId}`,
          to: `node-${activity.id}`,
          type: 'FS', // Default to Finish-to-Start
          lag: 0,
        });
      }
    }

    return {
      projectId,
      nodes,
      edges,
      criticalPath: [],
      totalFloatDays: 0,
      projectDurationDays: 0,
    };
  }

  /**
   * Forward pass - calculate ES and EF
   */
  private forwardPass(network: NetworkDiagram): number {
    const nodeMap = new Map(network.nodes.map(n => [n.id, n]));
    const edgeMap = new Map<string, NetworkEdge[]>();
    
    // Group edges by source node
    for (const edge of network.edges) {
      const existing = edgeMap.get(edge.from) ?? [];
      existing.push(edge);
      edgeMap.set(edge.from, existing);
    }

    // Calculate predecessors map
    const predecessors = new Map<string, string[]>();
    for (const node of network.nodes) {
      predecessors.set(node.id, []);
    }
    for (const edge of network.edges) {
      const existing = predecessors.get(edge.to) ?? [];
      existing.push(edge.from);
      predecessors.set(edge.to, existing);
    }

    // Topological sort
    const sorted = this.topologicalSort(network);
    let projectDuration = 0;

    for (const nodeId of sorted) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      let maxPredecessorEF = 0;
      const preds = predecessors.get(nodeId) ?? [];
      
      for (const predId of preds) {
        const pred = nodeMap.get(predId);
        if (pred && pred.earliestFinish > maxPredecessorEF) {
          maxPredecessorEF = pred.earliestFinish;
        }
      }

      node.earliestStart = maxPredecessorEF;
      node.earliestFinish = maxPredecessorEF + node.duration;

      if (node.earliestFinish > projectDuration) {
        projectDuration = node.earliestFinish;
      }
    }

    network.projectDurationDays = projectDuration;
    return projectDuration;
  }

  /**
   * Backward pass - calculate LS and LF
   */
  private backwardPass(network: NetworkDiagram, projectDuration: number): void {
    const nodeMap = new Map(network.nodes.map(n => [n.id, n]));
    
    // Build successors map
    const successors = new Map<string, string[]>();
    for (const node of network.nodes) {
      successors.set(node.id, []);
    }
    for (const edge of network.edges) {
      const existing = successors.get(edge.from) ?? [];
      existing.push(edge.to);
      successors.set(edge.from, existing);
    }

    // Process in reverse topological order
    const sorted = this.topologicalSort(network).reverse();

    for (const nodeId of sorted) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const succs = successors.get(nodeId) ?? [];
      
      if (succs.length === 0) {
        // End node
        node.latestFinish = projectDuration;
      } else {
        let minSuccessorLS = Infinity;
        for (const succId of succs) {
          const succ = nodeMap.get(succId);
          if (succ && succ.latestStart < minSuccessorLS) {
            minSuccessorLS = succ.latestStart;
          }
        }
        node.latestFinish = minSuccessorLS === Infinity ? projectDuration : minSuccessorLS;
      }

      node.latestStart = node.latestFinish - node.duration;
      node.totalFloat = node.latestStart - node.earliestStart;
      node.freeFloat = Math.max(0, node.totalFloat);

      if (node.totalFloat === 0) {
        node.isCritical = true;
      }
    }

    network.totalFloatDays = nodeMap.size > 0 
      ? Array.from(nodeMap.values()).reduce((sum, n) => sum + n.totalFloat, 0)
      : 0;
    
    network.criticalPath = Array.from(nodeMap.values())
      .filter(n => n.isCritical)
      .map(n => n.activityId);
  }

  /**
   * Topological sort using DFS
   */
  private topologicalSort(network: NetworkDiagram): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    const temp = new Set<string>();

    const visit = (nodeId: string) => {
      if (temp.has(nodeId)) return; // Cycle
      if (visited.has(nodeId)) return;
      
      temp.add(nodeId);
      
      // Visit successors
      for (const edge of network.edges) {
        if (edge.from === nodeId) {
          visit(edge.to);
        }
      }
      
      temp.delete(nodeId);
      visited.add(nodeId);
      result.unshift(nodeId);
    };

    for (const node of network.nodes) {
      visit(node.id);
    }

    return result;
  }

  /**
   * Suggest compression techniques
   */
  private suggestCompression(
    network: NetworkDiagram,
    projectDuration: number
  ): CriticalPathResult['compressionSuggestions'] {
    const suggestions: CriticalPathResult['compressionSuggestions'] = [];
    
    const criticalNodes = network.nodes.filter(n => n.isCritical);
    
    if (criticalNodes.length === 0) return suggestions;

    // Fast tracking suggestion
    suggestions.push({
      type: 'FAST_TRACKING',
      potentialSavingsDays: Math.round(projectDuration * 0.15),
      costImpact: 'MEDIUM',
      riskLevel: 'MEDIUM',
      description: 'Execute critical activities in parallel by adjusting dependencies',
    });

    // Crashing suggestion for long projects
    if (projectDuration > 60) {
      suggestions.push({
        type: 'CRASHING',
        potentialSavingsDays: Math.round(projectDuration * 0.1),
        costImpact: 'HIGH',
        riskLevel: 'HIGH',
        description: 'Add resources to critical activities to reduce duration',
      });
    }

    // Scope reduction
    if (criticalNodes.length > 5) {
      suggestions.push({
        type: 'FAST_TRACKING',
        potentialSavingsDays: Math.round(projectDuration * 0.08),
        costImpact: 'LOW',
        riskLevel: 'LOW',
        description: 'Reduce scope of low-priority deliverables',
      });
    }

    return suggestions;
  }

  /**
   * Perform comprehensive schedule analysis
   */
  analyzeSchedule(
    activities: ScheduleActivity[],
    targetDuration?: number
  ): ScheduleAnalysis {
    const cpmResult = this.calculateCriticalPath(activities);
    const actualDuration = cpmResult.criticalPathDurationDays;

    let spi = 1;
    let scheduleVariance = 0;
    let status: ScheduleAnalysis['status'];

    if (targetDuration && targetDuration > 0) {
      spi = actualDuration / targetDuration;
      scheduleVariance = targetDuration - actualDuration;

      if (spi < 0.7) status = 'SIGNIFICANTLY_BEHIND';
      else if (spi < 0.85) status = 'BEHIND';
      else if (spi < 0.95) status = 'SLIGHTLY_BEHIND';
      else if (spi <= 1.05) status = 'ON_TRACK';
      else status = 'AHEAD';
    } else {
      status = 'ON_TRACK';
    }

    // Float distribution
    const floatDistribution = this.analyzeFloatDistribution(cpmResult.network);
    
    // Near-critical paths
    const nearCriticalPaths = this.findNearCriticalPaths(cpmResult.network);
    
    // Recommendations
    const recommendations: string[] = [];
    if (status === 'SIGNIFICANTLY_BEHIND' || status === 'BEHIND') {
      recommendations.push('Consider scope reduction or fast-tracking critical activities');
      recommendations.push('Add resources to critical path activities');
    }
    if (floatDistribution.nearCritical > floatDistribution.critical) {
      recommendations.push('Monitor near-critical activities closely');
    }

    return {
      totalDurationDays: actualDuration,
      criticalPath: cpmResult.criticalActivities,
      nearCriticalPaths,
      schedulePerformanceIndex: Math.round(spi * 1000) / 1000,
      scheduleVarianceDays: scheduleVariance,
      floatDistribution,
      status,
      recommendations,
    };
  }

  /**
   * Analyze float distribution
   */
  private analyzeFloatDistribution(network: NetworkDiagram): ScheduleAnalysis['floatDistribution'] {
    const distribution = { critical: 0, nearCritical: 0, moderate: 0, ample: 0 };

    for (const node of network.nodes) {
      const float = node.totalFloat;
      if (float === 0) distribution.critical++;
      else if (float <= 5) distribution.nearCritical++;
      else if (float <= 15) distribution.moderate++;
      else distribution.ample++;
    }

    return distribution;
  }

  /**
   * Find near-critical paths
   */
  private findNearCriticalPaths(network: NetworkDiagram): string[][] {
    const nearCriticalThreshold = 5;
    const nearCritical = network.nodes
      .filter(n => n.totalFloat > 0 && n.totalFloat <= nearCriticalThreshold)
      .map(n => n.activityId);
    
    return nearCritical.length > 0 ? [nearCritical] : [];
  }

  /**
   * Perform resource leveling
   */
  performResourceLeveling(activities: ScheduleActivity[]): ResourceLevelingResult {
    const leveledActivities = [...activities];
    const conflicts: ResourceLevelingResult['conflicts'] = [];

    // Build resource usage map (using duration as proxy for work effort)
    const resourceUsage = new Map<string, number>();
    let totalAllocations = 0;
    let overallocatedCount = 0;
    let underutilizedCount = 0;
    let peakUtilization = 0;

    for (const activity of leveledActivities) {
      // Estimate hours from duration (8 hours per day)
      const estimatedHours = activity.durationDays * 8;
      for (const resourceId of activity.assignedResources) {
        const usage = resourceUsage.get(resourceId) ?? 0;
        resourceUsage.set(resourceId, usage + estimatedHours);
        totalAllocations++;

        if (usage > 100) overallocatedCount++;
        if (usage < 50) underutilizedCount++;
        peakUtilization = Math.max(peakUtilization, usage);
      }
    }

    const averageUtilization = resourceUsage.size > 0
      ? Array.from(resourceUsage.values()).reduce((sum, v) => sum + v, 0) / resourceUsage.size
      : 0;

    // Detect conflicts
    for (const [resourceId, usage] of resourceUsage.entries()) {
      if (usage > 100) {
        const activityId = leveledActivities.find(a => a.assignedResources.includes(resourceId))?.id ?? '';
        conflicts.push({
          activityId,
          resourceId,
          overallocationPct: usage - 100,
          suggestedResolution: 'Reduce allocation or schedule sequentially',
        });
      }
    }

    const efficiency = conflicts.length === 0
      ? 1
      : 1 - (conflicts.length / Math.max(1, totalAllocations));

    return {
      leveledActivities,
      conflicts,
      utilizationMetrics: {
        averageUtilization: Math.round(averageUtilization * 100) / 100,
        peakUtilization: Math.round(peakUtilization * 100) / 100,
        overallocatedCount,
        underutilizedCount,
      },
      efficiency: Math.round(efficiency * 1000) / 1000,
    };
  }

  /**
   * Generate Gantt chart data
   */
  generateGanttData(activities: ScheduleActivity[]): GanttNode[] {
    const cpmResult = this.calculateCriticalPath(activities);
    const criticalIds = new Set(cpmResult.criticalActivities);

    return activities.map((activity, index) => {
      const start = activity.earliestStart ?? new Date();
      const end = activity.earliestFinish ?? new Date(Date.now() + activity.durationDays * 86400000);
      const isCritical = criticalIds.has(activity.id);

      return {
        id: activity.id,
        name: activity.name,
        start: typeof start === 'string' ? new Date(start) : start,
        end: typeof end === 'string' ? new Date(end) : end,
        progress: activity.percentComplete,
        dependencies: activity.dependencies,
        isMilestone: activity.durationDays === 0,
        isCritical,
        level: 0,
        color: isCritical ? '#ef4444' : activity.percentComplete === 100 ? '#22c55e' : '#3b82f6',
      };
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Functions
// ─────────────────────────────────────────────────────────────────────────────

export function createCriticalPathEngine(): CriticalPathEngine {
  return new CriticalPathEngine();
}

export function calculateCriticalPath(activities: ScheduleActivity[]): CriticalPathResult {
  const engine = new CriticalPathEngine();
  return engine.calculateCriticalPath(activities);
}

export function generateGanttData(activities: ScheduleActivity[]): GanttNode[] {
  const engine = new CriticalPathEngine();
  return engine.generateGanttData(activities);
}
