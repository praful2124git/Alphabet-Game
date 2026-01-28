
export type GameStatus = 'MENU' | 'COUNTDOWN' | 'PLAYING' | 'VALIDATING' | 'ROUND_RESULT' | 'GAME_OVER';

export type GameMode = 'SINGLE' | 'MULTI_HOST' | 'MULTI_GUEST';

export interface GameConfig {
  duration: number; // seconds
}

export interface PlayerProfile {
  name: string;
  avatar: string; // Emoji character
}

export interface GameInputs {
  name: string;
  place: string;
  animal: string;
  thing: string;
}

export interface ValidationItem {
  valid: boolean;
  score: number;
  message: string;
}

export interface ValidationResult {
  name: ValidationItem;
  place: ValidationItem;
  animal: ValidationItem;
  thing: ValidationItem;
  totalRoundScore: number;
}

export interface RoundHistory {
  letter: string;
  inputs: GameInputs;
  result: ValidationResult;
}

export enum Category {
  NAME = 'Name',
  PLACE = 'Place',
  ANIMAL = 'Animal',
  THING = 'Thing'
}

// Multiplayer Messages
export type MultiplayerMessage = 
  | { type: 'JOINED'; profile: PlayerProfile }
  | { type: 'WELCOME'; profile: PlayerProfile }
  | { type: 'START_ROUND'; letter: string; roundIndex: number; totalRounds: number; duration: number }
  | { type: 'STOP_ROUND' }
  | { type: 'SUBMIT_ANSWERS'; inputs: GameInputs; validation: ValidationResult; roundIndex: number }
  | { type: 'PLAY_AGAIN' }
  | { type: 'GAME_OVER' };
