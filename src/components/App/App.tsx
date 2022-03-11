import React, { useState, useEffect, useCallback } from 'react';
import { Node, ExtNode } from 'relatives-tree/lib/types';
import ReactFamilyTree from 'react-family-tree';
import PinchZoomPan from '../PinchZoomPan/PinchZoomPan';
import FamilyNode from '../FamilyNode/FamilyNode';
import DataParser from '../DataParser/DataParser';

import averageTree from 'relatives-tree/samples/average-tree.json';

import styles from './App.module.css';

let myFam = [
  {
    "id": "HkqEDLvxE",
    "gender": "female",
    "parents": [],
    "siblings": [],
    "spouses": [{
      "id": "HkqEDLvxE1",
      "type": "married"
    }],
    "children": []
  },
  {
    "id": "HkqEDLvxE1",
    "gender": "male",
    "parents": [],
    "siblings": [],
    "spouses": [{
      "id": "HkqEDLvxE",
      "type": "married"
    }],
    "children": []
  },
];

const WIDTH = 70;
const HEIGHT = 80;

type Source = Array<Node>

export default React.memo<{}>(
  function App() {
    const [nodes, setNodes] = useState<Source>([]);
    const [myId, setMyId] = useState<string>('');
    const [rootId, setRootId] = useState<string>('');

    function setNewNodes(newNodes: Source){
        if (newNodes) {
          setNodes([]); // Avoid invalid references to unknown nodes
          setRootId(newNodes[0].id);
          setMyId(newNodes[0].id);
          setNodes(newNodes);
        }
    }
    useEffect(() => {
      const loadData = async () => {
        let newNodes;
        newNodes = myFam as Source;
        if (newNodes) {
          setNodes([]); // Avoid invalid references to unknown nodes
          setRootId(newNodes[0].id);
          setMyId(newNodes[0].id);
          setNodes(newNodes);
        }
      }

      loadData();
    }, [])

    const onResetClick = useCallback(() => setRootId(myId), [myId]);

    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            E-devlet Soyağacı görselleştirme
          </h1>
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
