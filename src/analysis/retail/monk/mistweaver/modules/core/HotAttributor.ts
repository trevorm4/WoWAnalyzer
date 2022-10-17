import SPELLS from 'common/SPELLS';
import { TALENTS_MONK } from 'common/TALENTS';
import Analyzer, { Options, SELECTED_PLAYER } from 'parser/core/Analyzer';
import Events, {
  AnyEvent,
  ApplyBuffEvent,
  EventType,
  GetRelatedEvents,
  RefreshBuffEvent,
  RemoveBuffEvent,
} from 'parser/core/Events';
import HotTracker, { Attribution } from 'parser/shared/modules/HotTracker';
import { isFromHardcast, isFromMistyPeaks } from '../../normalizers/CastLinkNormalizer';
import HotTrackerMW from '../core/HotTrackerMW';

const debug = false;

class HotAttributor extends Analyzer {
  static dependencies = {
    hotTracker: HotTrackerMW,
  };

  protected hotTracker!: HotTrackerMW;
  envMistHardcastAttrib = HotTracker.getNewAttribution('Enveloping Mist Hardcast');
  envMistMistyPeaksAttrib = HotTracker.getNewAttribution('Enveloping Mist Misty Peaks Proc');
  REMHardcastAttrib = HotTracker.getNewAttribution('Renewing Mist Hardcast');
  EFAttrib = HotTracker.getNewAttribution('Essence Font Hardcast');

  constructor(options: Options) {
    super(options);
    this.addEventListener(
      Events.applybuff.by(SELECTED_PLAYER).spell(SPELLS.RENEWING_MIST_HEAL),
      this.onApplyRem,
    );
    this.addEventListener(
      Events.applybuff
        .by(SELECTED_PLAYER)
        .spell([TALENTS_MONK.ENVELOPING_MIST_TALENT, SPELLS.ENVELOPING_MIST_TFT]),
      this.onApplyEnvm,
    );
    this.addEventListener(
      Events.applybuff.by(SELECTED_PLAYER).spell([SPELLS.ESSENCE_FONT_BUFF]),
      this.onApplyEF,
    );
  }

  castEvent(event: AnyEvent): RefreshBuffEvent | ApplyBuffEvent {
    if (event.type === EventType.RefreshBuff) {
      return event as RefreshBuffEvent;
    }
    return event as ApplyBuffEvent;
  }

  attributeBounces(event: ApplyBuffEvent | RefreshBuffEvent | RemoveBuffEvent) {
    const relatedEvents = GetRelatedEvents(event, 'Bounced');
    if (event.type === EventType.RemoveBuff) {
      for (let i = 0; i < relatedEvents.length; i += 1) {
        this.attributeBounces(this.castEvent(relatedEvents[i]));
      }
    }
    if (
      !this.hotTracker.hots[event.targetID] ||
      !this.hotTracker.hots[event.targetID][event.ability.guid] ||
      this.hotTracker.hots[event.targetID][event.ability.guid].attributions.length > 0
    ) {
      return;
    }
    this.hotTracker.addAttributionFromApply(this.REMHardcastAttrib, this.castEvent(event));

    for (let i = 0; i < relatedEvents.length; i += 1) {
      const linkedEvent = relatedEvents[i];
      if (linkedEvent.type === EventType.ApplyBuff || linkedEvent.type === EventType.RefreshBuff) {
        this.attributeBounces(linkedEvent);
      }
    }
  }

  onApplyRem(event: ApplyBuffEvent | RefreshBuffEvent) {
    if (event.prepull || isFromHardcast(event)) {
      debug && console.log(event.ability.name + ' true ' + event.targetID + ' ' + event.timestamp);
      this.hotTracker.addAttributionFromApply(this.REMHardcastAttrib, event);
      this.attributeBounces(event);
    }
  }

  onApplyEnvm(event: ApplyBuffEvent | RefreshBuffEvent) {
    if (event.prepull || isFromHardcast(event)) {
      this.hotTracker.addAttributionFromApply(this.envMistHardcastAttrib, event);
      debug &&
        console.log(
          'Attributed Enveloping Mist hardcast at ' + this.owner.formatTimestamp(event.timestamp),
        );
    } else if (isFromMistyPeaks(event)) {
      debug &&
        console.log(
          'Attributed Misty Peaks Enveloping Mist at ' +
            this.owner.formatTimestamp(event.timestamp),
        );
      this.hotTracker.addAttributionFromApply(this.envMistMistyPeaksAttrib, event);
    }
  }

  onApplyEF(event: ApplyBuffEvent | RefreshBuffEvent) {
    this.hotTracker.addAttributionFromApply(this.EFAttrib, event);
  }

  _logAttrib(event: ApplyBuffEvent | RefreshBuffEvent, attrib: Attribution | string | undefined) {
    if (attrib === undefined) {
      console.warn(
        'Could not attribute ' +
          event.ability.name +
          ' on ' +
          event.targetID +
          ' @ ' +
          this.owner.formatTimestamp(event.timestamp) +
          '!',
      );
    } else {
      debug &&
        console.log(
          'Attributed ' +
            event.ability.name +
            ' on ' +
            event.targetID +
            ' @ ' +
            this.owner.formatTimestamp(event.timestamp) +
            ' to ' +
            (typeof attrib === 'object' ? attrib.name : attrib),
        );
    }
  }
}

export default HotAttributor;
