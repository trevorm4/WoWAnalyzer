import { formatNumber, formatPercentage } from 'common/format';
import SPELLS from 'common/SPELLS';
import { SpellIcon } from 'interface';
import Analyzer from 'parser/core/Analyzer';
import StatisticBox, { STATISTIC_ORDER } from 'parser/ui/StatisticBox';

// dependencies
import HolyWordChastise from '@wowanalyzer/priest-holy/src/modules/spells/holyword/HolyWordChastise';
import HolyWordSanctify from '@wowanalyzer/priest-holy/src/modules/spells/holyword/HolyWordSanctify';
import HolyWordSerenity from '@wowanalyzer/priest-holy/src/modules/spells/holyword/HolyWordSerenity';

class HolyWordWastedAmounts extends Analyzer {
  static dependencies = {
    sanctify: HolyWordSanctify,
    serenity: HolyWordSerenity,
    chastise: HolyWordChastise,
  };

  protected sanctify!: HolyWordSanctify;
  protected serenity!: HolyWordSerenity;
  protected chastise!: HolyWordChastise;

  statistic() {
    const percWastedVersusTotal =
      (this.serenity.holyWordWastedCooldown + this.sanctify.holyWordWastedCooldown) /
      (this.serenity.totalCooldownReduction + this.sanctify.totalCooldownReduction);

    return (
      <StatisticBox
        icon={<SpellIcon id={SPELLS.HOLY_WORDS.id} />}
        value={`${formatPercentage(percWastedVersusTotal)}%`}
        label="Wasted Holy Words reduction"
        tooltip={
          <>
            {formatNumber(this.serenity.holyWordWastedCooldown / 1000)}s wasted Serenity reduction
            (of {formatNumber(this.serenity.totalCooldownReduction / 1000)}s total)
            <br />
            {formatNumber(this.sanctify.holyWordWastedCooldown / 1000)}s wasted Sanctify reduction
            (of {formatNumber(this.sanctify.totalCooldownReduction / 1000)}s total)
            <br />
          </>
        }
        position={STATISTIC_ORDER.CORE(4)}
      />
    );
  }
}

export default HolyWordWastedAmounts;
