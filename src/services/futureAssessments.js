const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function evaluateMetacognitiveCalibration(answers = []) {
  if (!Array.isArray(answers) || answers.length === 0) {
    return {
      score: 0,
      calibrationGap: 100,
      label: 'INSUFFICIENT DATA',
      insights: ['No confidence judgments captured yet'],
    };
  }

  const gaps = answers.map((item) => {
    const confidence = clamp(Number(item.confidence) || 0, 0, 100);
    const accuracy = item.correct ? 100 : 0;
    return Math.abs(confidence - accuracy);
  });

  const calibrationGap = gaps.reduce((sum, value) => sum + value, 0) / gaps.length;
  const score = clamp(Math.round(100 - calibrationGap), 0, 100);

  return {
    score,
    calibrationGap: Math.round(calibrationGap * 10) / 10,
    label: score >= 75 ? 'HIGH CALIBRATION' : score >= 55 ? 'MODERATE CALIBRATION' : 'LOW CALIBRATION',
    insights: [
      score >= 75
        ? 'Confidence was aligned with actual outcomes across trials'
        : 'Confidence and performance diverged in several moments',
      calibrationGap > 30
        ? 'Recommend coaching on confidence regulation under uncertainty'
        : 'Confidence regulation appears stable for role-relevant decisions',
    ],
  };
}

export function evaluateOperationalPrioritization(tasks = []) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return {
      score: 0,
      priorityAccuracy: 0,
      deadlineAdherence: 0,
      label: 'INSUFFICIENT DATA',
    };
  }

  let correctPriorities = 0;
  let onTime = 0;

  tasks.forEach((task) => {
    if (task.expectedPriority === task.assignedPriority) {
      correctPriorities += 1;
    }
    if (Number(task.completedWithinMs) <= Number(task.deadlineMs)) {
      onTime += 1;
    }
  });

  const priorityAccuracy = (correctPriorities / tasks.length) * 100;
  const deadlineAdherence = (onTime / tasks.length) * 100;
  const score = Math.round((priorityAccuracy * 0.6) + (deadlineAdherence * 0.4));

  return {
    score,
    priorityAccuracy: Math.round(priorityAccuracy * 10) / 10,
    deadlineAdherence: Math.round(deadlineAdherence * 10) / 10,
    label: score >= 80 ? 'HIGH OPERATIONAL CLARITY' : score >= 60 ? 'SOLID OPERATIONAL JUDGMENT' : 'DEVELOPING PRIORITIZATION SKILLS',
  };
}

export function evaluateLearningAgility(rounds = []) {
  if (!Array.isArray(rounds) || rounds.length < 2) {
    return {
      score: 0,
      improvementRate: 0,
      adaptationLatency: 0,
      label: 'INSUFFICIENT DATA',
    };
  }

  const firstHalf = rounds.slice(0, Math.floor(rounds.length / 2));
  const secondHalf = rounds.slice(Math.floor(rounds.length / 2));

  const avg = (arr, key) => arr.reduce((sum, item) => sum + (Number(item[key]) || 0), 0) / arr.length;
  const firstAcc = avg(firstHalf, 'accuracy');
  const secondAcc = avg(secondHalf, 'accuracy');
  const improvementRate = secondAcc - firstAcc;

  const latencies = rounds
    .map((round) => Number(round.adaptationMs))
    .filter((value) => Number.isFinite(value) && value > 0);
  const adaptationLatency = latencies.length
    ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length
    : 0;

  const normalizedLatency = adaptationLatency > 0 ? Math.max(0, 100 - (adaptationLatency / 40)) : 0;
  const score = clamp(Math.round((improvementRate * 1.8) + (normalizedLatency * 0.7) + 20), 0, 100);

  return {
    score,
    improvementRate: Math.round(improvementRate * 10) / 10,
    adaptationLatency: Math.round(adaptationLatency),
    label: score >= 78 ? 'HIGH LEARNING AGILITY' : score >= 58 ? 'SOLID LEARNING AGILITY' : 'DEVELOPING LEARNING AGILITY',
  };
}
