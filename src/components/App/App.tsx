import React, { useState, useCallback } from 'react';
import { Node, ExtNode } from 'relatives-tree/lib/types';
import ReactFamilyTree from 'react-family-tree';
import PinchZoomPan from '../PinchZoomPan/PinchZoomPan';
import FamilyNode from '../FamilyNode/FamilyNode';
import DataParser from '../DataParser/DataParser';

import styles from './App.module.css';

const WIDTH = 120;
const HEIGHT = 130;

type Source = Array<Node>

export default React.memo<{}>(
  function App() {
    const [nodes, setNodes] = useState<Source>([]);
    const [myId, setMyId] = useState<string>('');
    const [rootId, setRootId] = useState<string>('');
    const [showDead, setShowDead] = useState(true);
    
    function setNewNodes(newNodes: Source, rootId: string, myId: string){
        if (newNodes) {
          setNodes([]); // Avoid invalid references to unknown nodes
          setRootId(rootId);
          setMyId(myId);
          setNodes(newNodes);
        }
    }

    const onResetClick = useCallback(() => setRootId(myId), [myId]);

    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            E-devlet Soyağacı görselleştirme
          </h1>
          <div>
            <input type="checkbox" onChange={(e)=>{
              setShowDead(e.target.checked)
            }} defaultChecked/>
          </div>
          <div>
            <input type="text" defaultValue="Annesi,Babası,Kendisi" id="relationKeywordBases"/>
          </div>
          <div>
            <DataParser setData={setNewNodes}></DataParser>
          </div>
        </header>
        {nodes.length > 0 && (
          <PinchZoomPan
            min={0.5}
            max={2.5}
            captureWheel
            className={styles.wrapper}
          >
            <ReactFamilyTree
              nodes={nodes as Node[]}
              rootId={rootId}
              width={WIDTH}
              height={HEIGHT}
              className={styles.tree}
              renderNode={(node: ExtNode) => (
                <FamilyNode
                  showDead={showDead}
                  key={node.id}
                  node={node}
                  isRoot={node.id === rootId}
                  onSubClick={setRootId}
                  style={{
                    width: WIDTH,
                    height: HEIGHT,
                    transform: `translate(${node.left * (WIDTH / 2)}px, ${node.top * (HEIGHT / 2)}px)`,
                  }}
                />
              )}
            />
          </PinchZoomPan>
        )}
        {rootId !== myId && (
          <div className={styles.reset} onClick={onResetClick}>
            Reset
          </div>
        )}
      </div>
    );
  }
);
