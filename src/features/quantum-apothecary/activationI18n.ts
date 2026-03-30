import type { Activation } from './types';

/** Map Activation.type / filter category → i18n key under quantumApothecary.types */
export function quantumActivationTypeKey(type: string): string {
  const map: Record<string, string> = {
    All: 'all',
    'Sacred Plant': 'sacredPlant',
    'Siddha Soma': 'siddhaSoma',
    Bioenergetic: 'bioenergetic',
    'Essential Oil': 'essentialOil',
    'Ayurvedic Herb': 'ayurvedicHerb',
    Mineral: 'mineral',
    Mushroom: 'mushroom',
    Adaptogen: 'adaptogen',
    avataric: 'avataric',
    plant_deva: 'plantDeva',
  };
  return map[type] || type.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '_');
}

export type QuantumT = (key: string, fallbackOrOpts?: string | Record<string, unknown>) => string;

export function activationName(t: QuantumT, act: Activation): string {
  return t(`quantumApothecary.activations.${act.id}.name`, act.name);
}

export function activationBenefit(t: QuantumT, act: Activation): string {
  return t(`quantumApothecary.activations.${act.id}.benefit`, act.benefit);
}

export function activationSignature(t: QuantumT, act: Activation): string {
  return t(`quantumApothecary.activations.${act.id}.signature`, act.vibrationalSignature);
}

export function activationTypeLabel(t: QuantumT, act: Activation): string {
  const k = quantumActivationTypeKey(act.type);
  return t(`quantumApothecary.types.${k}`, act.type);
}

export function categoryTabLabel(t: QuantumT, cat: string): string {
  return t(`quantumApothecary.lib.categories.${quantumActivationTypeKey(cat)}`, cat);
}
