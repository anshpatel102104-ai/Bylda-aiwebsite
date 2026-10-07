import type { ScreenId } from '../../data/product-pages'
import { seg } from '../../lib/motion'
import { AnalysisPanel, CallBehaviors } from '../../ui/AnalysisPanel'
import { BehaviorTable } from '../../ui/BehaviorTable'
import { CallTimeline } from '../../ui/CallTimeline'
import { FocusCard } from '../../ui/FocusCard'
import { ManagerView } from '../../ui/ManagerView'
import { AssignCard, BuyerCard, ExperimentCard, TrendsHeatmap, WeeklyReport } from '../../ui/Mocks'
import { PatternCard } from '../../ui/PatternCard'
import { RepBrief } from '../../ui/RepBrief'
import { ResultChart } from '../../ui/ResultChart'
import { OutcomeGraph } from '../site/OutcomeGraph'

/** Every product screen is laid out on this fixed canvas and scaled to its frame. */
export const SCREEN_W = 1000
export const SCREEN_H = 560

const abs = (left: number, top: number, width: number) => ({ position: 'absolute' as const, left, top, width })

/** One product screen, drawn from its intro progress p (0..1). p = 1 is the finished screen. */
export function ProductScreen({ id, p = 1 }: { id: ScreenId; p?: number }) {
  const s = (a: number, b: number) => seg(p, a, b)
  switch (id) {
    case 'timeline':
      return <CallTimeline lanes={s(0, 0.35)} events={s(0.2, 0.5)} metrics={s(0.3, 0.55)} marker={s(0.5, 0.75)} className="f-float" style={abs(40, 70, 920)} />
    case 'analysis':
      return (
        <>
          <AnalysisPanel type={s(0, 0.7)} className="f-float" style={abs(30, 40, 540)} />
          <CallBehaviors rows={s(0.45, 0.7)} highlight={s(0.78, 0.9)} className="f-float" style={abs(590, 40, 380)} />
        </>
      )
    case 'profile':
      return <BehaviorTable cascade={s(0, 0.2)} count={s(0.1, 0.4)} draw={s(0.3, 0.7)} tags={s(0.5, 0.8)} className="f-float" style={abs(100, 28, 800)} />
    case 'focus':
      return (
        <>
          <div className="f-card f-float" style={{ ...abs(40, 24, 920), height: 512, padding: '28px 36px' }}>
            <RepBrief />
          </div>
          <FocusCard type={s(0, 0.35)} cols={s(0.3, 0.6)} draw={s(0.55, 0.8)} caret style={abs(76, 228, 848)} />
        </>
      )
    case 'results':
      return <ResultChart head={s(0, 0.1)} before={s(0.05, 0.3)} focus={s(0.3, 0.4)} after={s(0.35, 0.6)} medians={s(0.55, 0.75)} rows={s(0.6, 0.85)} note={s(0.85, 0.95)} style={abs(30, 30, 940)} />
    case 'coaching':
      return (
        <>
          <AssignCard p={s(0, 0.5)} className="f-float" style={abs(30, 36, 400)} />
          <FocusCard type={s(0.5, 0.75)} cols={s(0.7, 0.9)} draw={s(0.8, 1)} caret compact style={abs(456, 96, 514)} />
        </>
      )
    case 'queue':
      return (
        <>
          <ManagerView insight={s(0, 0.4)} rows={s(0.3, 0.6)} className="f-float" style={abs(30, 34, 520)} />
          <PatternCard head={s(0.55, 0.7)} fill={s(0.62, 0.9)} note={s(0.85, 1)} compact className="f-float" style={abs(572, 96, 398)} />
        </>
      )
    case 'report':
      return <WeeklyReport p={p} className="f-float" style={abs(40, 40, 920)} />
    case 'trends':
      return <TrendsHeatmap p={p} className="f-float" style={abs(70, 22, 860)} />
    case 'graph':
      return <OutcomeGraph p={p} className="pp-graph" />
    case 'buyers':
      return <BuyerCard p={p} style={abs(190, 40, 620)} />
    case 'experiment':
      return <ExperimentCard p={p} className="f-float" style={abs(70, 34, 860)} />
  }
}
