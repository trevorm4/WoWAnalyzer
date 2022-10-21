import SPELLS from 'common/SPELLS';
import TALENTS from 'common/TALENTS/priest';
import { SpellFilter } from 'parser/core/EventFilter';
import { TALENTS_PRIEST } from 'common/TALENTS';
export const DISCIPLINE_ABILITIES_AFFECTED_BY_HEALING_INCREASES = [
  SPELLS.ATONEMENT_HEAL_NON_CRIT.id,
  SPELLS.ATONEMENT_HEAL_CRIT.id,
  SPELLS.POWER_WORD_SHIELD.id,
  SPELLS.POWER_WORD_RADIANCE.id,
  SPELLS.HALO_TALENT.id,
  SPELLS.SHADOW_MEND.id,
  // While the following spells don't double dip in healing increases, they gain the same percentual bonus from the transfer
  SPELLS.LEECH.id,
];

export const ATONEMENT_DAMAGE_SOURCES = {
  [SPELLS.MAGIC_MELEE.id]: true, // Shadow Fiend Melee
  [SPELLS.LIGHTSPAWN_MELEE.id]: true, // Lightspawn Melee
  [SPELLS.SMITE.id]: true,
  [SPELLS.PENANCE.id]: true,
  [SPELLS.HALO_DAMAGE.id]: true,
  [SPELLS.SHADOW_WORD_PAIN.id]: true,
  [TALENTS_PRIEST.SHADOWFIEND_TALENT.id]: true,
  [TALENTS_PRIEST.PURGE_THE_WICKED_TALENT.id]: true,
  [SPELLS.PURGE_THE_WICKED_BUFF.id]: true,
  [TALENTS_PRIEST.POWER_WORD_SOLACE_TALENT.id]: true,
  [TALENTS_PRIEST.SCHISM_TALENT.id]: true,
  [SPELLS.DIVINE_STAR_DAMAGE.id]: true,
  [TALENTS.HOLY_NOVA_TALENT.id]: true,
  [SPELLS.MIND_SEAR.id]: true,
  [SPELLS.MIND_BLAST.id]: true,
  [TALENTS_PRIEST.MINDGAMES_TALENT.id]: true,
  [SPELLS.EXPIATION_DAMAGE.id]: true,
  [SPELLS.MINDGAMES_HEAL_REVERSAL.id]: true,
  [TALENTS_PRIEST.SHADOW_WORD_DEATH_TALENT.id]: true,
  [TALENTS_PRIEST.LIGHTS_WRATH_TALENT.id]: true,
  [TALENTS_PRIEST.INESCAPABLE_TORMENT_TALENT.id]: true,
};

export const ATONEMENT_SOURCE_FILTER: SpellFilter = [
  SPELLS.MAGIC_MELEE,
  SPELLS.LIGHTSPAWN_MELEE,
  SPELLS.SMITE,
  SPELLS.PENANCE,
  SPELLS.HALO_DAMAGE,
  SPELLS.SHADOW_WORD_PAIN,
  SPELLS.PURGE_THE_WICKED_TALENT,
  SPELLS.PURGE_THE_WICKED_BUFF,
  TALENTS_PRIEST.POWER_WORD_SOLACE_TALENT,
  TALENTS_PRIEST.SCHISM_TALENT,
  SPELLS.DIVINE_STAR_DAMAGE,
  TALENTS.HOLY_NOVA_TALENT,
  SPELLS.MIND_SEAR,
  SPELLS.MIND_BLAST,
  TALENTS_PRIEST.MINDGAMES_TALENT,
  SPELLS.MINDGAMES_HEAL_REVERSAL,
  SPELLS.ASCENDED_BLAST,
  SPELLS.ASCENDED_NOVA,
  SPELLS.ASCENDED_ERUPTION,
];

export const SPIRIT_SHELL_COEFFICIENT = 0.8;
export const ATONEMENT_COEFFICIENT = 0.5;
export const DISCIPLINE_DAMAGE_AURA_VALUE = 0.94;

export const PENANCE_COEFFICIENCT = 0.4;
export const SMITE_COEFFICIENT = 0.47;

export const POWER_WORD_SHIELD_ATONEMENT_DUR = 15000;
export const POWER_WORD_RADIANCE_ATONEMENT_DUR = 9000;
export const RENEW_ATONEMENT_DUR = 15000;
export const FLASH_HEAL_ATONEMENT_DUR = 15000;
