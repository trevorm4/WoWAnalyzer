import SPELLS from 'common/SPELLS';
import { TALENTS_MONK } from 'common/TALENTS';
import Analyzer, { Options, SELECTED_PLAYER } from 'parser/core/Analyzer';
import Events, { CastEvent } from 'parser/core/Events';
import DonutChart from 'parser/ui/DonutChart';
import Statistic from 'parser/ui/Statistic';
import STATISTIC_CATEGORY from 'parser/ui/STATISTIC_CATEGORY';
import { STATISTIC_ORDER } from 'parser/ui/StatisticsListBox';
import { SPELL_COLORS } from '../../constants';
import BoringSpellValueText from 'parser/ui/BoringSpellValueText';
import ItemHealingDone from 'parser/ui/ItemHealingDone';

const debug = false;

//TODO clean up and make easier to add triggers
class ThunderFocusTea extends Analyzer {
  castsTftRsk: number = 0;
  buffedRSK: number = 0;
  buffedREM: number = 0;
  buffedEnv: number = 0;
  buffedEF: number = 0;
  buffedVivify: number = 0;
  usedFirstEmpower: boolean = false;

  constructor(options: Options) {
    super(options);
    this.active = this.selectedCombatant.hasTalent(TALENTS_MONK.FOCUSED_THUNDER_TALENT.id);

    if (!this.active) {
      return;
    }

    this.addEventListener(
      Events.cast.by(SELECTED_PLAYER).spell(SPELLS.THUNDER_FOCUS_TEA),
      this.tftCast,
    );
    this.addEventListener(Events.cast.by(SELECTED_PLAYER), this.buffedCast);
  }

  tftCast(event: CastEvent) {
    this.usedFirstEmpower = false;
  }

  buffedCast(event: CastEvent) {
    if (this.usedFirstEmpower) {
      switch (event.ability.guid) {
        case TALENTS_MONK.RISING_SUN_KICK_TALENT.id: {
          this.buffedRSK += 1;
          break;
        }
        case TALENTS_MONK.RENEWING_MIST_TALENT.id: {
          this.buffedREM += 1;
          break;
        }
        case TALENTS_MONK.ENVELOPING_MIST_TALENT.id: {
          this.buffedEnv += 1;
          break;
        }
        case TALENTS_MONK.ESSENCE_FONT_TALENT.id: {
          this.buffedEF += 1;
          break;
        }
        case SPELLS.VIVIFY.id: {
          this.buffedVivify += 1;
          break;
        }
        default: {
          debug && console.log('TFT used on unknown ability id ' + event.ability.guid);
        }
      }
      this.usedFirstEmpower = false;
    } else {
      this.usedFirstEmpower = true;
    }
  }

  renderCastRatioChart() {
    const items = [
      {
        color: SPELL_COLORS.VIVIFY,
        label: 'Vivify',
        spellId: SPELLS.VIVIFY.id,
        value: this.buffedVivify,
      },
      {
        color: SPELL_COLORS.RENEWING_MIST,
        label: 'Renewing Mist',
        spellId: SPELLS.RENEWING_MIST.id,
        value: this.buffedREM,
      },
      {
        color: SPELL_COLORS.ENVELOPING_MIST,
        label: 'Enveloping Mists',
        spellId: SPELLS.ENVELOPING_MIST.id,
        value: this.buffedEnv,
      },
      {
        color: SPELL_COLORS.RISING_SUN_KICK,
        label: 'Rising Sun Kick',
        spellId: SPELLS.RISING_SUN_KICK.id,
        value: this.buffedRSK,
      },
      {
        color: SPELL_COLORS.ESSENCE_FONT,
        label: 'Essence Font',
        spellId: TALENTS_MONK.ESSENCE_FONT_TALENT.id,
        value: this.buffedEF,
      },
    ];

    return <DonutChart items={items} />;
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.CORE(20)}
        size="flexible"
        category={STATISTIC_CATEGORY.TALENTS}
      >
        <BoringSpellValueText spellId={TALENTS_MONK.FOCUSED_THUNDER_TALENT.id}>
          <ItemHealingDone amount={0} />
          <br />
        </BoringSpellValueText>
        <div className="pad">{this.renderCastRatioChart()}</div>
      </Statistic>
    );
  }
}

export default ThunderFocusTea;
