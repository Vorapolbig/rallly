export type SimpleVoteType = "yes" | "no";

export interface ParticipantForm {
  votes: Array<
    | {
        optionId: string;
        type?: SimpleVoteType;
      }
    | undefined
  >;
}

export interface ParticipantFormSubmitted {
  votes: Array<{ optionId: string; type: SimpleVoteType }>;
}
