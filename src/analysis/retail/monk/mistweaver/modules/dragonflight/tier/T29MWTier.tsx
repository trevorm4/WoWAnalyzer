import Analyzer, { Options, SELECTED_PLAYER } from 'parser/core/Analyzer';
import { calculateEffectiveHealing } from 'parser/core/EventCalculateLib';
import { formatDuration, formatNumber } from 'common/format';
import SPELLS from 'common/SPELLS';
import { TALENTS_MONK } from 'common/TALENTS';
//import { TIERS } from 'game/TIERS';
import Events, { HealEvent, ApplyBuffEvent } from 'parser/core/Events';
import BoringValueText from 'parser/ui/BoringValueText';
import ItemHealingDone from 'parser/ui/ItemHealingDone';
import Statistic from 'parser/ui/Statistic';
import STATISTIC_CATEGORY from 'parser/ui/STATISTIC_CATEGORY';
import STATISTIC_ORDER from 'parser/ui/STATISTIC_ORDER';
import HotTracker from 'parser/shared/modules/HotTracker';
import HotTrackerMW from '../../core/HotTrackerMW';
import SpellLink from 'interface/SpellLink';

const TWO_PIECE_BONUS = 0.1;
const FOUR_PIECE_BONUS = 0.1;
const FOUR_PIECE_EXTENSION = 1000;
const ATTRIBUTION_PREFIX = '4 Piece extension #';

const TWO_PIECE_SPELLS = [
  TALENTS_MONK.ESSENCE_FONT_TALENT,
  SPELLS.ESSENCE_FONT_BUFF,
  SPELLS.FAELINE_STOMP_ESSENCE_FONT,
  TALENTS_MONK.ENVELOPING_MIST_TALENT,
  SPELLS.VIVIFY,
];

const FOUR_PIECE_SPELLS = [
  TALENTS_MONK.ESSENCE_FONT_TALENT,
  SPELLS.ESSENCE_FONT_BUFF,
  SPELLS.VIVIFY,
];

class T29TierSet extends Analyzer {
  static dependencies = {
    hotTracker: HotTrackerMW,
  };
  hotTracker!: HotTrackerMW;
  has2Piece: boolean = true;
  has4Piece: boolean = true;
  numExtensions: number = 0;
  totalExtensionDuration: number = 0;
  twoPieceHealing: number = 0;
  fourPieceHealing: number = 0;
  extraRemHealing: number = 0;
  extraRemAbsorbed: number = 0;
  extraRemOverhealing: number = 0;
  extraVivCleaves: number = 0;
  extraVivHealing: number = 0;
  extraVivOverhealing: number = 0;
  extraVivAbsorbed: number = 0;

  constructor(options: Options) {
    super(options);
    this.has2Piece = true; //this.selectedCombatant.has2PieceByTier(TIERS.T29);
    this.has4Piece = true; //this.selectedCombatant.has4PieceByTier(TIERS.T29);
    this.active = this.has2Piece || this.has4Piece;
    if (!this.active) {
      return;
    }
    this.addEventListener(
      Events.applybuff
        .by(SELECTED_PLAYER)
        .spell([SPELLS.ESSENCE_FONT_BUFF, SPELLS.FAELINE_STOMP_ESSENCE_FONT]),
      this.handleEfBolt,
    );
    this.addEventListener(
      Events.heal.by(SELECTED_PLAYER).spell(TWO_PIECE_SPELLS),
      this.handle2PcHeal,
    );
    if (this.has4Piece) {
      this.addEventListener(
        Events.heal.by(SELECTED_PLAYER).spell(FOUR_PIECE_SPELLS),
        this.handle4PcHeal,
      );
      this.addEventListener(
        Events.heal.by(SELECTED_PLAYER).spell(SPELLS.VIVIFY),
        this.handle4PcVivify,
      );
      this.addEventListener(
        Events.heal.by(SELECTED_PLAYER).spell(SPELLS.RENEWING_MIST_HEAL),
        this.handleRemTick,
      );
    }
  }

  handleEfBolt(event: ApplyBuffEvent) {
    const playerId = event.targetID;
    if (
      !this.hotTracker.hots[playerId] ||
      !this.hotTracker.hots[playerId][SPELLS.RENEWING_MIST_HEAL.id]
    ) {
      return;
    }
    const attribution = HotTracker.getNewAttribution(ATTRIBUTION_PREFIX + this.numExtensions);
    this.hotTracker.hots[playerId][
      SPELLS.RENEWING_MIST_HEAL.id
    ].maxDuration! += FOUR_PIECE_EXTENSION;
    this.hotTracker.addExtension(
      attribution,
      FOUR_PIECE_EXTENSION,
      playerId,
      SPELLS.RENEWING_MIST_HEAL.id,
      event.timestamp,
    );

    this.numExtensions += 1;
    this.totalExtensionDuration += this.hotTracker.hots[playerId][
      SPELLS.RENEWING_MIST_HEAL.id
    ].extensions.at(-1)!.amount;
  }

