export interface TutorPodcastEpisode {
    id: string;
    oposicion: string;
    topicId: string;
    title: string;
    totalSeconds: number;
    createdAt: Date;
}

export interface TutorPodcastProgress {
    userId: string;
    episodeId: string;
    positionSecs: number;
    updatedAt: Date;
}
