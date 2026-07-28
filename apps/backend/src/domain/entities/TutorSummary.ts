export interface TutorSummarySection {
    id: string;
    type: 'principles' | 'structure' | 'reminder';
    title: string;
    icon: string;
    content: string[];
}

export interface TutorSummary {
    id: string;
    topicId: string;
    topicTitle: string;
    oposicion: string;
    sections: TutorSummarySection[];
    updatedAt: Date;
}