  handle2PcHeal(event: HealEvent) {
    if (
      !this.hotTracker.hots[event.targetID] ||
      !this.hotTracker.hots[event.targetID][SPELLS.RENEWING_MIST_HEAL.id]
    ) {
      return;
    }
    this.twoPieceHealing += calculateEffectiveHealing(event, TWO_PIECE_BONUS);
  }

  handle4PcHeal(event: HealEvent) {
    this.fourPieceHealing += calculateEffectiveHealing(event, FOUR_PIECE_BONUS);
  }

  handle4PcVivify(event: HealEvent) {
    const targetId = event.targetID;
    if (
      !this.hotTracker.hots[targetId] ||
      !this.hotTracker.hots[targetId][SPELLS.RENEWING_MIST_HEAL.id]
    ) {
      return;
    }
    const hot = this.hotTracker.hots[targetId][SPELLS.RENEWING_MIST_HEAL.id];
    const extensionForVivify = this.hotTracker.getRemExtensionForTimestamp(hot, event.timestamp);
    if (extensionForVivify?.attribution.name.startsWith(ATTRIBUTION_PREFIX)) {
      this.extraVivCleaves += 1;
      this.extraVivHealing += event.amount || 0;
      this.extraVivOverhealing += event.overheal || 0;
      this.extraVivAbsorbed += event.absorbed || 0;
    }
  }

  handleRemTick(event: HealEvent) {
    const targetId = event.targetID;
    if (
      !this.hotTracker.hots[targetId] ||
      !this.hotTracker.hots[targetId][SPELLS.RENEWING_MIST_HEAL.id]
    ) {
      return;
    }
    const hot = this.hotTracker.hots[targetId][SPELLS.RENEWING_MIST_HEAL.id];
    const extension = this.hotTracker.getRemExtensionForTimestamp(hot, event.timestamp);
    if (extension?.attribution.name.startsWith(ATTRIBUTION_PREFIX)) {
      this.extraRemHealing += event.amount || 0;
      this.extraRemAbsorbed += event.absorbed || 0;
      this.extraRemOverhealing += event.overheal || 0;
    }
  }

  statistic() {
    return (
      <Statistic
        size="flexible"
        position={STATISTIC_ORDER.OPTIONAL(0)}
        category={STATISTIC_CATEGORY.ITEMS}
        tooltip={
          <ul>
            <li>
              {formatDuration(this.totalExtensionDuration)} extra seconds of{' '}
              <SpellLink id={SPELLS.RENEWING_MIST_HEAL.id} />
            </li>
            <li>
              {this.extraVivCleaves} extra <SpellLink id={SPELLS.VIVIFY.id} /> cleaves from
              extensions
            </li>
            <li>
              {formatNumber(this.extraVivOverhealing)} extra <SpellLink id={SPELLS.VIVIFY.id} />{' '}
              overhealing
            </li>
            <li>
              {formatNumber(this.extraVivAbsorbed)} extra <SpellLink id={SPELLS.VIVIFY.id} />{' '}
              healing absorbed
            </li>
            <li>
              {formatNumber(this.extraRemHealing)} extra{' '}
              <SpellLink id={TALENTS_MONK.RENEWING_MIST_TALENT.id} /> healing
            </li>
            <li>
              {formatNumber(this.extraRemAbsorbed)} extra{' '}
              <SpellLink id={TALENTS_MONK.RENEWING_MIST_TALENT.id} /> healing absorbed
            </li>
            <li>
              {formatNumber(this.extraRemOverhealing)} extra{' '}
              <SpellLink id={SPELLS.RENEWING_MIST_HEAL.id} /> overhealing
            </li>
          </ul>
        }
      >
        <BoringValueText label="T29 Tier Set">
          <h4>2 Piece</h4>
          <ItemHealingDone amount={this.twoPieceHealing} />
          {this.has4Piece && (
            <>
              <h4>4 Piece</h4>
              <ItemHealingDone
                amount={this.fourPieceHealing + this.extraRemHealing + this.extraVivHealing}
              />
            </>
          )}
        </BoringValueText>
      </Statistic>
    );
  }
}

export default T29TierSet;
