import { SpellIcon } from 'interface';
import { SpellLink } from 'interface';
import CombatLogParser from 'parser/core/CombatLogParser';
import PropTypes from 'prop-types';
import { ReactNode } from 'react';

interface Props {
  spellId: number;
  /** @deprecated We can figure out the rank with just the id, so no need to pass in */
  rank?: number;
  children: ReactNode;
  className?: string;
}

interface Context {
  parser: CombatLogParser;
}

const ConduitSpellText = ({ spellId, children, className }: Props, { parser }: Context) => {
  const { rank, itemLevel } = parser.selectedCombatant.conduitsByConduitID[spellId];
  return (
    <div className={`pad boring-text ${className || ''}`}>
      <label>
        <SpellIcon id={spellId} /> <SpellLink id={spellId} icon={false} ilvl={itemLevel} /> - Rank{' '}
        {rank}
      </label>
      <div className="value">{children}</div>
    </div>
  );
};
ConduitSpellText.contextTypes = {
  parser: PropTypes.object.isRequired,
};

export default ConduitSpellText;
