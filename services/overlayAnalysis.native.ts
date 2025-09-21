// overlayAnalysis.native.ts
import { NativeModules } from 'react-native';
const { OverlayAnalysis } = NativeModules as {
  OverlayAnalysis: {
    render(input: string, items: { timestamp: string; suggestion: string; endTimestamp?: string; align?: 1|2|3 }[], analysis: { analysis: any[] }): Promise<string>;
  }
};

export async function overlayAnalysisAVF(input: string, analysis: { analysis: any[] }) {
  // Pass the full analysis object to Swift, which will extract the 'analysis' array
  return OverlayAnalysis.render(input, [], analysis);
}