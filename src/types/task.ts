export interface Task {
    id: string;
    title: string;
    description?: string;
    dueDate?: Date;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    createdAt: Date;
    updatedAt: Date;
}

export interface TaskFilter {
    searchTerm?: string;
    completed?: boolean;
    priority?: 'low' | 'medium' | 'high';
    dueDateRange?: {
        startDate?: Date;
        endDate?: Date;
    };
}