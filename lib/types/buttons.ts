import { buttonsMap } from '../utils/buttons';

export interface ButtonOptions {
  name: keyof typeof buttonsMap;
  disabled: boolean;
  label?: string;
}

export interface StringSelectMenuOptions {
  label: string;
  value: string;
}
