import React from 'react';

// Types for the character creation process
export type Attribute = 'strength' | 'dexterity' | 'perception' | 'constitution' | 'willpower' | 'intelligence' | 'charisma';

export interface Attributes {
  strength: number;
  dexterity: number;
  perception: number;
  constitution: number;
  willpower: number;
  intelligence: number;
  charisma: number;
}

export interface CharacterData {
  scenario: string;
  region: string;
  town: string;
  race: string;
  subrace: string;
  attributes: Attributes;
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  appearance: {
    eyes: string;
    hairStyle: string;
    hairColor: string;
    bodyType: string;
    height: number; // in cm
    description: string;
  };
  traits: string[];
  customTraits: string;
}

export const INITIAL_ATTRIBUTES: Attributes = {
  strength: 1,
  dexterity: 1,
  perception: 1,
  constitution: 1,
  willpower: 1,
  intelligence: 1,
  charisma: 1,
};

export const INITIAL_CHARACTER: CharacterData = {
  scenario: '',
  region: '',
  town: '',
  race: '',
  subrace: '',
  attributes: INITIAL_ATTRIBUTES,
  name: '',
  gender: 'male',
  age: 25,
  appearance: {
    eyes: '',
    hairStyle: '光头',
    hairColor: '黑色',
    bodyType: '',
    height: 180,
    description: '',
  },
  traits: [],
  customTraits: '',
};
