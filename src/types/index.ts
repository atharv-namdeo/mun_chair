// Central type definitions for MUN Chair Pro

export type SessionStatus = 'setup' | 'active' | 'recess' | 'closed';
export type CaucusType = 'moderated' | 'unmoderated' | 'formal';
export type MotionType =
  | 'open_debate'
  | 'close_debate'
  | 'mod_caucus'
  | 'unmod_caucus'
  | 'adjourn'
  | 'table'
  | 'recess'
  | 'divide_question'
  | 'reconsider'
  | 'extend_time';
export type VoteType = 'procedural' | 'substantive';
export type PointType = 'POI' | 'POO' | 'PPP' | 'PI' | 'RoR';
export type ChairRuling = 'sustained' | 'overruled' | 'pending';
export type YieldType = 'chair' | 'delegate' | 'questions' | 'none';
export type TimerState = 'idle' | 'running' | 'paused' | 'expired';

export interface Session {
  id: string;
  name: string;
  committee: string;
  topic: string;
  conference: string;
  status: SessionStatus;
  caucusType: CaucusType | null;
  speakingTimeSeconds: number;
  totalSessionSeconds: number;
  sessionStartAt: number | null; // unix ms
  quorumCount: number;
  totalDelegates: number;
  crisisMode: boolean;
  crisisTag: string;
  timerState: {
    speakerTimer: SerializedTimer;
    caucusTimer: SerializedTimer;
    unmodTimer: SerializedTimer;
  };
  settings: SessionSettings;
  createdAt: number;
  updatedAt: number;
}

export interface SerializedTimer {
  state: TimerState;
  totalSeconds: number;
  elapsedSeconds: number;
  lastTickAt: number | null;
}

export interface SessionSettings {
  engagementWeights: EngagementWeights;
  timeEquityThresholdMultiplier: number; // e.g. 2.0 = warn if >2x average
  undoStackSize: number;
  audioAlertsEnabled: boolean;
  ambertThresholdPercent: number; // e.g. 25 = amber when 25% time left
  redThresholdPercent: number; // e.g. 10 = red when 10% time left
}

export interface EngagementWeights {
  speech: number;
  poiAsked: number;
  poiAnswered: number;
  motion: number;
  point: number;
  vote: number;
  rightOfReply: number;
}

export interface Delegate {
  id: string;
  sessionId: string;
  country: string;
  bloc: string;
  delegateName: string;
  isPresent: boolean;
  isDeleted: boolean; // soft delete
  totalSpeechSeconds: number;
  speechCount: number;
  poiAskedCount: number;
  poiAnsweredCount: number;
  motionCount: number;
  pointCount: number;
  voteCount: number;
  rightOfReplyCount: number;
  engagementScore: number;
  createdAt: number;
  updatedAt: number;
}

export interface Speech {
  id: string;
  sessionId: string;
  delegateId: string;
  delegateCountry: string;
  startAt: number;
  endAt: number | null;
  allocatedSeconds: number;
  usedSeconds: number;
  yieldType: YieldType;
  yieldedToDelegateId: string | null;
  isCrisis: boolean;
  crisisTag: string;
  caucusRound: number;
  createdAt: number;
}

export interface POI {
  id: string;
  sessionId: string;
  speechId: string; // linked to interrupted speech
  askerDelegateId: string;
  askerCountry: string;
  responderDelegateId: string | null;
  questionText: string;
  qualityScore: number | null; // 1-5
  replyScore: number | null; // 1-5
  wasAllowed: boolean;
  createdAt: number;
}

export interface Motion {
  id: string;
  sessionId: string;
  proposerDelegateId: string;
  proposerCountry: string;
  type: MotionType;
  description: string;
  speakingTimeSeconds: number | null; // for mod caucus
  caucusDurationSeconds: number | null;
  voteThreshold: 'simple' | 'two_thirds' | 'unanimous';
  voteType: VoteType;
  status: 'pending' | 'voting' | 'passed' | 'failed' | 'withdrawn';
  forVotes: number;
  againstVotes: number;
  abstentions: number;
  createdAt: number;
  resolvedAt: number | null;
}

export interface Point {
  id: string;
  sessionId: string;
  delegateId: string;
  delegateCountry: string;
  type: PointType;
  questionText: string; // for POI / PI
  chairRuling: ChairRuling;
  chairRemarks: string;
  linkedSpeechId: string | null; // POI links to a speech
  createdAt: number;
}

export interface Vote {
  id: string;
  sessionId: string;
  motionId: string;
  delegateId: string;
  delegateCountry: string;
  vote: 'for' | 'against' | 'abstain';
  createdAt: number;
}

export interface TimelineEvent {
  id: string;
  sessionId: string;
  type: string; // e.g. 'speech_start', 'poi_raised', 'motion_passed'
  description: string;
  delegateId: string | null;
  delegateCountry: string | null;
  metadata: Record<string, unknown>;
  isUndoable: boolean;
  undoneAt: number | null;
  createdAt: number;
}

export interface SpeakerQueueEntry {
  delegateId: string;
  country: string;
  addedAt: number;
}

export interface Resolution {
  id: string;
  sessionId: string;
  title: string;
  code: string; // e.g., DR 1.1
  status: 'working_paper' | 'draft_resolution' | 'amendment' | 'passed' | 'failed';
  sponsors: string[]; // delegateIds
  signatories: string[]; // delegateIds
  contentUrl?: string; // Link to Google Doc/PDF
  createdAt: number;
}

export interface CrisisMessage {
  id: string;
  sessionId: string;
  title: string;
  content: string;
  type: 'update' | 'alert' | 'directive';
  isFlash: boolean;
  createdAt: number;
}

