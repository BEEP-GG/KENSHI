// Types for the character creation process
export type Attribute = 'strength' | 'dexterity' | 'perception' | 'constitution' | 'will' | 'intelligence' | 'charisma';

export interface Attributes {
  strength: number;
  dexterity: number;
  perception: number;
  constitution: number;
  will: number;
  intelligence: number;
  charisma: number;
}

export interface SquadMemberData {
  race: string;
  subrace: string;
  level: number;
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
  customTraitName: string;
  customTraitDescription: string;
}

export type CustomArmorType = '重甲' | '中甲' | '轻甲';
export type CustomWeaponType = '武士刀类' | '钝器类' | '军刀类' | '砍刀类' | '长柄刀类' | '大型类' | '弓' | '弩';

export interface CustomStartData {
  script: string;
  customRaceName: string;
  customRaceDescription: string;
  armorType: CustomArmorType;
  armorDr: number;
  weaponName: string;
  weaponDiceSides: number;
  weaponType: CustomWeaponType;
  weaponCut: number;
  weaponBlunt: number;
  weaponValue: number;
  weaponDescription: string;
  customItems: string;
}

export interface CharacterData {
  scenario: string;
  region: string;
  town: string;
  godModeEnabled: boolean;
  godModeLevel: number;
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
  customTraitName: string;
  customTraitDescription: string;
  customStart: CustomStartData;
  squadMembers: SquadMemberData[];
}

export const INITIAL_ATTRIBUTES: Attributes = {
  strength: 1,
  dexterity: 1,
  perception: 1,
  constitution: 1,
  will: 1,
  intelligence: 1,
  charisma: 1,
};

export const INITIAL_APPEARANCE = {
  eyes: '',
  hairStyle: '光头',
  hairColor: '黑色',
  bodyType: '',
  height: 180,
  description: '',
};

export const INITIAL_CUSTOM_START: CustomStartData = {
  script: '',
  customRaceName: '',
  customRaceDescription: '',
  armorType: '轻甲',
  armorDr: 0,
  weaponName: '',
  weaponDiceSides: 10,
  weaponType: '武士刀类',
  weaponCut: 0.8,
  weaponBlunt: 0.2,
  weaponValue: 0,
  weaponDescription: '',
  customItems: '',
};

export const INITIAL_SQUAD_MEMBER: SquadMemberData = {
  race: '',
  subrace: '',
  level: 1,
  attributes: INITIAL_ATTRIBUTES,
  name: '',
  gender: 'male',
  age: 25,
  appearance: INITIAL_APPEARANCE,
  traits: [],
  customTraitName: '',
  customTraitDescription: '',
};

const createInitialSquadMember = (): SquadMemberData => ({
  ...INITIAL_SQUAD_MEMBER,
  attributes: { ...INITIAL_ATTRIBUTES },
  appearance: { ...INITIAL_APPEARANCE },
  traits: [],
});

export const INITIAL_CHARACTER: CharacterData = {
  scenario: '',
  region: '',
  town: '',
  godModeEnabled: false,
  godModeLevel: 1,
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
  customTraitName: '',
  customTraitDescription: '',
  customStart: { ...INITIAL_CUSTOM_START },
  squadMembers: Array.from({ length: 4 }, () => createInitialSquadMember()),
};
