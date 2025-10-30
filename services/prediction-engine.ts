import { supabase } from '@/lib/supabase';
import type { WastewaterReading, Prediction } from '@/types/database';

export class PredictionEngine {
  private static instance: PredictionEngine;

  private constructor() {}

  static getInstance(): PredictionEngine {
    if (!PredictionEngine.instance) {
      PredictionEngine.instance = new PredictionEngine();
    }
    return PredictionEngine.instance;
  }

  async generatePredictions(siteId: string, virusId: string): Promise<Prediction[]> {
    const historicalData = await this.fetchHistoricalData(siteId, virusId);

    if (historicalData.length < 7) {
      return [];
    }

    const trendPrediction = this.simpleTrendAnalysis(historicalData);
    const mlPrediction = this.timeSeriesForecast(historicalData);

    const predictions: any[] = [];
    const today = new Date();

    for (let daysAhead = 1; daysAhead <= 14; daysAhead++) {
      const predictionDate = new Date(today);
      predictionDate.setDate(predictionDate.getDate() + daysAhead);

      const trendLevel = trendPrediction.predictLevel(daysAhead);
      const mlLevel = mlPrediction.predictLevel(daysAhead);

      const predictedLevel = (trendLevel * 0.3 + mlLevel * 0.7);
      const predictedCategory = this.getLevelCategory(predictedLevel);
      const confidence = this.calculateConfidence(historicalData, daysAhead);

      predictions.push({
        site_id: siteId,
        virus_id: virusId,
        prediction_date: predictionDate.toISOString().split('T')[0],
        predicted_level: predictedLevel,
        predicted_category: predictedCategory,
        confidence_score: confidence,
        model_type: 'multifactor',
        factors_used: {
          trend_weight: 0.3,
          ml_weight: 0.7,
          historical_days: historicalData.length,
        },
      });
    }

    return predictions;
  }

  private async fetchHistoricalData(
    siteId: string,
    virusId: string
  ): Promise<WastewaterReading[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('wastewater_readings')
      .select('*')
      .eq('site_id', siteId)
      .eq('virus_id', virusId)
      .gte('sample_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('sample_date', { ascending: true });

    if (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }

    return data || [];
  }

  private simpleTrendAnalysis(data: WastewaterReading[]) {
    const recentData = data.slice(-7);
    const levels = recentData.map(r => r.concentration_level || 0);

    const avgLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;

    let trend = 0;
    if (levels.length >= 2) {
      const firstHalf = levels.slice(0, Math.floor(levels.length / 2));
      const secondHalf = levels.slice(Math.floor(levels.length / 2));

      const firstAvg = firstHalf.reduce((sum, l) => sum + l, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, l) => sum + l, 0) / secondHalf.length;

      trend = (secondAvg - firstAvg) / firstHalf.length;
    }

    return {
      predictLevel: (daysAhead: number) => {
        return Math.max(0, avgLevel + trend * daysAhead);
      },
    };
  }

  private timeSeriesForecast(data: WastewaterReading[]) {
    const levels = data.map(r => r.concentration_level || 0);

    const movingAverage = this.calculateMovingAverage(levels, 7);
    const lastMA = movingAverage[movingAverage.length - 1];

    const volatility = this.calculateVolatility(levels);

    return {
      predictLevel: (daysAhead: number) => {
        const decay = Math.exp(-daysAhead * 0.05);
        const randomWalk = (Math.random() - 0.5) * volatility * Math.sqrt(daysAhead);

        return Math.max(0, lastMA * decay + randomWalk);
      },
    };
  }

  private calculateMovingAverage(data: number[], window: number): number[] {
    const result: number[] = [];

    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - window + 1);
      const subset = data.slice(start, i + 1);
      const avg = subset.reduce((sum, val) => sum + val, 0) / subset.length;
      result.push(avg);
    }

    return result;
  }

  private calculateVolatility(data: number[]): number {
    if (data.length < 2) return 5;

    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;

    return Math.sqrt(variance);
  }

  private getLevelCategory(level: number): string {
    if (level < 20) return 'low';
    if (level < 50) return 'medium';
    return 'high';
  }

  private calculateConfidence(data: WastewaterReading[], daysAhead: number): number {
    const baseConfidence = 0.9;
    const dataQuality = data.reduce((sum, r) => sum + (r.confidence_score || 0.5), 0) / data.length;
    const timeDecay = Math.exp(-daysAhead * 0.1);

    return Math.min(0.95, baseConfidence * dataQuality * timeDecay);
  }

  async detectAnomalies(siteId: string, virusId: string): Promise<boolean> {
    const data = await this.fetchHistoricalData(siteId, virusId);

    if (data.length < 14) return false;

    const recent = data.slice(-3);
    const baseline = data.slice(-14, -3);

    const recentAvg = recent.reduce((sum, r) => sum + (r.concentration_level || 0), 0) / recent.length;
    const baselineAvg = baseline.reduce((sum, r) => sum + (r.concentration_level || 0), 0) / baseline.length;
    const baselineStd = this.calculateVolatility(baseline.map(r => r.concentration_level || 0));

    const threshold = baselineAvg + 2 * baselineStd;

    return recentAvg > threshold;
  }
}

export const predictionEngine = PredictionEngine.getInstance();
