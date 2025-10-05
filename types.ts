
export interface GameData {
  cash: number;
  materials: number;
  power: number;
  researchPoints: number;
  day: number;
}

export interface Quest {
  id: string;
  title: string;
  client: string;
  description: string;
  requirements: {
    materials: number;
    time: number; // in days
  };
  reward: {
    cash: number;
    research: number;
  };
}

export interface ActiveProcess {
  type: 'Manufacturing' | 'Material Resupply' | 'Product Delivery';
  quest: Quest;
  progress: number; // percentage
  daysRemaining: number;
}
