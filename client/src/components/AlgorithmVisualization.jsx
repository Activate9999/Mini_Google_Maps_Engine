import { useState, useEffect } from "react";

export default function AlgorithmVisualization({ steps, locations }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying || !steps.length) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  if (!steps || steps.length === 0) return null;

  const step = steps[currentStep];
  if (!step) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handlePrevious = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const handlePlayPause = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  return (
    <section className="algo-viz panel">
      <div className="algo-viz__header">
        <h2 className="algo-viz__title">Dijkstra&apos;s Algorithm Visualization</h2>
        <div className="algo-viz__progress">
          <span className="algo-viz__step-count">
            Step {currentStep + 1} of {steps.length}
          </span>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="algo-viz__content">
        <div className="step-info">
          <div className="step-info__action">{step.action || 'Processing...'}</div>
          
          <div className="step-details">
            <div className="step-detail">
              <span className="step-detail__label">Current Node:</span>
              <span className="step-detail__value node-badge">
                {locations && locations[step.currentNode] 
                  ? locations[step.currentNode].name 
                  : `Node ${step.currentNode ?? 'N/A'}`}
              </span>
            </div>
            
            <div className="step-detail">
              <span className="step-detail__label">Distance:</span>
              <span className="step-detail__value">
                {step.currentDistance != null ? Number(step.currentDistance).toFixed(2) : '0.00'} km
              </span>
            </div>

            <div className="step-detail">
              <span className="step-detail__label">Nodes Visited:</span>
              <span className="step-detail__value">{step.visited?.length || 0}</span>
            </div>

            <div className="step-detail">
              <span className="step-detail__label">Heap Size:</span>
              <span className="step-detail__value">{step.heapSize || 0}</span>
            </div>
          </div>

          {step.relaxations && step.relaxations.length > 0 && (
            <div className="relaxations">
              <div className="relaxations__title">Edge Relaxations:</div>
              <div className="relaxations__list">
                {step.relaxations.map((rel, idx) => (
                  <div key={idx} className="relaxation-item">
                    <span className="relaxation-item__node">
                      {locations && locations[rel.neighbor]
                        ? locations[rel.neighbor].name
                        : `Node ${rel.neighbor}`}
                    </span>
                    <span className="relaxation-item__arrow">→</span>
                    <span className="relaxation-item__distance">
                      {rel.oldDistance === 'Infinity' || rel.oldDistance === Infinity
                        ? '∞' 
                        : (rel.oldDistance != null ? Number(rel.oldDistance).toFixed(2) : '0.00')}
                    </span>
                    <span className="relaxation-item__arrow">➜</span>
                    <span className="relaxation-item__new">
                      {rel.newDistance != null ? Number(rel.newDistance).toFixed(2) : '0.00'} km
                    </span>
                    {rel.improvement !== 'New' && rel.improvement != null && (
                      <span className="relaxation-item__improvement">
                        (-{rel.improvement} km)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="algo-viz__controls">
          <button onClick={handleReset} disabled={currentStep === 0} className="ghost">
            ⟲ Reset
          </button>
          <button onClick={handlePrevious} disabled={currentStep === 0} className="ghost">
            ← Previous
          </button>
          <button onClick={handlePlayPause} className="play-button">
            {isPlaying ? '⏸ Pause' : currentStep >= steps.length - 1 ? '↻ Replay' : '▶ Play'}
          </button>
          <button onClick={handleNext} disabled={currentStep >= steps.length - 1} className="ghost">
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}
