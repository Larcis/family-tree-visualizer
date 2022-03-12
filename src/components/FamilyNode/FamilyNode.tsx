import React from 'react';
import classNames from 'classnames';
import { ExtNode } from 'relatives-tree/lib/types';
import styles from './FamilyNode.module.css';

interface Props {
  node: ExtNode;
  isRoot: boolean;
  onSubClick: (id: string) => void;
  style?: React.CSSProperties;
  showDead: boolean;
}

export default React.memo<Props>(
  function FamilyNode({ node, isRoot, onSubClick, style, showDead }) {
    let human:any
    human = node
    human = human.extra; 
    return (
      <div className={styles.root} style={{...style, opacity: (!showDead && !human.isAlive) ? 0 : 1 }} title={node.id}>
        <div
          className={classNames(
            styles.inner,
            styles[node.gender],
            isRoot && styles.isRoot,
          )}
        >
          <p style={{
            width: "100%",
            textAlign: "center"
          }}>
            {human.name}<br/>
            {human.surname}<br/>
            {human.birthDate}<br/>
            {!human.isAlive && human.deathDate}
          </p>
        </div>
        {node.hasSubTree && (
          <div
            className={classNames(styles.sub, styles[node.gender])}
            onClick={() => onSubClick(node.id)}
          />
        )}
      </div>
    );
  }
);
