export interface Goal {
    id: string;
    title: string;
    description?: string;
    targetDate: Date;
    progress: number; // percentage of completion
    milestones: Milestone[];
}

export interface Milestone {
    id: string;
    title: string;
    achieved: boolean;
    dateAchieved?: Date;
}