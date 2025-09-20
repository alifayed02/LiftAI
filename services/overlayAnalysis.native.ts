// overlayAnalysis.native.ts
import { NativeModules } from 'react-native';
const { OverlayAnalysis } = NativeModules as {
  OverlayAnalysis: {
    render(input: string, items: { timestamp: string; suggestion: string; endTimestamp?: string; align?: 1|2|3 }[]): Promise<string>;
  }
};

export async function overlayAnalysisAVF(input: string, analysis: { analysis: any[] }) {
  // IMPORTANT: pass analysis.analysis (the array), not the whole object
  return OverlayAnalysis.render(input, analysis.analysis);
}