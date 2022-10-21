import { formatNumber } from 'common/format';
import SPELLS from 'common/SPELLS';
import { TALENTS_MONK } from 'common/TALENTS';
import { SpellLink } from 'interface';
import Analyzer, { Options, SELECTED_PLAYER } from 'parser/core/Analyzer';
import { calculateEffectiveHealing } from 'parser/core/EventCalculateLib';
import Events, { HealEvent } from 'parser/core/Events';
import Combatants from 'parser/shared/modules/Combatants';
import ItemHealingDone from 'parser/ui/ItemHealingDone';
import Statistic from 'parser/ui/Statistic';
import STATISTIC_CATEGORY from 'parser/ui/STATISTIC_CATEGORY';
import STATISTIC_ORDER from 'parser/ui/STATISTIC_ORDER';
import TalentSpellText from 'parser/ui/TalentSpellText';

import { ABILITIES_AFFECTED_BY_HEALING_INCREASES } from '../../constants';
import HotTrackerMW from '../core/HotTrackerMW';

const MIST_WRAP_EXTENSION = 1000;
const HOT_INCREASE_SPELLS = ABILITIES_AFFECTED_BY_HEALING_INCREASES;

class MistWrap extends Analyzer {
  static dependencies = {
    hotTracker: HotTrackerMW,
    combatants: Combatants,
  };
  protected combatants!: Combatants;
  protected hotTracker!: HotTrackerMW;
  hotInfo: Map<string, HotInfo> = new Map<string, HotInfo>();

  envbEffectiveHealing: number = 0;
  envbOverHealing: number = 0;
  envmEffectiveHealing: number = 0;
  envmOverHealing: number = 0;

  envmHealingBoost: number = 0;
  envbHealingBoost: number = 0;

  constructor(options: Options) {
    super(options);
    this.active = this.selectedCombatant.hasTalent(TALENTS_MONK.MIST_WRAP_TALENT.id);
    if (!this.active) {
      return;
    }
    this.addEventListener(
      Events.heal
        .by(SELECTED_PLAYER)
        .spell([SPELLS.ENVELOPING_BREATH_HEAL, TALENTS_MONK.ENVELOPING_MIST_TALENT]),
      this.hotHeal,
    );
    this.addEventListener(Events.heal.by(SELECTED_PLAYER), this.genericHeal);
  }

  hotHeal(event: HealEvent) {
    const targetId = event.targetID;
    const spellId = event.ability.guid;
    if (!this.hotTracker.hots[targetId] || !this.hotTracker.hots[targetId][spellId]) {
      return;
    }
    const hot = this.hotTracker.hots[targetId][spellId];

    // count healing in last 1 second and attribute rest to RM
    if (this.hotTracker.fromMistyPeaks(hot) || hot.end - event.timestamp > MIST_WRAP_EXTENSION) {
      return;
    }
    if (spellId === SPELLS.ENVELOPING_BREATH_HEAL.id) {
      this.envbOverHealing += event.overheal || 0;
      this.envbEffectiveHealing += event.amount || 0;
    } else if (spellId === TALENTS_MONK.ENVELOPING_MIST_TALENT.id) {
      this.envmOverHealing += event.overheal || 0;
      this.envmEffectiveHealing += event.amount || 0;
    }
  }

  genericHeal(event: HealEvent) {
    const targetId = event.targetID;
    const spellId = event.ability.guid;
    if (
      !HOT_INCREASE_SPELLS.includes(spellId) ||
      !this.hotTracker.hots[targetId] ||
      (!this.hotTracker.hots[targetId][SPELLS.ENVELOPING_BREATH_HEAL.id] &&
        !this.hotTracker.hots[targetId][TALENTS_MONK.ENVELOPING_MIST_TALENT.id])
    ) {
      return;
    }

    // envm buff and envb buff stack
    const envbHot = this.hotTracker.hots[targetId][SPELLS.ENVELOPING_BREATH_HEAL.id];
    const envmHot = this.hotTracker.hots[targetId][TALENTS_MONK.ENVELOPING_MIST_TALENT.id];
    if (
      envbHot &&
      spellId !== SPELLS.ENVELOPING_BREATH_HEAL.id &&
      event.timestamp - envbHot.end < MIST_WRAP_EXTENSION
    ) {
      // boost by 10% if envb would have expired without mist wrap
      this.envbHealingBoost += calculateEffectiveHealing(event, 0.1);
    }

    if (envmHot && spellId !== TALENTS_MONK.ENVELOPING_MIST_TALENT.id) {
      // boost by 40% if env mist would have expired without mist wrap, otherwise 10%
      const boost =
        !this.hotTracker.fromMistyPeaks(envmHot) &&
        event.timestamp - envmHot.end < MIST_WRAP_EXTENSION
          ? 0.4
          : 0.1;
      this.envmHealingBoost += calculateEffectiveHealing(event, boost);
    }
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.OPTIONAL(70)}
        size="flexible"
        category={STATISTIC_CATEGORY.TALENTS}
        tooltip={
          <>
            <SpellLink id={TALENTS_MONK.ENVELOPING_BREATH_TALENT.id} />
            <br />
            Total Healing:{' '}
            {formatNumber(this.envbEffectiveHealing + this.envbOverHealing + this.envbHealingBoost)}
            <br />
            Effective Healing: {formatNumber(this.envbEffectiveHealing)}
            <br />
            Overhealing: {formatNumber(this.envbOverHealing)}
            <br />
            Healing Boost: {formatNumber(this.envbHealingBoost)}
            <br />
            <SpellLink id={TALENTS_MONK.ENVELOPING_MIST_TALENT.id} />
            <br />
            Total Healing:{' '}
            {formatNumber(this.envmEffectiveHealing + this.envmOverHealing + this.envmHealingBoost)}
            <br />
            Effective Healing: {formatNumber(this.envmEffectiveHealing)}
            <br />
            Overhealing: {formatNumber(this.envmOverHealing)}
            <br />
            Healing Boost: {formatNumber(this.envmHealingBoost)}
          </>
        }
      >
        <TalentSpellText talent={TALENTS_MONK.MIST_WRAP_TALENT}>
          <ItemHealingDone
            amount={
              this.envbEffectiveHealing +
              this.envbHealingBoost +
              this.envmHealingBoost +
              this.envmEffectiveHealing
            }
          />
        </TalentSpellText>
      </Statistic>
    );
  }
}

export default MistWrap;

type HotInfo = {
  applyTimeStamp: number;
  playerAppliedTo: string;
};
